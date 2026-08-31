import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
export declare class InvitationsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    invite(brandUserId: string, campaignId: string, dto: CreateInvitationDto): Promise<{
        message: string | null;
        id: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
    }>;
    listForCampaign(brandUserId: string, campaignId: string): Promise<({
        creator: {
            user: {
                profile: {
                    displayName: string;
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
    } & {
        message: string | null;
        id: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
    })[]>;
    listForCreator(creatorUserId: string): Promise<({
        campaign: {
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
        };
    } & {
        message: string | null;
        id: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
    })[]>;
    respond(creatorUserId: string, invitationId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<{
        message: string | null;
        id: string;
        status: import("@prisma/client").$Enums.InvitationStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
    }>;
}
