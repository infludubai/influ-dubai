import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { PaymentsService } from '../payments/payments.service';

export const PLANS = {
  FREE: {
    name: 'Free',
    priceUsd: 0,
    campaigns: 1,
    creators: 5,
    aiInsights: false,
    analytics: false,
    support: 'Community',
  },
  PROFESSIONAL: {
    name: 'Professional',
    priceUsd: 99,
    campaigns: 10,
    creators: 100,
    aiInsights: true,
    analytics: true,
    support: 'Email',
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceUsd: 299,
    campaigns: -1, // unlimited
    creators: -1,
    aiInsights: true,
    analytics: true,
    support: 'Dedicated',
  },
} as const;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private client: Stripe | null = null;
  private clientKey = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly payments: PaymentsService,
  ) {}

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
    return this.getOrCreateSubscription(userId);
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
          amountUsd: PLANS[plan].priceUsd,
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
