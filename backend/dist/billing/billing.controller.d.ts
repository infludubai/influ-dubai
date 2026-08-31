import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly billing;
    constructor(billing: BillingService);
    getPlans(): ({
        campaigns: 1;
        creators: 5;
        aiInsights: false;
        analytics: false;
        support: "Community";
        key: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
        name: string;
        tagline: string;
        price: number;
        currency: string;
        period: string;
        features: string[];
        highlighted: boolean;
    } | {
        campaigns: 10;
        creators: 100;
        aiInsights: true;
        analytics: true;
        support: "Email";
        key: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
        name: string;
        tagline: string;
        price: number;
        currency: string;
        period: string;
        features: string[];
        highlighted: boolean;
    } | {
        campaigns: -1;
        creators: -1;
        aiInsights: true;
        analytics: true;
        support: "Dedicated";
        key: "FREE" | "PROFESSIONAL" | "ENTERPRISE";
        name: string;
        tagline: string;
        price: number;
        currency: string;
        period: string;
        features: string[];
        highlighted: boolean;
    })[];
    getSubscription(user: {
        id: string;
    }): Promise<{
        effectiveFeatures: {
            aiInsights: boolean;
            analytics: boolean;
            unlimitedCampaigns: boolean;
        };
        invoices: {
            id: string;
            status: string;
            createdAt: Date;
            amountUsd: number;
            subscriptionId: string;
            stripeInvoiceId: string | null;
            pdfUrl: string | null;
        }[];
        id: string;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        plan: import("@prisma/client").$Enums.PlanTier;
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
        currentPeriodEnd: Date | null;
        cancelAtPeriodEnd: boolean;
    }>;
    createCheckout(user: {
        id: string;
    }, plan: 'PROFESSIONAL' | 'ENTERPRISE', successUrl: string, cancelUrl: string): Promise<{
        url: string | null;
        mock: boolean;
    }>;
    createPortal(user: {
        id: string;
    }, returnUrl: string): Promise<{
        url: string;
        mock: boolean;
    }>;
    cancel(user: {
        id: string;
    }): Promise<{
        cancelled: boolean;
        mock: boolean;
    } | {
        cancelled: boolean;
        mock?: undefined;
    }>;
    webhook(req: RawBodyRequest<Request>, sig: string): Promise<{
        received: boolean;
    }>;
}
