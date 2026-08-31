import { CreatorsService } from './creators.service';
import { UpsertCreatorProfileDto } from './dto/upsert-creator-profile.dto';
import { UpsertSocialAccountDto } from './dto/upsert-social-account.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
export declare class CreatorsController {
    private readonly creators;
    constructor(creators: CreatorsService);
    list(q?: string, category?: string, location?: string, language?: string, minFollowers?: string, maxFollowers?: string, minRate?: string, maxRate?: string, page?: string, limit?: string): Promise<{
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
    getPublic(id: string): Promise<{
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
    getMyProfile(user: {
        id: string;
    }): Promise<{
        profile: ({
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
        }) | null;
        completionScore: number;
    }>;
    upsertProfile(user: {
        id: string;
    }, dto: UpsertCreatorProfileDto): Promise<{
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
    uploadProfileImage(user: {
        id: string;
    }, file: Express.Multer.File): Promise<{
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
    uploadMediaKit(user: {
        id: string;
    }, file: Express.Multer.File): Promise<{
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
    upsertSocialAccount(user: {
        id: string;
    }, dto: UpsertSocialAccountDto): Promise<{
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
    deleteSocialAccount(user: {
        id: string;
    }, platform: string): Promise<{
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
    createPortfolioItem(user: {
        id: string;
    }, dto: CreatePortfolioItemDto, file?: Express.Multer.File): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        creatorId: string;
        mediaUrl: string | null;
        linkUrl: string | null;
    }>;
    deletePortfolioItem(user: {
        id: string;
    }, id: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        creatorId: string;
        mediaUrl: string | null;
        linkUrl: string | null;
    }>;
}
