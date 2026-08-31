import { PaymentsService } from './payments.service';
import { PayoutsService } from './payouts.service';
declare class FundCampaignDto {
    amountUsd: number;
    successUrl?: string;
    cancelUrl?: string;
}
declare class UpdatePayoutDto {
    status: 'PROCESSING' | 'PAID' | 'FAILED';
    reference?: string;
    failureReason?: string;
}
export declare class PaymentsController {
    private readonly payments;
    private readonly payouts;
    constructor(payments: PaymentsService, payouts: PayoutsService);
    fund(user: {
        id: string;
    }, campaignId: string, dto: FundCampaignDto): Promise<{
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
    listCampaignPayments(user: {
        id: string;
    }, campaignId: string): Promise<{
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
    spend(user: {
        id: string;
    }): Promise<{
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
    myEarnings(user: {
        id: string;
    }): Promise<{
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
    adminList(status?: string): Promise<{
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
    adminUpdate(user: {
        id: string;
    }, id: string, dto: UpdatePayoutDto): Promise<{
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
    adminRevenue(): Promise<{
        feeRevenue: number;
        subscriptionRevenue: number;
        totalRevenue: number;
        payoutCount: number;
        invoiceCount: number;
    }>;
}
export {};
