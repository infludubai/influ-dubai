import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';
export declare class CampaignsService {
    private readonly prisma;
    private readonly workspaces;
    constructor(prisma: PrismaService, workspaces: WorkspacesService);
    private getBrandProfile;
    private ownsCampaign;
    create(userId: string, dto: CreateCampaignDto): Promise<{
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
    findAllForBrand(userId: string): Promise<{
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
    findOne(campaignId: string): Promise<{
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
    update(userId: string, campaignId: string, dto: UpdateCampaignDto): Promise<{
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
    remove(userId: string, campaignId: string): Promise<{
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
    listPublic(filters: {
        type?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
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
}
