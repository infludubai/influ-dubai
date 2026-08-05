import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

const DEFAULT_FEE_PERCENT = 10;

/** Rounds to cents so stored money never carries float dust. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  private feePercent(): number {
    const raw = this.settings.getNumber('PLATFORM_FEE_PERCENT', DEFAULT_FEE_PERCENT);
    // A fee outside 0–100 would produce negative or absurd payouts.
    if (raw < 0 || raw > 100) {
      this.logger.warn(
        `PLATFORM_FEE_PERCENT is ${raw}, outside 0–100 — falling back to ${DEFAULT_FEE_PERCENT}%.`,
      );
      return DEFAULT_FEE_PERCENT;
    }
    return raw;
  }

  /**
   * Called when a deliverable is approved. Idempotent via the unique index on
   * deliverableId, so a repeated approval can never double-pay a creator.
   */
  async createForApprovedDeliverable(deliverableId: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        payout: true,
        campaign: { select: { id: true, title: true } },
        creatorProfile: { select: { id: true, userId: true } },
      },
    });
    if (!deliverable) return null;
    if (deliverable.payout) return deliverable.payout;

    const gross = deliverable.agreedRateUsd ?? 0;
    if (gross <= 0) {
      // Unpaid/barter deliverables are legitimate — just nothing to pay out.
      return null;
    }

    const feePercent = this.feePercent();
    const feeUsd = money((gross * feePercent) / 100);
    const netUsd = money(gross - feeUsd);

    const payout = await this.prisma.payout.create({
      data: {
        deliverableId,
        creatorProfileId: deliverable.creatorProfile.id,
        campaignId: deliverable.campaignId,
        grossUsd: money(gross),
        feePercent,
        feeUsd,
        netUsd,
      },
    });

    await this.notifications.create(deliverable.creatorProfile.userId, {
      type: 'PAYOUT',
      title: 'Payment pending',
      body: `$${netUsd.toLocaleString()} is queued for "${deliverable.title}" (after a ${feePercent}% platform fee).`,
      link: '/dashboard/creator/earnings',
    });

    return payout;
  }

  // ── Creator view ──────────────────────────────────────────────────────────

  async earningsFor(creatorUserId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      select: { id: true },
    });
    if (!creator) {
      return { payouts: [], totals: { pending: 0, paid: 0, lifetimeGross: 0, fees: 0 } };
    }

    const payouts = await this.prisma.payout.findMany({
      where: { creatorProfileId: creator.id },
      include: {
        deliverable: { select: { title: true, approvedAt: true } },
        campaign: { select: { id: true, title: true, brand: { select: { companyName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sum = (filter: (p: (typeof payouts)[number]) => boolean, field: 'netUsd' | 'grossUsd' | 'feeUsd') =>
      money(payouts.filter(filter).reduce((t, p) => t + p[field], 0));

    return {
      payouts,
      totals: {
        pending: sum((p) => p.status === 'PENDING' || p.status === 'PROCESSING', 'netUsd'),
        paid: sum((p) => p.status === 'PAID', 'netUsd'),
        lifetimeGross: sum(() => true, 'grossUsd'),
        fees: sum(() => true, 'feeUsd'),
      },
    };
  }

  // ── Admin view ────────────────────────────────────────────────────────────

  async listForAdmin(status?: string) {
    const where = status && status !== 'ALL' ? { status: status as never } : {};
    const payouts = await this.prisma.payout.findMany({
      where,
      include: {
        deliverable: { select: { title: true } },
        campaign: { select: { title: true, brand: { select: { companyName: true } } } },
        creatorProfile: {
          select: {
            id: true,
            user: { select: { email: true, profile: { select: { displayName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const grouped = await this.prisma.payout.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { netUsd: true, feeUsd: true },
    });

    return {
      payouts,
      summary: grouped.map((g) => ({
        status: g.status,
        count: g._count._all,
        netUsd: money(g._sum.netUsd ?? 0),
        feeUsd: money(g._sum.feeUsd ?? 0),
      })),
    };
  }

  /**
   * Admin marks a payout as processing / paid / failed. Real money movement
   * happens out-of-band (bank transfer or Stripe transfer) — this records it.
   */
  async updateStatus(
    adminUserId: string,
    payoutId: string,
    status: 'PROCESSING' | 'PAID' | 'FAILED',
    opts: { reference?: string; failureReason?: string } = {},
  ) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        deliverable: { select: { title: true } },
        creatorProfile: { select: { userId: true } },
      },
    });
    if (!payout) throw new NotFoundException('Payout not found');

    if (payout.status === 'PAID') {
      throw new BadRequestException(
        'This payout is already marked paid — reversing it would need a manual refund record.',
      );
    }
    if (status === 'FAILED' && !opts.failureReason?.trim()) {
      throw new BadRequestException('Give a reason so the creator knows what went wrong.');
    }

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status,
        reference: opts.reference ?? payout.reference,
        failureReason: status === 'FAILED' ? opts.failureReason : null,
        paidAt: status === 'PAID' ? new Date() : null,
        releasedById: adminUserId,
      },
    });

    this.audit.log({
      userId: adminUserId,
      action: `payout.${status.toLowerCase()}`,
      resource: 'payout',
      resourceId: payoutId,
      meta: { netUsd: payout.netUsd, reference: opts.reference },
    });

    if (status === 'PAID') {
      await this.notifications.create(payout.creatorProfile.userId, {
        type: 'PAYOUT',
        title: 'You have been paid',
        body: `$${payout.netUsd.toLocaleString()} for "${payout.deliverable.title}" has been released.`,
        link: '/dashboard/creator/earnings',
      });
    } else if (status === 'FAILED') {
      await this.notifications.create(payout.creatorProfile.userId, {
        type: 'PAYOUT',
        title: 'Payment failed',
        body: opts.failureReason ?? 'Your payout could not be processed.',
        link: '/dashboard/creator/earnings',
      });
    }

    return updated;
  }
}
