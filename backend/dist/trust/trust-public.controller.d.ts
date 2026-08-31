import { ReviewsService } from './reviews.service';
export declare class TrustPublicController {
    private readonly reviews;
    constructor(reviews: ReviewsService);
    creatorReviews(id: string): import("@prisma/client").Prisma.PrismaPromise<({
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
    brandReviews(id: string): import("@prisma/client").Prisma.PrismaPromise<({
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
}
