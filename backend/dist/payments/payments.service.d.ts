import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
export declare class PaymentsService {
    private readonly prisma;
    private readonly settings;
    private readonly audit;
    private readonly workspaces;
    private readonly logger;
    private client;
    private clientKey;
    constructor(prisma: PrismaService, settings: SettingsService, audit: AuditService, workspaces: WorkspacesService);
    private get stripe();
    private campaignOwnedByBrand;
    fundCampaign(brandUserId: string, campaignId: string, amountUsd: number, urls: {
        successUrl: string;
        cancelUrl: string;
    }): Promise<{
        payment: {
            id: string;
            description: string | null;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            brandProfileId: string;
            campaignId: string;
            amountUsd: number;
            method: import("@prisma/client").$Enums.PaymentMethod;
            stripeCheckoutSessionId: string | null;
            stripePaymentIntentId: string | null;
            paidAt: Date | null;
        };
        checkoutUrl: string | null;
        mock: boolean;
    }>;
    markCheckoutPaid(sessionId: string, paymentIntentId?: string): Promise<void>;
    listForCampaign(brandUserId: string, campaignId: string): Promise<{
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        brandProfileId: string;
        campaignId: string;
        amountUsd: number;
        method: import("@prisma/client").$Enums.PaymentMethod;
        stripeCheckoutSessionId: string | null;
        stripePaymentIntentId: string | null;
        paidAt: Date | null;
    }[]>;
    spendSummary(brandUserId: string): Promise<{
        fundedUsd: number;
        committedUsd: number;
        paidOutUsd: number;
        balanceUsd: number;
        payments: ({
            campaign: {
                id: string;
                title: string;
            };
        } & {
            id: string;
            description: string | null;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            brandProfileId: string;
            campaignId: string;
            amountUsd: number;
            method: import("@prisma/client").$Enums.PaymentMethod;
            stripeCheckoutSessionId: string | null;
            stripePaymentIntentId: string | null;
            paidAt: Date | null;
        })[];
    }>;
    platformRevenue(): Promise<{
        feeRevenue: number;
        subscriptionRevenue: number;
        totalRevenue: number;
        payoutCount: number;
        invoiceCount: number;
    }>;
}
