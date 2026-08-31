import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly admin;
    constructor(admin: AdminService);
    getStats(): Promise<{
        totalUsers: number;
        totalCreators: number;
        totalBrands: number;
        totalCampaigns: number;
        activeCampaigns: number;
        totalMessages: number;
        totalRevenueUsd: number;
    }>;
    listUsers(page?: string, limit?: string, role?: string, search?: string, status?: string): Promise<{
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
            featureOverrides: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateUserStatus(id: string, status: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        passwordHash: string | null;
        activeBrandProfileId: string | null;
        featureOverrides: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    updateUserRole(id: string, role: string): Promise<{
        role: {
            name: import("@prisma/client").$Enums.RoleName;
        };
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
    }>;
    updateUserFeatures(id: string, overrides: Record<string, unknown>): Promise<{
        id: string;
        featureOverrides: import("@prisma/client/runtime/library").JsonValue;
    }>;
    deleteUser(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        passwordHash: string | null;
        activeBrandProfileId: string | null;
        featureOverrides: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    listCampaigns(page?: string, limit?: string, status?: string): Promise<{
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
            targetLocations: import("@prisma/client/runtime/library").JsonValue;
            targetCategories: import("@prisma/client/runtime/library").JsonValue;
            deadline: Date | null;
            requirements: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateCampaignStatus(id: string, status: string): Promise<{
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
    getRevenue(): Promise<{
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
    getAuditLog(page?: string, limit?: string): Promise<{
        log: {
            type: string;
            at: Date;
            detail: string;
        }[];
        page: number;
        limit: number;
    }>;
}
