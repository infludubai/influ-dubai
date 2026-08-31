import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
export declare class ProposalsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    submit(creatorUserId: string, campaignId: string, dto: CreateProposalDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ProposalStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
        coverLetter: string;
        proposedRate: number | null;
    }>;
    listForCampaign(brandUserId: string, campaignId: string): Promise<({
        creator: {
            user: {
                profile: {
                    displayName: string;
                } | null;
            };
            socialAccounts: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                platform: import("@prisma/client").$Enums.SocialPlatform;
                creatorId: string;
                handle: string;
                followersCount: number | null;
                engagementRate: number | null;
                profileUrl: string | null;
            }[];
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
        id: string;
        status: import("@prisma/client").$Enums.ProposalStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
        coverLetter: string;
        proposedRate: number | null;
    })[]>;
    listMine(creatorUserId: string): Promise<({
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
        id: string;
        status: import("@prisma/client").$Enums.ProposalStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
        coverLetter: string;
        proposedRate: number | null;
    })[]>;
    respond(brandUserId: string, proposalId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ProposalStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
        coverLetter: string;
        proposedRate: number | null;
    }>;
    withdraw(creatorUserId: string, proposalId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ProposalStatus;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
        campaignId: string;
        coverLetter: string;
        proposedRate: number | null;
    }>;
}
