import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PayoutsService } from '../payments/payouts.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  CreateDeliverableDto,
  ReviewDeliverableDto,
  SubmitDeliverableDto,
  UpdateDeliverableDto,
} from './dto/deliverable.dto';

const REVISION_INCLUDE = {
  revisions: { orderBy: { version: 'desc' } },
} as const;

@Injectable()
export class DeliverablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly payouts: PayoutsService,
  ) {}

  // ── Ownership helpers ─────────────────────────────────────────────────────

  /** Loads a campaign the given brand user owns, or throws. */
  private async campaignOwnedByBrand(brandUserId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, brand: WorkspacesService.accessFilter(brandUserId) },
      include: { brand: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  private async creatorProfileFor(userId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });
    if (!creator) throw new ForbiddenException('Creator profile required');
    return creator;
  }

  // ── Brand: assign work ────────────────────────────────────────────────────

  async create(brandUserId: string, campaignId: string, dto: CreateDeliverableDto) {
    const campaign = await this.campaignOwnedByBrand(brandUserId, campaignId);

    const creator = await this.prisma.creatorProfile.findUnique({
      where: { id: dto.creatorProfileId },
      include: { user: { select: { id: true, profile: { select: { displayName: true } } } } },
    });
    if (!creator) throw new NotFoundException('Creator not found');

    // Only creators the brand has actually engaged can be assigned work —
    // otherwise a brand could push deliverables onto anyone in the marketplace.
    const engaged = await this.prisma.proposal.findFirst({
      where: { campaignId, creatorId: creator.id, status: 'ACCEPTED' },
    });
    const invited = await this.prisma.campaignInvitation.findFirst({
      where: { campaignId, creatorId: creator.id, status: 'ACCEPTED' },
    });
    if (!engaged && !invited) {
      throw new BadRequestException(
        'This creator has not accepted an invitation or had a proposal accepted for this campaign yet.',
      );
    }

    const deliverable = await this.prisma.deliverable.create({
      data: {
        campaignId,
        creatorProfileId: creator.id,
        title: dto.title,
        description: dto.description,
        platform: dto.platform,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        agreedRateUsd: dto.agreedRateUsd,
      },
      include: REVISION_INCLUDE,
    });

    await this.notifications.create(creator.user.id, {
      type: 'DELIVERABLE',
      title: 'New deliverable assigned',
      body: `"${dto.title}" for the campaign "${campaign.title}"`,
      link: '/dashboard/creator/deliverables',
    });

    return deliverable;
  }

  async update(brandUserId: string, deliverableId: string, dto: UpdateDeliverableDto) {
    const deliverable = await this.prisma.deliverable.findFirst({
      where: { id: deliverableId, campaign: { brand: WorkspacesService.accessFilter(brandUserId) } },
    });
    if (!deliverable) throw new NotFoundException('Deliverable not found');

    return this.prisma.deliverable.update({
      where: { id: deliverableId },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        agreedRateUsd: dto.agreedRateUsd,
      },
      include: REVISION_INCLUDE,
    });
  }

  async cancel(brandUserId: string, deliverableId: string) {
    const deliverable = await this.prisma.deliverable.findFirst({
      where: { id: deliverableId, campaign: { brand: WorkspacesService.accessFilter(brandUserId) } },
    });
    if (!deliverable) throw new NotFoundException('Deliverable not found');
    if (deliverable.status === 'APPROVED') {
      throw new BadRequestException(
        'An approved deliverable cannot be cancelled — it may already be owed a payout.',
      );
    }
    return this.prisma.deliverable.update({
      where: { id: deliverableId },
      data: { status: 'CANCELLED' },
      include: REVISION_INCLUDE,
    });
  }

  // ── Listing ───────────────────────────────────────────────────────────────

  async listForCampaign(brandUserId: string, campaignId: string) {
    await this.campaignOwnedByBrand(brandUserId, campaignId);
    return this.prisma.deliverable.findMany({
      where: { campaignId },
      include: {
        ...REVISION_INCLUDE,
        creatorProfile: {
          include: {
            user: { select: { profile: { select: { displayName: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async listMine(creatorUserId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });
    if (!creator) return [];
    return this.prisma.deliverable.findMany({
      where: { creatorProfileId: creator.id, status: { not: 'CANCELLED' } },
      include: {
        ...REVISION_INCLUDE,
        campaign: { include: { brand: { select: { companyName: true, logoUrl: true } } } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
  }

  /** Brand-side queue of everything waiting on their review. */
  async listPendingReview(brandUserId: string) {
    return this.prisma.deliverable.findMany({
      where: {
        campaign: { brand: WorkspacesService.accessFilter(brandUserId) },
        status: 'SUBMITTED',
      },
      include: {
        ...REVISION_INCLUDE,
        campaign: { select: { id: true, title: true } },
        creatorProfile: {
          include: {
            user: { select: { profile: { select: { displayName: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  // ── Creator: submit work ──────────────────────────────────────────────────

  async submit(creatorUserId: string, deliverableId: string, dto: SubmitDeliverableDto) {
    if (!dto.contentUrl && !dto.fileUrl) {
      throw new BadRequestException(
        'Provide a link to the published content or upload a file.',
      );
    }

    const creator = await this.creatorProfileFor(creatorUserId);
    const deliverable = await this.prisma.deliverable.findFirst({
      where: { id: deliverableId, creatorProfileId: creator.id },
      include: {
        campaign: { include: { brand: { select: { userId: true } } } },
        revisions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
    if (!deliverable) throw new NotFoundException('Deliverable not found');

    if (deliverable.status === 'APPROVED') {
      throw new BadRequestException('This deliverable has already been approved.');
    }
    if (deliverable.status === 'CANCELLED') {
      throw new BadRequestException('This deliverable was cancelled.');
    }
    if (deliverable.status === 'SUBMITTED') {
      throw new BadRequestException(
        'This submission is already awaiting review. Wait for feedback before resubmitting.',
      );
    }

    const nextVersion = (deliverable.revisions[0]?.version ?? 0) + 1;

    // Both writes must land together: a revision without the status change
    // would leave work invisible to the brand's review queue.
    const [, updated] = await this.prisma.$transaction([
      this.prisma.deliverableRevision.create({
        data: {
          deliverableId,
          version: nextVersion,
          contentUrl: dto.contentUrl,
          fileUrl: dto.fileUrl,
          note: dto.note,
          submittedById: creatorUserId,
        },
      }),
      this.prisma.deliverable.update({
        where: { id: deliverableId },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
        include: REVISION_INCLUDE,
      }),
    ]);

    await this.notifications.create(deliverable.campaign.brand.userId, {
      type: 'DELIVERABLE',
      title:
        nextVersion === 1
          ? 'Deliverable submitted for review'
          : `Revision ${nextVersion} submitted`,
      body: `"${deliverable.title}" is ready for your review.`,
      link: `/dashboard/brand/campaigns/${deliverable.campaignId}/deliverables`,
    });

    return updated;
  }

  // ── Brand: review work ────────────────────────────────────────────────────

  async review(brandUserId: string, deliverableId: string, dto: ReviewDeliverableDto) {
    const deliverable = await this.prisma.deliverable.findFirst({
      where: { id: deliverableId, campaign: { brand: WorkspacesService.accessFilter(brandUserId) } },
      include: {
        campaign: { select: { id: true, title: true } },
        creatorProfile: { select: { userId: true } },
        revisions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
    if (!deliverable) throw new NotFoundException('Deliverable not found');

    if (deliverable.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'There is nothing awaiting review on this deliverable.',
      );
    }
    if (dto.outcome === 'CHANGES_REQUESTED' && !dto.feedback?.trim()) {
      throw new BadRequestException(
        'Explain what needs to change so the creator knows how to revise.',
      );
    }

    const latest = deliverable.revisions[0];
    const approved = dto.outcome === 'APPROVED';

    const [, updated] = await this.prisma.$transaction([
      this.prisma.deliverableRevision.update({
        where: { id: latest.id },
        data: {
          outcome: dto.outcome,
          feedback: dto.feedback,
          reviewedById: brandUserId,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
          approvedAt: approved ? new Date() : null,
        },
        include: REVISION_INCLUDE,
      }),
    ]);

    await this.notifications.create(deliverable.creatorProfile.userId, {
      type: 'DELIVERABLE',
      title: approved ? 'Deliverable approved' : 'Changes requested',
      body: approved
        ? `"${deliverable.title}" was approved for "${deliverable.campaign.title}".`
        : `"${deliverable.title}": ${dto.feedback}`,
      link: '/dashboard/creator/deliverables',
    });

    if (approved) {
      // Approval is what entitles the creator to payment — queue it here so
      // there is no separate step a brand could forget.
      await this.payouts.createForApprovedDeliverable(deliverableId);
      await this.completeCampaignIfDone(deliverable.campaignId);
    }

    return updated;
  }

  /**
   * Marks a campaign COMPLETED once every non-cancelled deliverable is
   * approved, so brands don't have to close campaigns by hand.
   */
  private async completeCampaignIfDone(campaignId: string) {
    const outstanding = await this.prisma.deliverable.count({
      where: {
        campaignId,
        status: { notIn: ['APPROVED', 'CANCELLED'] },
      },
    });
    if (outstanding > 0) return;

    const total = await this.prisma.deliverable.count({
      where: { campaignId, status: 'APPROVED' },
    });
    if (total === 0) return; // nothing was ever assigned

    await this.prisma.campaign.updateMany({
      where: { id: campaignId, status: 'ACTIVE' },
      data: { status: 'COMPLETED' },
    });
  }

  /** Progress summary used by the campaign detail header. */
  async summaryForCampaign(brandUserId: string, campaignId: string) {
    await this.campaignOwnedByBrand(brandUserId, campaignId);
    const grouped = await this.prisma.deliverable.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { _all: true },
      _sum: { agreedRateUsd: true },
    });

    const counts = Object.fromEntries(
      grouped.map((g) => [g.status, g._count._all]),
    ) as Record<string, number>;

    const committedUsd = grouped
      .filter((g) => g.status !== 'CANCELLED')
      .reduce((sum, g) => sum + (g._sum.agreedRateUsd ?? 0), 0);
    const approvedUsd =
      grouped.find((g) => g.status === 'APPROVED')?._sum.agreedRateUsd ?? 0;

    const total = Object.entries(counts)
      .filter(([status]) => status !== 'CANCELLED')
      .reduce((sum, [, n]) => sum + n, 0);

    return {
      total,
      pending: counts.PENDING ?? 0,
      submitted: counts.SUBMITTED ?? 0,
      changesRequested: counts.CHANGES_REQUESTED ?? 0,
      approved: counts.APPROVED ?? 0,
      cancelled: counts.CANCELLED ?? 0,
      committedUsd,
      approvedUsd,
      percentComplete: total === 0 ? 0 : Math.round(((counts.APPROVED ?? 0) / total) * 100),
    };
  }
}
