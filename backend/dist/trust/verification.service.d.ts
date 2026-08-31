import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export declare class VerificationService {
    private readonly prisma;
    private readonly notifications;
    private readonly audit;
    constructor(prisma: PrismaService, notifications: NotificationsService, audit: AuditService);
    request(creatorUserId: string, evidenceUrl?: string, note?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.VerificationStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorProfileId: string;
        note: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
        evidenceUrl: string | null;
        decisionReason: string | null;
    }>;
    myStatus(creatorUserId: string): Promise<{
        status: string;
        requests: never[];
    } | {
        status: import("@prisma/client").$Enums.VerificationStatus;
        requests: {
            id: string;
            status: import("@prisma/client").$Enums.VerificationStatus;
            createdAt: Date;
            updatedAt: Date;
            creatorProfileId: string;
            note: string | null;
            reviewedById: string | null;
            reviewedAt: Date | null;
            evidenceUrl: string | null;
            decisionReason: string | null;
        }[];
    }>;
    listForAdmin(status?: string): Promise<({
        creatorProfile: {
            user: {
                profile: {
                    displayName: string;
                    avatarUrl: string | null;
                } | null;
                email: string;
                createdAt: Date;
            };
            socialAccounts: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                platform: import("@prisma/client").$Enums.SocialPlatform;
                creatorId: string;
                handle: string;
                followersCount: number | null;
                engagementRate: number | null;
                profileUrl: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            ratingAvg: number | null;
            ratingCount: number;
            bio: string | null;
            languages: import("@prisma/client/runtime/library").JsonValue;
            categories: import("@prisma/client/runtime/library").JsonValue;
            location: string | null;
            minRateUsd: number | null;
            maxRateUsd: number | null;
            totalAudienceSize: number | null;
            mediaKitUrl: string | null;
            profileImageUrl: string | null;
            verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
            fraudRiskScore: number | null;
            fraudRiskLevel: string | null;
            fraudFlags: import("@prisma/client/runtime/library").JsonValue;
            fraudAnalyzedAt: Date | null;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.VerificationStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorProfileId: string;
        note: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
        evidenceUrl: string | null;
        decisionReason: string | null;
    })[]>;
    decide(adminUserId: string, requestId: string, decision: 'VERIFIED' | 'REJECTED', reason?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.VerificationStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorProfileId: string;
        note: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
        evidenceUrl: string | null;
        decisionReason: string | null;
    }>;
    queueStats(): Promise<{
        [k: string]: number;
    }>;
}
