import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordMetric(brandUserId: string, campaignId: string, data: {
        reach: number;
        impressions: number;
        engagement: number;
        clicks: number;
        conversions: number;
    }): Promise<{
        id: string;
        campaignId: string;
        reach: number;
        impressions: number;
        engagement: number;
        clicks: number;
        conversions: number;
        costPerEngagement: number | null;
        roiEstimate: number | null;
        recordedAt: Date;
    }>;
    getCampaignAnalytics(brandUserId: string, campaignId: string): Promise<{
        campaign: {
            id: string;
            title: string;
            budgetUsd: number;
            status: import("@prisma/client").$Enums.CampaignStatus;
        };
        metrics: {
            id: string;
            campaignId: string;
            reach: number;
            impressions: number;
            engagement: number;
            clicks: number;
            conversions: number;
            costPerEngagement: number | null;
            roiEstimate: number | null;
            recordedAt: Date;
        }[];
        totals: {
            reach: number;
            impressions: number;
            engagement: number;
            clicks: number;
            conversions: number;
        };
        engagementRate: number;
        ctr: number;
        costPerEngagement: number | null;
        roiEstimate: number | null;
    }>;
    getBrandOverview(brandUserId: string): Promise<{
        campaigns: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.CampaignStatus;
            budgetUsd: number;
            reach: number;
            engagement: number;
            conversions: number;
            roiEstimate: number | null;
        }[];
        totals: {
            totalBudget: number;
            totalReach: number;
            totalEngagement: number;
            totalConversions: number;
        };
    }>;
    getCreatorAnalytics(creatorUserId: string): Promise<{
        campaigns: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.CampaignStatus;
            reach: number;
            engagement: number;
            conversions: number;
        }[];
        totals: {
            totalReach: number;
            totalEngagement: number;
            totalConversions: number;
        };
    }>;
}
