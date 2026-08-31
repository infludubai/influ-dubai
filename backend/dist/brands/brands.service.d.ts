import { PrismaService } from '../prisma/prisma.service';
import { UpsertBrandProfileDto } from './dto/upsert-brand-profile.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';
export declare class BrandsService {
    private readonly prisma;
    private readonly workspaces;
    constructor(prisma: PrismaService, workspaces: WorkspacesService);
    private requireBrandRole;
    upsertProfile(userId: string, dto: UpsertBrandProfileDto): Promise<{
        campaigns: {
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
        }[];
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
    }>;
    getMyProfile(userId: string): Promise<({
        campaigns: {
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
        }[];
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
    }) | null>;
    getPublicProfile(brandProfileId: string): Promise<{
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
    }>;
}
