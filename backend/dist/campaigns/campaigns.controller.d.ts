import { CampaignsService } from './campaigns.service';
import { MatchingService } from './matching.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
export declare class CampaignsController {
    private readonly campaigns;
    private readonly matching;
    constructor(campaigns: CampaignsService, matching: MatchingService);
    listPublic(type?: string, page?: string, limit?: string): Promise<{
        items: ({
            brand: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                companyName: string;
                industry: string | null;
                website: string | null;
                logoUrl: string | null;
                country: string | null;
                ratingAvg: number | null;
                ratingCount: number;
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<{
        brand: {
            user: {
                profile: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    country: string | null;
                    displayName: string;
                    bio: string | null;
                    city: string | null;
                    languages: import("@prisma/client/runtime/library").JsonValue;
                    categories: import("@prisma/client/runtime/library").JsonValue;
                    avatarUrl: string | null;
                } | null;
            } & {
                id: string;
                status: import("@prisma/client").$Enums.UserStatus;
                email: string;
                passwordHash: string | null;
                activeBrandProfileId: string | null;
                featureOverrides: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                updatedAt: Date;
                roleId: string;
            };
        } & {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            companyName: string;
            industry: string | null;
            website: string | null;
            logoUrl: string | null;
            country: string | null;
            ratingAvg: number | null;
            ratingCount: number;
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
    }>;
    myAll(user: {
        id: string;
    }): Promise<{
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
    }[]>;
    create(user: {
        id: string;
    }, dto: CreateCampaignDto): Promise<{
        brand: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            companyName: string;
            industry: string | null;
            website: string | null;
            logoUrl: string | null;
            country: string | null;
            ratingAvg: number | null;
            ratingCount: number;
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
    }>;
    update(user: {
        id: string;
    }, id: string, dto: UpdateCampaignDto): Promise<{
        brand: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            companyName: string;
            industry: string | null;
            website: string | null;
            logoUrl: string | null;
            country: string | null;
            ratingAvg: number | null;
            ratingCount: number;
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
    }>;
    recommend(id: string): Promise<import("./matching.service").MatchedCreator[]>;
    remove(user: {
        id: string;
    }, id: string): Promise<{
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
    }>;
}
