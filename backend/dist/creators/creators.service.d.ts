import { PrismaService } from '../prisma/prisma.service';
import { UpsertCreatorProfileDto } from './dto/upsert-creator-profile.dto';
import { UpsertSocialAccountDto } from './dto/upsert-social-account.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
export declare class CreatorsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private requireCreatorRole;
    upsertProfile(userId: string, dto: UpsertCreatorProfileDto): Promise<{
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
        portfolioItems: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            creatorId: string;
            mediaUrl: string | null;
            linkUrl: string | null;
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
    }>;
    getMyProfile(userId: string): Promise<({
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
        portfolioItems: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            creatorId: string;
            mediaUrl: string | null;
            linkUrl: string | null;
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
    }) | null>;
    getPublicProfile(creatorProfileId: string): Promise<{
        user: {
            profile: {
                country: string | null;
                displayName: string;
                city: string | null;
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
        portfolioItems: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            creatorId: string;
            mediaUrl: string | null;
            linkUrl: string | null;
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
    }>;
    listPublicProfiles(filters: {
        q?: string;
        category?: string;
        location?: string;
        language?: string;
        minFollowers?: number;
        maxFollowers?: number;
        minRate?: number;
        maxRate?: number;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            user: {
                profile: {
                    country: string | null;
                    displayName: string;
                    city: string | null;
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    upsertSocialAccount(userId: string, dto: UpsertSocialAccountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        platform: import("@prisma/client").$Enums.SocialPlatform;
        creatorId: string;
        handle: string;
        followersCount: number | null;
        engagementRate: number | null;
        profileUrl: string | null;
    }>;
    deleteSocialAccount(userId: string, platform: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        platform: import("@prisma/client").$Enums.SocialPlatform;
        creatorId: string;
        handle: string;
        followersCount: number | null;
        engagementRate: number | null;
        profileUrl: string | null;
    }>;
    createPortfolioItem(userId: string, dto: CreatePortfolioItemDto, mediaUrl?: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        creatorId: string;
        mediaUrl: string | null;
        linkUrl: string | null;
    }>;
    deletePortfolioItem(userId: string, itemId: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        creatorId: string;
        mediaUrl: string | null;
        linkUrl: string | null;
    }>;
    updateProfileImage(userId: string, imageUrl: string): Promise<{
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
    }>;
    updateMediaKit(userId: string, mediaKitUrl: string): Promise<{
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
    }>;
    completionScore(profile: any): number;
}
