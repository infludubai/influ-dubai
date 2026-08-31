import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export type ReviewDirection = 'BRAND_TO_CREATOR' | 'CREATOR_TO_BRAND';
export declare class ReviewsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private assertWorkedTogether;
    createFromBrand(brandUserId: string, campaignId: string, creatorProfileId: string, rating: number, comment?: string): Promise<{
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
    createFromCreator(creatorUserId: string, campaignId: string, rating: number, comment?: string): Promise<{
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
    private recomputeCreatorRating;
    private recomputeBrandRating;
    listForCreator(creatorProfileId: string): import("@prisma/client").Prisma.PrismaPromise<({
        brandProfile: {
            companyName: string;
            logoUrl: string | null;
        };
        campaign: {
            title: string;
        };
    } & {
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
    })[]>;
    listForBrand(brandProfileId: string): import("@prisma/client").Prisma.PrismaPromise<({
        creatorProfile: {
            user: {
                profile: {
                    displayName: string;
                } | null;
            };
            id: string;
            profileImageUrl: string | null;
        };
        campaign: {
            title: string;
        };
    } & {
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
    })[]>;
    pendingForBrand(brandUserId: string): Promise<{
        campaignId: string;
        campaignTitle: string;
        creatorProfileId: string;
        creatorName: string;
    }[]>;
}
