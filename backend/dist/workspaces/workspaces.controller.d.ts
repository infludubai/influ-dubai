import { WorkspaceRole } from '@prisma/client';
import { WorkspacesService } from './workspaces.service';
declare const ASSIGNABLE_ROLES: readonly ["ADMIN", "MEMBER", "VIEWER"];
declare class CreateWorkspaceDto {
    companyName: string;
    industry?: string;
}
declare class InviteMemberDto {
    email: string;
    role: (typeof ASSIGNABLE_ROLES)[number];
}
declare class UpdateRoleDto {
    role: (typeof ASSIGNABLE_ROLES)[number];
}
export declare class WorkspacesController {
    private readonly workspaces;
    constructor(workspaces: WorkspacesService);
    list(user: {
        id: string;
    }): Promise<{
        activeId: string | null;
        workspaces: {
            id: string;
            companyName: string;
            logoUrl: string | null;
            role: WorkspaceRole;
        }[];
    }>;
    create(user: {
        id: string;
    }, dto: CreateWorkspaceDto): Promise<{
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
    switch(user: {
        id: string;
    }, id: string): Promise<{
        activeId: string;
    }>;
    members(user: {
        id: string;
    }, id: string): Promise<{
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
    invite(user: {
        id: string;
    }, id: string, dto: InviteMemberDto): Promise<{
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
    updateRole(user: {
        id: string;
    }, id: string, memberId: string, dto: UpdateRoleDto): Promise<{
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
    removeMember(user: {
        id: string;
    }, id: string, memberId: string): Promise<{
        removed: boolean;
    }>;
}
export {};
