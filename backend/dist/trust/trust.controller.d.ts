import { VerificationService } from './verification.service';
import { ReviewsService } from './reviews.service';
import { ShortlistsService } from './shortlists.service';
declare class RequestVerificationDto {
    evidenceUrl?: string;
    note?: string;
}
declare class DecideVerificationDto {
    decision: 'VERIFIED' | 'REJECTED';
    reason?: string;
}
declare class CreateReviewDto {
    rating: number;
    comment?: string;
    creatorProfileId?: string;
}
declare class AddShortlistDto {
    creatorProfileId: string;
    listName?: string;
    note?: string;
}
export declare class TrustController {
    private readonly verification;
    private readonly reviews;
    private readonly shortlists;
    constructor(verification: VerificationService, reviews: ReviewsService, shortlists: ShortlistsService);
    requestVerification(user: {
        id: string;
    }, dto: RequestVerificationDto): Promise<{
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
    myVerification(user: {
        id: string;
    }): Promise<{
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
    listVerification(status?: string): Promise<({
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
    verificationStats(): Promise<{
        [k: string]: number;
    }>;
    decideVerification(user: {
        id: string;
    }, id: string, dto: DecideVerificationDto): Promise<{
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
    reviewCreator(user: {
        id: string;
    }, campaignId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandProfileId: string;
        campaignId: string;
        creatorProfileId: string;
        direction: import("@prisma/client").$Enums.ReviewDirection;
        authorUserId: string;
        rating: number;
        comment: string | null;
    }>;
    reviewBrand(user: {
        id: string;
    }, campaignId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandProfileId: string;
        campaignId: string;
        creatorProfileId: string;
        direction: import("@prisma/client").$Enums.ReviewDirection;
        authorUserId: string;
        rating: number;
        comment: string | null;
    }>;
    pendingReviews(user: {
        id: string;
    }): Promise<{
        campaignId: string;
        campaignTitle: string;
        creatorProfileId: string;
        creatorName: string;
    }[]>;
    listShortlist(user: {
        id: string;
    }): Promise<({
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
    shortlistIds(user: {
        id: string;
    }): Promise<string[]>;
    addShortlist(user: {
        id: string;
    }, dto: AddShortlistDto): Promise<{
        id: string;
        createdAt: Date;
        brandProfileId: string;
        creatorProfileId: string;
        note: string | null;
        listName: string;
    }>;
    removeShortlist(user: {
        id: string;
    }, id: string): Promise<{
        removed: boolean;
    }>;
}
export {};
