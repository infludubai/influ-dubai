import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export interface FraudAnalysis {
    riskScore: number;
    riskLevel: RiskLevel;
    flags: string[];
    engagementAnomaly: number | null;
    followerAnomaly: number | null;
    summary: string;
    aiGenerated: boolean;
}
export declare class FraudService {
    private readonly prisma;
    private readonly settings;
    private readonly logger;
    private client;
    private clientKey;
    constructor(prisma: PrismaService, settings: SettingsService);
    private get openai();
    analyzeCreator(creatorProfileId: string): Promise<FraudAnalysis>;
    getCreatorFraudHistory(creatorProfileId: string): Promise<{
        id: string;
        createdAt: Date;
        creatorId: string;
        riskScore: number;
        riskLevel: string;
        flags: import("@prisma/client/runtime/library").JsonValue;
        engagementAnom: number | null;
        followerAnom: number | null;
        summary: string | null;
    }[]>;
    scanAll(): Promise<{
        scanned: number;
        flagged: number;
        results: ({
            creatorId: string;
        } & FraudAnalysis)[];
    }>;
    getFraudStats(): Promise<{
        analyzed: number;
        high: number;
        medium: number;
        low: number;
        recentReports: ({
            creator: {
                id: string;
                categories: import("@prisma/client/runtime/library").JsonValue;
                location: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            creatorId: string;
            riskScore: number;
            riskLevel: string;
            flags: import("@prisma/client/runtime/library").JsonValue;
            engagementAnom: number | null;
            followerAnom: number | null;
            summary: string | null;
        })[];
    }>;
}
