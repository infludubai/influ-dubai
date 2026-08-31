import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { PaymentsService } from '../payments/payments.service';
import { ContentService } from '../content/content.service';

/**
 * Structural plan limits. Prices and display copy are NOT here — they live in
 * the content catalog so an admin can change them from Admin → Content without
 * a redeploy. Only entitlements are code, because changing those changes
 * behaviour rather than presentation.
 */
export const PLANS = {
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
    campaigns: -1, // unlimited
    creators: -1,
    aiInsights: true,
    analytics: true,
    support: 'Dedicated',
  },
} as const;

export type PlanKey = keyof typeof PLANS;

const CONTENT_KEY: Record<PlanKey, string> = {
  FREE: 'free',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private client: Stripe | null = null;
  private clientKey = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly payments: PaymentsService,
    private readonly content: ContentService,
  ) {}

  /** Price for a plan, as configured in Admin → Content → Pricing. */
  planPrice(plan: PlanKey): number {
    const raw = this.content.getPublic()[`pricing.${CONTENT_KEY[plan]}.price`];
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  planCurrency(): string {
    return (this.content.getPublic()['pricing.currency'] ?? 'AED').toUpperCase();
  }

  /** Plan definitions merged with admin-edited names, prices and features. */
  publicPlans() {
    const c = this.content.getPublic();
    const currency = this.planCurrency();

    return (Object.keys(PLANS) as PlanKey[]).map((key) => {
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
        ...PLANS[key],
      };
    });
  }

  /**
   * Resolved per call so a key saved in Admin → Settings switches billing out
   * of mock mode immediately. Null means mock mode — no real charges occur.
   */
  private get stripe(): Stripe | null {
    const key = this.settings.get('STRIPE_SECRET_KEY');
    if (!key) {
      this.client = null;
      this.clientKey = '';
      return null;
    }
    if (!this.client || this.clientKey !== key) {
  // Required here rather than imported at the top of the file: loading the
  // Stripe SDK costs memory at boot even when no key is configured, and
  // this process has very little to spare. The type import above is erased
  // at compile time, so it costs nothing.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
      this.client = new Stripe(key);
      this.clientKey = key;
    }
    return this.client;
  }

  /** True when real Stripe credentials are configured. */
  isLive(): boolean {
    return this.stripe !== null;
  }

  // Get or create subscription record for a user
  async getOrCreateSubscription(userId: string) {
    const existing = await this.prisma.subscription.findUnique({ where: { userId }, include: { invoices: { orderBy: { createdAt: 'desc' }, take: 10 } } });
    if (existing) return existing;
    return this.prisma.subscription.create({ data: { userId }, include: { invoices: true } });
  }

  async getSubscription(userId: string) {
    const sub = await this.getOrCreateSubscription(userId);
    // The plan says what the tier includes; overrides are what an admin has
    // granted this user on top. Overrides only ever add, so the merge is a
    // simple OR — clearing one returns the user to plan defaults.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { featureOverrides: true },
    });
    const plan = PLANS[sub.plan as PlanKey] ?? PLANS.FREE;
    const overrides = (user?.featureOverrides ?? {}) as Record<string, boolean>;
    return {
      ...sub,
      effectiveFeatures: {
        aiInsights: plan.aiInsights || overrides.aiInsights === true,
        analytics: plan.analytics || overrides.analytics === true,
        unlimitedCampaigns: plan.campaigns === -1 || overrides.unlimitedCampaigns === true,
      },
    };
  }

  // Create Stripe checkout session for upgrade
  async createCheckoutSession(userId: string, plan: 'PROFESSIONAL' | 'ENTERPRISE', successUrl: string, cancelUrl: string) {
    const sub = await this.getOrCreateSubscription(userId);
    const stripe = this.stripe;

    if (!stripe) {
      // Mock: simulate upgrade immediately
      const updated = await this.prisma.subscription.update({
        where: { userId },
        data: {
          plan,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      // Create a mock invoice
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
      throw new Error(
        `Stripe price ID for the ${plan} plan is not configured — set it in Admin → Settings → Stripe.`,
      );
    }

    // Ensure Stripe customer
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

  // Create billing portal session for managing subscription
  async createPortalSession(userId: string, returnUrl: string) {
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

  // Handle Stripe webhook
  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.stripe;
    if (!stripe) return;

    const secret = this.settings.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      // Processing unverified webhooks would let anyone forge subscription
      // upgrades, so refuse rather than fall back to an empty secret.
      this.logger.error(
        'Received a Stripe webhook but STRIPE_WEBHOOK_SECRET is not set — refusing to process it unverified.',
      );
      throw new Error('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan, kind } = session.metadata ?? {};

        // Campaign funding shares this event type with subscription checkout;
        // the metadata tag is what distinguishes them.
        if (kind === 'campaign_funding') {
          await this.payments.markCheckoutPaid(
            session.id,
            (session.payment_intent as string) ?? undefined,
          );
          break;
        }

        if (userId && plan) {
          await this.prisma.subscription.update({
            where: { userId },
            data: {
              plan: plan as any,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription as string,
            },
          });
        }
        break;
      }
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;
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
        const stripeSub = event.data.object as Stripe.Subscription;
        const customerId = stripeSub.customer as string;
        const sub = await this.prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
        if (sub) {
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: stripeSub.status.toUpperCase() as any,
              currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const customerId = stripeSub.customer as string;
        await this.prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: 'FREE', status: 'CANCELLED' },
        });
        break;
      }
    }
  }

  // Cancel at period end
  async cancelSubscription(userId: string) {
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
}
