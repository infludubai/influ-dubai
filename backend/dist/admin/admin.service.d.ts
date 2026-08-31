import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
export declare const GRANTABLE_FEATURES: readonly ["aiInsights", "analytics", "unlimitedCampaigns"];
export declare class AdminService {
    private readonly prisma;
    private readonly mail;
    private readonly logger;
    constructor(prisma: PrismaService, mail: MailService);
    getSystemStats(): Promise<{
        totalUsers: number;
        totalCreators: number;
        totalBrands: number;
        totalCampaigns: number;
        activeCampaigns: number;
        totalMessages: number;
        totalRevenueUsd: number;
    }>;
    listUsers(page: number, limit: number, role?: string, search?: string, status?: string): Promise<{
        users: {
            profile: {
                displayName: string;
                avatarUrl: string | null;
            } | null;
            role: {
                name: import("@prisma/client").$Enums.RoleName;
            };
            id: string;
            status: import("@prisma/client").$Enums.UserStatus;
            email: string;
            featureOverrides: Prisma.JsonValue;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateUserStatus(userId: string, status: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        passwordHash: string | null;
        activeBrandProfileId: string | null;
        featureOverrides: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    updateUserRole(userId: string, roleName: string): Promise<{
        role: {
            name: import("@prisma/client").$Enums.RoleName;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        passwordHash: string | null;
        activeBrandProfileId: string | null;
        featureOverrides: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    updateUserFeatures(userId: string, overrides: Record<string, unknown>): Promise<{
        id: string;
        featureOverrides: Prisma.JsonValue;
    }>;
    deleteUser(userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        passwordHash: string | null;
        activeBrandProfileId: string | null;
        featureOverrides: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    listCampaigns(page: number, limit: number, status?: string): Promise<{
        campaigns: ({
            _count: {
                invitations: number;
                proposals: number;
            };
            brand: {
                companyName: string;
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
            targetLocations: Prisma.JsonValue;
            targetCategories: Prisma.JsonValue;
            deadline: Date | null;
            requirements: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateCampaignStatus(campaignId: string, status: string): Promise<{
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
        targetLocations: Prisma.JsonValue;
        targetCategories: Prisma.JsonValue;
        deadline: Date | null;
        requirements: string | null;
    }>;
    getRevenueStats(): Promise<{
        recentInvoices: {
            id: string;
            status: string;
            createdAt: Date;
            amountUsd: number;
            subscriptionId: string;
            stripeInvoiceId: string | null;
            pdfUrl: string | null;
        }[];
        byPlan: {
            count: number;
            plan: string;
            total: number;
        }[];
    }>;
    getAuditLog(page: number, limit: number): Promise<{
        log: {
            type: string;
            at: Date;
            detail: string;
        }[];
        page: number;
        limit: number;
    }>;
}
