import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, RoleName, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

/**
 * The feature flags an admin may grant per user, layered over the plan.
 * A whitelist rather than free-form JSON so a typo cannot silently create a
 * flag nothing reads.
 */
export const GRANTABLE_FEATURES = [
  'aiInsights',
  'analytics',
  'unlimitedCampaigns',
] as const;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async getSystemStats() {
    const [
      totalUsers, totalCreators, totalBrands, totalCampaigns,
      activeCampaigns, totalMessages, totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.creatorProfile.count(),
      this.prisma.brandProfile.count(),
      this.prisma.campaign.count(),
      this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.message.count(),
      this.prisma.invoice.aggregate({ _sum: { amountUsd: true }, where: { status: 'paid' } }),
    ]);
    return {
      totalUsers,
      totalCreators,
      totalBrands,
      totalCampaigns,
      activeCampaigns,
      totalMessages,
      totalRevenueUsd: totalRevenue._sum.amountUsd ?? 0,
    };
  }

  async listUsers(page: number, limit: number, role?: string, search?: string, status?: string) {
    const where: any = {};
    if (role) where.role = { name: role };
    if (status) where.status = status;
    if (search) where.OR = [
      { email: { contains: search } },
      { profile: { displayName: { contains: search } } },
    ];
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
          featureOverrides: true,
          role: { select: { name: true } },
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async updateUserStatus(userId: string, status: string) {
    if (!Object.values(UserStatus).includes(status as UserStatus)) {
      throw new BadRequestException(`Unknown status: ${status}`);
    }
    const before = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: status as UserStatus },
    });

    // Approval is the one transition worth telling the user about — they are
    // actively waiting on it. Best-effort: an unconfigured mailer logs the
    // message instead, and a send failure must not fail the approval.
    if (before.status === 'PENDING_APPROVAL' && status === 'ACTIVE') {
      this.mail
        .sendAccountApproved(before.email, before.profile?.displayName ?? '')
        .catch((err) =>
          this.logger.warn(`Approval email to ${before.email} failed: ${err.message}`),
        );
    }
    return user;
  }

  /**
   * Changes a user's role. The one hard rule: the platform can never end up
   * with zero admins, because only admins can grant the role back.
   */
  async updateUserRole(userId: string, roleName: string) {
    if (!Object.values(RoleName).includes(roleName as RoleName)) {
      throw new BadRequestException(`Unknown role: ${roleName}`);
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: true },
    });

    if (user.role.name === 'ADMIN' && roleName !== 'ADMIN') {
      const admins = await this.prisma.user.count({ where: { role: { name: 'ADMIN' } } });
      if (admins <= 1) {
        throw new BadRequestException(
          'This is the only admin account — grant another user ADMIN first.',
        );
      }
    }

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: roleName as RoleName },
    });
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      include: { role: { select: { name: true } } },
    });
  }

  /**
   * Grants or revokes per-user features on top of the plan. Only true values
   * are stored: an override can add access, never take plan access away, so
   * clearing a toggle simply returns the user to their plan's defaults.
   */
  async updateUserFeatures(userId: string, overrides: Record<string, unknown>) {
    const clean: Record<string, boolean> = {};
    for (const key of GRANTABLE_FEATURES) {
      if (overrides[key] === true) clean[key] = true;
    }
    const unknown = Object.keys(overrides).filter(
      (k) => !(GRANTABLE_FEATURES as readonly string[]).includes(k),
    );
    if (unknown.length > 0) {
      throw new BadRequestException(`Unknown feature(s): ${unknown.join(', ')}`);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        featureOverrides: Object.keys(clean).length ? clean : Prisma.JsonNull,
      },
      select: { id: true, featureOverrides: true },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }

  async listCampaigns(page: number, limit: number, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { companyName: true } },
          _count: { select: { invitations: true, proposals: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);
    return { campaigns, total, page, limit };
  }

  async updateCampaignStatus(campaignId: string, status: string) {
    return this.prisma.campaign.update({ where: { id: campaignId }, data: { status: status as any } });
  }

  async getRevenueStats() {
    const invoices = await this.prisma.invoice.findMany({
      where: { status: 'paid' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const byPlan = await this.prisma.$queryRaw<{ plan: string; count: bigint; total: number }[]>`
      SELECT s.plan, COUNT(i.id) as count, SUM(i.amount_usd) as total
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      WHERE i.status = 'paid'
      GROUP BY s.plan
    `;
    return { recentInvoices: invoices, byPlan: byPlan.map(r => ({ ...r, count: Number(r.count) })) };
  }

  async getAuditLog(page: number, limit: number) {
    const [messages, invitations, proposals] = await Promise.all([
      this.prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.campaignInvitation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { campaign: { select: { title: true } } },
      }),
      this.prisma.proposal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { campaign: { select: { title: true } } },
      }),
    ]);

    const log = [
      ...messages.map(m => ({
        type: 'MESSAGE',
        at: m.createdAt,
        detail: `User sent a message (conversation ${m.conversationId.slice(0, 8)}…)`,
      })),
      ...invitations.map(i => ({
        type: 'INVITATION',
        at: i.createdAt,
        detail: `Invitation to "${i.campaign.title}" — ${i.status}`,
      })),
      ...proposals.map(p => ({
        type: 'PROPOSAL',
        at: p.createdAt,
        detail: `Proposal for "${p.campaign.title}" — ${p.status}`,
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice((page - 1) * limit, page * limit);

    return { log, page, limit };
  }
}
