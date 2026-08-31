"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = exports.PLANS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const settings_service_1 = require("../settings/settings.service");
const payments_service_1 = require("../payments/payments.service");
const content_service_1 = require("../content/content.service");
exports.PLANS = {
    FREE: {
        campaigns: 1,
        creators: 5,
        aiInsights: false,
        analytics: false,
        support: 'Community',
    },
    PROFESSIONAL: {
        campaigns: 10,
        creators: 100,
        aiInsights: true,
        analytics: true,
        support: 'Email',
    },
    ENTERPRISE: {
        campaigns: -1,
        creators: -1,
        aiInsights: true,
        analytics: true,
        support: 'Dedicated',
    },
};
const CONTENT_KEY = {
    FREE: 'free',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise',
};
let BillingService = BillingService_1 = class BillingService {
    prisma;
    settings;
    payments;
    content;
    logger = new common_1.Logger(BillingService_1.name);
    client = null;
    clientKey = '';
    constructor(prisma, settings, payments, content) {
        this.prisma = prisma;
        this.settings = settings;
        this.payments = payments;
        this.content = content;
    }
    planPrice(plan) {
        const raw = this.content.getPublic()[`pricing.${CONTENT_KEY[plan]}.price`];
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }
    planCurrency() {
        return (this.content.getPublic()['pricing.currency'] ?? 'AED').toUpperCase();
    }
    publicPlans() {
        const c = this.content.getPublic();
        const currency = this.planCurrency();
        return Object.keys(exports.PLANS).map((key) => {
            const slug = CONTENT_KEY[key];
            return {
                key,
                name: c[`pricing.${slug}.name`] ?? key,
                tagline: c[`pricing.${slug}.tagline`] ?? '',
                price: this.planPrice(key),
                currency,
                period: c['pricing.period'] ?? '/month',
                features: (c[`pricing.${slug}.features`] ?? '')
                    .split('\n')
                    .map((f) => f.trim())
                    .filter(Boolean),
                highlighted: (c['pricing.highlight'] ?? 'professional') === slug,
                ...exports.PLANS[key],
            };
        });
    }
    get stripe() {
        const key = this.settings.get('STRIPE_SECRET_KEY');
        if (!key) {
            this.client = null;
            this.clientKey = '';
            return null;
        }
        if (!this.client || this.clientKey !== key) {
            const Stripe = require('stripe');
            this.client = new Stripe(key);
            this.clientKey = key;
        }
        return this.client;
    }
    isLive() {
        return this.stripe !== null;
    }
    async getOrCreateSubscription(userId) {
        const existing = await this.prisma.subscription.findUnique({ where: { userId }, include: { invoices: { orderBy: { createdAt: 'desc' }, take: 10 } } });
        if (existing)
            return existing;
        return this.prisma.subscription.create({ data: { userId }, include: { invoices: true } });
    }
    async getSubscription(userId) {
        const sub = await this.getOrCreateSubscription(userId);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { featureOverrides: true },
        });
        const plan = exports.PLANS[sub.plan] ?? exports.PLANS.FREE;
        const overrides = (user?.featureOverrides ?? {});
        return {
            ...sub,
            effectiveFeatures: {
                aiInsights: plan.aiInsights || overrides.aiInsights === true,
                analytics: plan.analytics || overrides.analytics === true,
                unlimitedCampaigns: plan.campaigns === -1 || overrides.unlimitedCampaigns === true,
            },
        };
    }
    async createCheckoutSession(userId, plan, successUrl, cancelUrl) {
        const sub = await this.getOrCreateSubscription(userId);
        const stripe = this.stripe;
        if (!stripe) {
            const updated = await this.prisma.subscription.update({
                where: { userId },
                data: {
                    plan,
                    status: 'ACTIVE',
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
            await this.prisma.invoice.create({
                data: {
                    subscriptionId: updated.id,
                    amountUsd: this.planPrice(plan),
                    status: 'paid',
                },
            });
            return { url: successUrl, mock: true };
        }
        const priceId = plan === 'PROFESSIONAL'
            ? this.settings.get('STRIPE_PRICE_PROFESSIONAL')
            : this.settings.get('STRIPE_PRICE_ENTERPRISE');
        if (!priceId) {
            throw new Error(`Stripe price ID for the ${plan} plan is not configured — set it in Admin → Settings → Stripe.`);
        }
        let customerId = sub.stripeCustomerId ?? undefined;
        if (!customerId) {
            const customer = await stripe.customers.create({ metadata: { userId } });
            customerId = customer.id;
            await this.prisma.subscription.update({ where: { userId }, data: { stripeCustomerId: customerId } });
        }
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: { userId, plan },
        });
        return { url: session.url, mock: false };
    }
    async createPortalSession(userId, returnUrl) {
        const sub = await this.getOrCreateSubscription(userId);
        const stripe = this.stripe;
        if (!stripe || !sub.stripeCustomerId) {
            return { url: returnUrl, mock: true };
        }
        const session = await stripe.billingPortal.sessions.create({
            customer: sub.stripeCustomerId,
            return_url: returnUrl,
        });
        return { url: session.url, mock: false };
    }
    async handleWebhook(rawBody, signature) {
        const stripe = this.stripe;
        if (!stripe)
            return;
        const secret = this.settings.get('STRIPE_WEBHOOK_SECRET');
        if (!secret) {
            this.logger.error('Received a Stripe webhook but STRIPE_WEBHOOK_SECRET is not set — refusing to process it unverified.');
            throw new Error('Webhook secret not configured');
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, signature, secret);
        }
        catch (err) {
            this.logger.error('Webhook signature verification failed', err);
            throw err;
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const { userId, plan, kind } = session.metadata ?? {};
                if (kind === 'campaign_funding') {
                    await this.payments.markCheckoutPaid(session.id, session.payment_intent ?? undefined);
                    break;
                }
                if (userId && plan) {
                    await this.prisma.subscription.update({
                        where: { userId },
                        data: {
                            plan: plan,
                            status: 'ACTIVE',
                            stripeSubscriptionId: session.subscription,
                        },
                    });
                }
                break;
            }
            case 'invoice.paid': {
                const inv = event.data.object;
                const customerId = inv.customer;
                const sub = await this.prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
                if (sub) {
                    await this.prisma.invoice.upsert({
                        where: { stripeInvoiceId: inv.id },
                        create: {
                            subscriptionId: sub.id,
                            stripeInvoiceId: inv.id,
                            amountUsd: inv.amount_paid / 100,
                            status: 'paid',
                            pdfUrl: inv.invoice_pdf,
                        },
                        update: { status: 'paid' },
                    });
                }
                break;
            }
            case 'customer.subscription.updated': {
                const stripeSub = event.data.object;
                const customerId = stripeSub.customer;
                const sub = await this.prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
                if (sub) {
                    await this.prisma.subscription.update({
                        where: { id: sub.id },
                        data: {
                            status: stripeSub.status.toUpperCase(),
                            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                        },
                    });
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const stripeSub = event.data.object;
                const customerId = stripeSub.customer;
                await this.prisma.subscription.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: { plan: 'FREE', status: 'CANCELLED' },
                });
                break;
            }
        }
    }
    async cancelSubscription(userId) {
        const sub = await this.getOrCreateSubscription(userId);
        const stripe = this.stripe;
        if (!stripe || !sub.stripeSubscriptionId) {
            await this.prisma.subscription.update({ where: { userId }, data: { plan: 'FREE', status: 'CANCELLED' } });
            return { cancelled: true, mock: true };
        }
        await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
        await this.prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true } });
        return { cancelled: true };
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService,
        payments_service_1.PaymentsService,
        content_service_1.ContentService])
], BillingService);
//# sourceMappingURL=billing.service.js.map