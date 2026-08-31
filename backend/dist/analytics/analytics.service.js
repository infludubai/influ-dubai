"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordMetric(brandUserId, campaignId, data) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const budgetPerEngagement = data.engagement > 0 ? campaign.budgetUsd / data.engagement : null;
        const roiEstimate = data.conversions > 0 && campaign.budgetUsd > 0
            ? (data.conversions * 50) / campaign.budgetUsd
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
    async getCampaignAnalytics(brandUserId, campaignId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const metrics = await this.prisma.campaignMetric.findMany({
            where: { campaignId },
            orderBy: { recordedAt: 'asc' },
        });
        const latest = metrics[metrics.length - 1];
        const totals = metrics.reduce((acc, m) => ({
            reach: Math.max(acc.reach, m.reach),
            impressions: Math.max(acc.impressions, m.impressions),
            engagement: Math.max(acc.engagement, m.engagement),
            clicks: Math.max(acc.clicks, m.clicks),
            conversions: Math.max(acc.conversions, m.conversions),
        }), { reach: 0, impressions: 0, engagement: 0, clicks: 0, conversions: 0 });
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
    async getBrandOverview(brandUserId) {
        const campaigns = await this.prisma.campaign.findMany({
            where: { brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
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
        const totals = overview.reduce((acc, c) => ({
            totalBudget: acc.totalBudget + c.budgetUsd,
            totalReach: acc.totalReach + c.reach,
            totalEngagement: acc.totalEngagement + c.engagement,
            totalConversions: acc.totalConversions + c.conversions,
        }), { totalBudget: 0, totalReach: 0, totalEngagement: 0, totalConversions: 0 });
        return { campaigns: overview, totals };
    }
    async getCreatorAnalytics(creatorUserId) {
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
        if (!creator)
            return { campaigns: [], totals: { totalReach: 0, totalEngagement: 0, totalConversions: 0 } };
        const seenIds = new Set();
        const campaigns = [...creator.proposals.map((p) => p.campaign), ...creator.invitations.map((i) => i.campaign)]
            .filter((c) => { if (seenIds.has(c.id))
            return false; seenIds.add(c.id); return true; })
            .map((c) => {
            const m = c.metrics[0];
            return { id: c.id, title: c.title, status: c.status, reach: m?.reach ?? 0, engagement: m?.engagement ?? 0, conversions: m?.conversions ?? 0 };
        });
        const totals = campaigns.reduce((acc, c) => ({ totalReach: acc.totalReach + c.reach, totalEngagement: acc.totalEngagement + c.engagement, totalConversions: acc.totalConversions + c.conversions }), { totalReach: 0, totalEngagement: 0, totalConversions: 0 });
        return { campaigns, totals };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map