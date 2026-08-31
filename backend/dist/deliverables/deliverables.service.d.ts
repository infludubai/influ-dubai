import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PayoutsService } from '../payments/payouts.service';
import { CreateDeliverableDto, ReviewDeliverableDto, SubmitDeliverableDto, UpdateDeliverableDto } from './dto/deliverable.dto';
export declare class DeliverablesService {
    private readonly prisma;
    private readonly notifications;
    private readonly payouts;
    constructor(prisma: PrismaService, notifications: NotificationsService, payouts: PayoutsService);
    private campaignOwnedByBrand;
    private creatorProfileFor;
    create(brandUserId: string, campaignId: string, dto: CreateDeliverableDto): Promise<{
        revisions: {
            id: string;
            createdAt: Date;
            deliverableId: string;
            contentUrl: string | null;
            fileUrl: string | null;
            note: string | null;
            outcome: string | null;
            feedback: string | null;
            version: number;
            submittedById: string;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.DeliverableStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        platform: import("@prisma/client").$Enums.SocialPlatform | null;
        campaignId: string;
        creatorProfileId: string;
        dueDate: Date | null;
        agreedRateUsd: number | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
    }>;
    update(brandUserId: string, deliverableId: string, dto: UpdateDeliverableDto): Promise<{
        revisions: {
            id: string;
            createdAt: Date;
            deliverableId: string;
            contentUrl: string | null;
            fileUrl: string | null;
            note: string | null;
            outcome: string | null;
            feedback: string | null;
            version: number;
            submittedById: string;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.DeliverableStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        platform: import("@prisma/client").$Enums.SocialPlatform | null;
        campaignId: string;
        creatorProfileId: string;
        dueDate: Date | null;
        agreedRateUsd: number | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
    }>;
    cancel(brandUserId: string, deliverableId: string): Promise<{
        revisions: {
            id: string;
            createdAt: Date;
            deliverableId: string;
            contentUrl: string | null;
            fileUrl: string | null;
            note: string | null;
            outcome: string | null;
            feedback: string | null;
            version: number;
            submittedById: string;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.DeliverableStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        platform: import("@prisma/client").$Enums.SocialPlatform | null;
        campaignId: string;
        creatorProfileId: string;
        dueDate: Date | null;
        agreedRateUsd: number | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
    }>;
    listForCampaign(brandUserId: string, campaignId: string): Promise<({
        creatorProfile: {
            user: {
                profile: {
                    displayName: string;
                    avatarUrl: string | null;
                } | null;
            };
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
        revisions: {
            id: string;
            createdAt: Date;
            deliverableId: string;
            contentUrl: string | null;
            fileUrl: string | null;
            note: string | null;
            outcome: string | null;
            feedback: string | null;
            version: number;
            submittedById: string;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.DeliverableStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        platform: import("@prisma/client").$Enums.SocialPlatform | null;
        campaignId: string;
        creatorProfileId: string;
        dueDate: Date | null;
        agreedRateUsd: number | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
    })[]>;
    listMine(creatorUserId: string): Promise<({
        campaign: {
            brand: {
                companyName: string;
                logoUrl: string | null;
            };
        } & {
            id: string;
            description: string | null;
            status: import("@prisma/client").$Enums.CampaignStatus;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.CampaignType;
            title: string;
            brandId: string;
            budgetUsd: number;
            targetAudience: string | null;
            targetLocations: import("@prisma/client/runtime/library").JsonValue;
            targetCategories: import("@prisma/client/runtime/library").JsonValue;
            deadline: Date | null;
            requirements: string | null;
        };
        revisions: {
            id: string;
            createdAt: Date;
            deliverableId: string;
            contentUrl: string | null;
            fileUrl: string | null;
            note: string | null;
            outcome: string | null;
            feedback: string | null;
            version: number;
            submittedById: string;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.DeliverableStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        platform: import("@prisma/client").$Enums.SocialPlatform | null;
        campaignId: string;
        creatorProfileId: string;
        dueDate: Date | null;
        agreedRateUsd: number | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
    })[]>;
    listPendingReview(brandUserId: string): Promise<({
        creatorProfile: {
            user: {
                profile: {
                    displayName: string;
                    avatarUrl: string | null;
                } | null;
            };
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
        campaign: {
            id: string;
            title: string;
        };
        revisions: {
            id: string;
            createdAt: Date;
            deliverableId: string;
            contentUrl: string | null;
            fileUrl: string | null;
            note: string | null;
            outcome: string | null;
            feedback: string | null;
            version: number;
            submittedById: string;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.DeliverableStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        platform: import("@prisma/client").$Enums.SocialPlatform | null;
        campaignId: string;
        creatorProfileId: string;
        dueDate: Date | null;
        agreedRateUsd: number | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
    })[]>;
    submit(creatorUserId: string, deliverableId: string, dto: SubmitDeliverableDto): Promise<{
        revisions: {
            id: string;
            createdAt: Date;
            deliverableId: string;
            contentUrl: string | null;
            fileUrl: string | null;
            note: string | null;
            outcome: string | null;
            feedback: string | null;
            version: number;
            submittedById: string;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.DeliverableStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        platform: import("@prisma/client").$Enums.SocialPlatform | null;
        campaignId: string;
        creatorProfileId: string;
        dueDate: Date | null;
        agreedRateUsd: number | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
    }>;
    review(brandUserId: string, deliverableId: string, dto: ReviewDeliverableDto): Promise<{
        revisions: {
            id: string;
            createdAt: Date;
            deliverableId: string;
            contentUrl: string | null;
            fileUrl: string | null;
            note: string | null;
            outcome: string | null;
            feedback: string | null;
            version: number;
            submittedById: string;
            reviewedById: string | null;
            reviewedAt: Date | null;
        }[];
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.DeliverableStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        platform: import("@prisma/client").$Enums.SocialPlatform | null;
        campaignId: string;
        creatorProfileId: string;
        dueDate: Date | null;
        agreedRateUsd: number | null;
        submittedAt: Date | null;
        approvedAt: Date | null;
    }>;
    private completeCampaignIfDone;
    summaryForCampaign(brandUserId: string, campaignId: string): Promise<{
        total: number;
        pending: number;
        submitted: number;
        changesRequested: number;
        approved: number;
        cancelled: number;
        committedUsd: number;
        approvedUsd: number;
        percentComplete: number;
    }>;
}
