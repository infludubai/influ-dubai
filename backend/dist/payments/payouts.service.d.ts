import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export declare class PayoutsService {
    private readonly prisma;
    private readonly settings;
    private readonly notifications;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, settings: SettingsService, notifications: NotificationsService, audit: AuditService);
    private feePercent;
    createForApprovedDeliverable(deliverableId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PayoutStatus;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
        deliverableId: string;
        creatorProfileId: string;
        grossUsd: number;
        feePercent: number;
        feeUsd: number;
        netUsd: number;
        reference: string | null;
        failureReason: string | null;
        releasedById: string | null;
    } | null>;
    earningsFor(creatorUserId: string): Promise<{
        payouts: ({
            campaign: {
                id: string;
                title: string;
                brand: {
                    companyName: string;
                };
            };
            deliverable: {
                title: string;
                approvedAt: Date | null;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.PayoutStatus;
            createdAt: Date;
            updatedAt: Date;
            campaignId: string;
            method: import("@prisma/client").$Enums.PaymentMethod;
            paidAt: Date | null;
            deliverableId: string;
            creatorProfileId: string;
            grossUsd: number;
            feePercent: number;
            feeUsd: number;
            netUsd: number;
            reference: string | null;
            failureReason: string | null;
            releasedById: string | null;
        })[];
        totals: {
            pending: number;
            paid: number;
            lifetimeGross: number;
            fees: number;
        };
    }>;
    listForAdmin(status?: string): Promise<{
        payouts: ({
            creatorProfile: {
                user: {
                    profile: {
                        displayName: string;
                    } | null;
                    email: string;
                };
                id: string;
            };
            campaign: {
                title: string;
                brand: {
                    companyName: string;
                };
            };
            deliverable: {
                title: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.PayoutStatus;
            createdAt: Date;
            updatedAt: Date;
            campaignId: string;
            method: import("@prisma/client").$Enums.PaymentMethod;
            paidAt: Date | null;
            deliverableId: string;
            creatorProfileId: string;
            grossUsd: number;
            feePercent: number;
            feeUsd: number;
            netUsd: number;
            reference: string | null;
            failureReason: string | null;
            releasedById: string | null;
        })[];
        summary: {
            status: import("@prisma/client").$Enums.PayoutStatus;
            count: number;
            netUsd: number;
            feeUsd: number;
        }[];
    }>;
    updateStatus(adminUserId: string, payoutId: string, status: 'PROCESSING' | 'PAID' | 'FAILED', opts?: {
        reference?: string;
        failureReason?: string;
    }): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.PayoutStatus;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        paidAt: Date | null;
        deliverableId: string;
        creatorProfileId: string;
        grossUsd: number;
        feePercent: number;
        feeUsd: number;
        netUsd: number;
        reference: string | null;
        failureReason: string | null;
        releasedById: string | null;
    }>;
}
