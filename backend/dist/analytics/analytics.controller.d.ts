import { AnalyticsService } from './analytics.service';
import { RecordMetricDto } from './dto/record-metric.dto';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    brandOverview(user: {
        id: string;
    }): Promise<{
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
    campaignAnalytics(user: {
        id: string;
    }, id: string): Promise<{
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
    recordMetric(user: {
        id: string;
    }, id: string, dto: RecordMetricDto): Promise<{
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
    creatorAnalytics(user: {
        id: string;
    }): Promise<{
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
