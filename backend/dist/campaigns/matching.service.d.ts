import { PrismaService } from '../prisma/prisma.service';
export interface MatchedCreator {
    creatorProfileId: string;
    displayName: string;
    location: string | null;
    categories: string[];
    languages: string[];
    minRateUsd: number | null;
    maxRateUsd: number | null;
    totalAudienceSize: number | null;
    profileImageUrl: string | null;
    verificationStatus: string;
    socialAccounts: any[];
    score: number;
    scoreBreakdown: {
        categoryScore: number;
        locationScore: number;
        budgetScore: number;
        audienceScore: number;
    };
}
export declare class MatchingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recommend(campaignId: string): Promise<MatchedCreator[]>;
    private score;
}
