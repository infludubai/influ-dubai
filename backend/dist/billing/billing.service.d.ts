import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { PaymentsService } from '../payments/payments.service';
import { ContentService } from '../content/content.service';
export declare const PLANS: {
    readonly FREE: {
        readonly campaigns: 1;
        readonly creators: 5;
        readonly aiInsights: false;
        readonly analytics: false;
        readonly support: "Community";
    };
    readonly PROFESSIONAL: {
        readonly campaigns: 10;
        readonly creators: 100;
        readonly aiInsights: true;
        readonly analytics: true;
        readonly support: "Email";
    };
    readonly ENTERPRISE: {
        readonly campaigns: -1;
        readonly creators: -1;
        readonly aiInsights: true;
        readonly analytics: true;
        readonly support: "Dedicated";
    };
};
export type PlanKey = keyof typeof PLANS;
export declare class BillingService {
    private readonly prisma;
    private readonly settings;
    private readonly payments;
    private readonly content;
    private readonly logger;
    private client;
    private clientKey;
    constructor(prisma: PrismaService, settings: SettingsService, payments: PaymentsService, content: ContentService);
    planPrice(plan: PlanKey): number;
    planCurrency(): string;
    publicPlans(): ({
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
    private get stripe();
    isLive(): boolean;
    getOrCreateSubscription(userId: string): Promise<{
        invoices: {
            id: string;
            status: string;
            createdAt: Date;
            amountUsd: number;
            subscriptionId: string;
            stripeInvoiceId: string | null;
            pdfUrl: string | null;
        }[];
    } & {
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
    getSubscription(userId: string): Promise<{
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
    createCheckoutSession(userId: string, plan: 'PROFESSIONAL' | 'ENTERPRISE', successUrl: string, cancelUrl: string): Promise<{
        url: string | null;
        mock: boolean;
    }>;
    createPortalSession(userId: string, returnUrl: string): Promise<{
        url: string;
        mock: boolean;
    }>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<void>;
    cancelSubscription(userId: string): Promise<{
        cancelled: boolean;
        mock: boolean;
    } | {
        cancelled: boolean;
        mock?: undefined;
    }>;
}
