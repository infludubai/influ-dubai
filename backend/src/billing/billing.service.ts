import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

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
  private readonly stripe: Stripe | null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? new Stripe(key) : null;
    if (!this.stripe) this.logger.warn('STRIPE_SECRET_KEY not set — billing runs in mock mode');
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

    if (!this.stripe) {
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
      ? this.config.get('STRIPE_PRICE_PROFESSIONAL')
      : this.config.get('STRIPE_PRICE_ENTERPRISE');

    if (!priceId) throw new Error('Stripe price ID not configured');

    // Ensure Stripe customer
    let customerId = sub.stripeCustomerId ?? undefined;
    if (!customerId) {
      const user = await this.prisma.subscription.findUnique({ where: { userId } });
      const customer = await this.stripe.customers.create({ metadata: { userId } });
      customerId = customer.id;
      await this.prisma.subscription.update({ where: { userId }, data: { stripeCustomerId: customerId } });
    }

    const session = await this.stripe.checkout.sessions.create({
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

    if (!this.stripe || !sub.stripeCustomerId) {
      return { url: returnUrl, mock: true };
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url, mock: false };
  }

  // Handle Stripe webhook
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) return;
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan } = session.metadata ?? {};
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
    if (!this.stripe || !sub.stripeSubscriptionId) {
      await this.prisma.subscription.update({ where: { userId }, data: { plan: 'FREE', status: 'CANCELLED' } });
      return { cancelled: true, mock: true };
    }
    await this.stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    await this.prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true } });
    return { cancelled: true };
  }
}
