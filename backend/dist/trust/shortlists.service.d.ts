import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
export declare class ShortlistsService {
    private readonly prisma;
    private readonly workspaces;
    constructor(prisma: PrismaService, workspaces: WorkspacesService);
    private brandProfile;
    list(brandUserId: string): Promise<({
        creatorProfile: {
            user: {
                profile: {
                    displayName: string;
                    avatarUrl: string | null;
                } | null;
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
        createdAt: Date;
        brandProfileId: string;
        creatorProfileId: string;
        note: string | null;
        listName: string;
    })[]>;
    add(brandUserId: string, creatorProfileId: string, listName?: string, note?: string): Promise<{
        id: string;
        createdAt: Date;
        brandProfileId: string;
        creatorProfileId: string;
        note: string | null;
        listName: string;
    }>;
    remove(brandUserId: string, creatorProfileId: string): Promise<{
        removed: boolean;
    }>;
    savedIds(brandUserId: string): Promise<string[]>;
}
