import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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

  async listUsers(page: number, limit: number, role?: string, search?: string) {
    const where: any = {};
    if (role) where.role = { name: role };
    if (search) where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { profile: { displayName: { contains: search, mode: 'insensitive' } } },
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
          role: { select: { name: true } },
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async updateUserStatus(userId: string, status: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { status: status as any } });
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
