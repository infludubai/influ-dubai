import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // Brand: record a metric snapshot for a campaign they own
  async recordMetric(
    brandUserId: string,
    campaignId: string,
    data: {
      reach: number;
      impressions: number;
      engagement: number;
      clicks: number;
      conversions: number;
    },
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, brand: { userId: brandUserId } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const budgetPerEngagement = data.engagement > 0 ? campaign.budgetUsd / data.engagement : null;
    const roiEstimate = data.conversions > 0 && campaign.budgetUsd > 0
      ? (data.conversions * 50) / campaign.budgetUsd // assume $50 avg conversion value
      : null;

    return this.prisma.campaignMetric.create({
      data: {
        campaignId,
        ...data,
        costPerEngagement: budgetPerEngagement,
        roiEstimate,
      },
    });
  }

  // Brand: get analytics for one campaign
  async getCampaignAnalytics(brandUserId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, brand: { userId: brandUserId } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const metrics = await this.prisma.campaignMetric.findMany({
      where: { campaignId },
      orderBy: { recordedAt: 'asc' },
    });

    const latest = metrics[metrics.length - 1];
    const totals = metrics.reduce(
      (acc, m) => ({
        reach: Math.max(acc.reach, m.reach),
        impressions: Math.max(acc.impressions, m.impressions),
        engagement: Math.max(acc.engagement, m.engagement),
        clicks: Math.max(acc.clicks, m.clicks),
        conversions: Math.max(acc.conversions, m.conversions),
      }),
      { reach: 0, impressions: 0, engagement: 0, clicks: 0, conversions: 0 },
    );

    return {
      campaign: { id: campaign.id, title: campaign.title, budgetUsd: campaign.budgetUsd, status: campaign.status },
      metrics,
      totals,
      engagementRate: totals.reach > 0 ? (totals.engagement / totals.reach) * 100 : 0,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      costPerEngagement: latest?.costPerEngagement ?? null,
      roiEstimate: latest?.roiEstimate ?? null,
    };
  }

  // Brand: aggregate across all campaigns
  async getBrandOverview(brandUserId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { brand: { userId: brandUserId } },
      include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } },
    });

    const overview = campaigns.map((c) => {
      const m = c.metrics[0];
      return {
        id: c.id,
        title: c.title,
        status: c.status,
        budgetUsd: c.budgetUsd,
        reach: m?.reach ?? 0,
        engagement: m?.engagement ?? 0,
        conversions: m?.conversions ?? 0,
        roiEstimate: m?.roiEstimate ?? null,
      };
    });

    const totals = overview.reduce(
      (acc, c) => ({
        totalBudget: acc.totalBudget + c.budgetUsd,
        totalReach: acc.totalReach + c.reach,
        totalEngagement: acc.totalEngagement + c.engagement,
        totalConversions: acc.totalConversions + c.conversions,
      }),
      { totalBudget: 0, totalReach: 0, totalEngagement: 0, totalConversions: 0 },
    );

    return { campaigns: overview, totals };
  }

  // Creator: stats across all campaigns they've worked on
  async getCreatorAnalytics(creatorUserId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      include: {
        proposals: {
          where: { status: 'ACCEPTED' },
          include: {
            campaign: {
              include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } },
            },
          },
        },
        invitations: {
          where: { status: 'ACCEPTED' },
          include: {
            campaign: {
              include: { metrics: { orderBy: { recordedAt: 'desc' }, take: 1 } },
            },
          },
        },
      },
    });

    if (!creator) return { campaigns: [], totals: { totalReach: 0, totalEngagement: 0, totalConversions: 0 } };

    const seenIds = new Set<string>();
    const campaigns = [...creator.proposals.map((p) => p.campaign), ...creator.invitations.map((i) => i.campaign)]
      .filter((c) => { if (seenIds.has(c.id)) return false; seenIds.add(c.id); return true; })
      .map((c) => {
        const m = c.metrics[0];
        return { id: c.id, title: c.title, status: c.status, reach: m?.reach ?? 0, engagement: m?.engagement ?? 0, conversions: m?.conversions ?? 0 };
      });

    const totals = campaigns.reduce(
      (acc, c) => ({ totalReach: acc.totalReach + c.reach, totalEngagement: acc.totalEngagement + c.engagement, totalConversions: acc.totalConversions + c.conversions }),
      { totalReach: 0, totalEngagement: 0, totalConversions: 0 },
    );

    return { campaigns, totals };
  }
}
