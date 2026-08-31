import { Prisma, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
export declare class WorkspacesService {
    private readonly prisma;
    private readonly notifications;
    private readonly mail;
    private readonly settings;
    constructor(prisma: PrismaService, notifications: NotificationsService, mail: MailService, settings: SettingsService);
    static accessFilter(userId: string): Prisma.BrandProfileWhereInput;
    resolveActive(userId: string): Promise<{
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
    } | null>;
    requireActive(userId: string): Promise<{
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
    assertAccess(userId: string, brandProfileId: string, minRole?: WorkspaceRole): Promise<{
        brand: {
            members: {
                role: import("@prisma/client").$Enums.WorkspaceRole;
                id: string;
                status: import("@prisma/client").$Enums.MembershipStatus;
                createdAt: Date;
                updatedAt: Date;
                userId: string | null;
                brandProfileId: string;
                invitedEmail: string;
                invitedById: string | null;
                acceptedAt: Date | null;
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
        };
        role: import("@prisma/client").$Enums.WorkspaceRole;
    }>;
    listMine(userId: string): Promise<{
        activeId: string | null;
        workspaces: {
            id: string;
            companyName: string;
            logoUrl: string | null;
            role: WorkspaceRole;
        }[];
    }>;
    create(userId: string, companyName: string, industry?: string): Promise<{
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
    switchActive(userId: string, brandProfileId: string): Promise<{
        activeId: string;
    }>;
    listMembers(userId: string, brandProfileId: string): Promise<{
        owner: {
            userId: string | undefined;
            email: string | undefined;
            displayName: string | null;
            role: WorkspaceRole;
            status: string;
        };
        members: {
            id: string;
            userId: string | null;
            email: string;
            displayName: string | null;
            role: import("@prisma/client").$Enums.WorkspaceRole;
            status: import("@prisma/client").$Enums.MembershipStatus;
            createdAt: Date;
        }[];
        seats: {
            used: number;
            limit: number;
        };
    }>;
    private seatLimit;
    invite(userId: string, brandProfileId: string, email: string, role: WorkspaceRole): Promise<{
        role: import("@prisma/client").$Enums.WorkspaceRole;
        id: string;
        status: import("@prisma/client").$Enums.MembershipStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        brandProfileId: string;
        invitedEmail: string;
        invitedById: string | null;
        acceptedAt: Date | null;
    }>;
    updateRole(userId: string, brandProfileId: string, memberId: string, role: WorkspaceRole): Promise<{
        role: import("@prisma/client").$Enums.WorkspaceRole;
        id: string;
        status: import("@prisma/client").$Enums.MembershipStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        brandProfileId: string;
        invitedEmail: string;
        invitedById: string | null;
        acceptedAt: Date | null;
    }>;
    removeMember(userId: string, brandProfileId: string, memberId: string): Promise<{
        removed: boolean;
    }>;
    claimInvitations(userId: string, email: string): Promise<number>;
}
