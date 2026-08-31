import { FraudService } from './fraud.service';
export declare class FraudController {
    private readonly fraud;
    constructor(fraud: FraudService);
    analyze(id: string): Promise<import("./fraud.service").FraudAnalysis>;
    history(id: string): Promise<{
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
    stats(): Promise<{
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
    scanAll(): Promise<{
        scanned: number;
        flagged: number;
        results: ({
            creatorId: string;
        } & import("./fraud.service").FraudAnalysis)[];
    }>;
}
