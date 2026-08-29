import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Brand-side money in: funding a campaign budget so payouts have cover.
 *
 * With Stripe configured this creates a real Checkout session; without it the
 * payment is recorded in MOCK mode and marked paid immediately, so the whole
 * flow stays demonstrable before a Stripe account exists.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private client: Stripe | null = null;
  private clientKey = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
    private readonly workspaces: WorkspacesService,
  ) {}

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

  private async campaignOwnedByBrand(brandUserId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, brand: WorkspacesService.accessFilter(brandUserId) },
      include: { brand: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async fundCampaign(
    brandUserId: string,
    campaignId: string,
    amountUsd: number,
    urls: { successUrl: string; cancelUrl: string },
  ) {
    if (!(amountUsd > 0)) {
      throw new BadRequestException('Enter an amount greater than zero.');
    }

    const campaign = await this.campaignOwnedByBrand(brandUserId, campaignId);
    const stripe = this.stripe;

    if (!stripe) {
      const payment = await this.prisma.payment.create({
        data: {
          campaignId,
          brandProfileId: campaign.brandId,
          amountUsd: money(amountUsd),
          status: 'PAID',
          method: 'MOCK',
          description: `Mock funding for "${campaign.title}"`,
          paidAt: new Date(),
        },
      });
      this.audit.log({
        userId: brandUserId,
        action: 'payment.mock_funded',
        resource: 'campaign',
        resourceId: campaignId,
        meta: { amountUsd: payment.amountUsd },
      });
      return { payment, checkoutUrl: null, mock: true };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amountUsd * 100),
            product_data: { name: `Campaign funding — ${campaign.title}` },
          },
        },
      ],
      success_url: urls.successUrl,
      cancel_url: urls.cancelUrl,
      metadata: { campaignId, brandProfileId: campaign.brandId, kind: 'campaign_funding' },
    });

    const payment = await this.prisma.payment.create({
      data: {
        campaignId,
        brandProfileId: campaign.brandId,
        amountUsd: money(amountUsd),
        status: 'PENDING',
        method: 'STRIPE',
        description: `Funding for "${campaign.title}"`,
        stripeCheckoutSessionId: session.id,
      },
    });

    return { payment, checkoutUrl: session.url, mock: false };
  }

  /** Called from the Stripe webhook once a funding checkout completes. */
  async markCheckoutPaid(sessionId: string, paymentIntentId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });
    if (!payment || payment.status === 'PAID') return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId ?? payment.stripePaymentIntentId,
      },
    });
    this.logger.log(`Campaign funding paid: ${payment.id} ($${payment.amountUsd})`);
  }

  async listForCampaign(brandUserId: string, campaignId: string) {
    await this.campaignOwnedByBrand(brandUserId, campaignId);
    return this.prisma.payment.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Brand spend overview: what has been funded versus what approved work has
   * committed, so a brand can see whether their balance covers pending payouts.
   */
  async spendSummary(brandUserId: string) {
    const brand = await this.workspaces.resolveActive(brandUserId);
    if (!brand) {
      return { fundedUsd: 0, committedUsd: 0, paidOutUsd: 0, balanceUsd: 0, payments: [] };
    }

    const [funded, payouts, payments] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { brandProfileId: brand.id, status: 'PAID' },
        _sum: { amountUsd: true },
      }),
      this.prisma.payout.groupBy({
        by: ['status'],
        where: { campaign: { brandId: brand.id } },
        _sum: { grossUsd: true },
      }),
      this.prisma.payment.findMany({
        where: { brandProfileId: brand.id },
        include: { campaign: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const fundedUsd = money(funded._sum.amountUsd ?? 0);
    const committedUsd = money(
      payouts.reduce((t, p) => t + (p._sum.grossUsd ?? 0), 0),
    );
    const paidOutUsd = money(
      payouts
        .filter((p) => p.status === 'PAID')
        .reduce((t, p) => t + (p._sum.grossUsd ?? 0), 0),
    );

    return {
      fundedUsd,
      committedUsd,
      paidOutUsd,
      balanceUsd: money(fundedUsd - committedUsd),
      payments,
    };
  }

  /** Platform revenue: subscription invoices plus payout fees. */
  async platformRevenue() {
    const [fees, invoices] = await Promise.all([
      this.prisma.payout.aggregate({ _sum: { feeUsd: true }, _count: { _all: true } }),
      this.prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { amountUsd: true },
        _count: { _all: true },
      }),
    ]);

    const feeRevenue = money(fees._sum.feeUsd ?? 0);
    const subscriptionRevenue = money(invoices._sum.amountUsd ?? 0);

    return {
      feeRevenue,
      subscriptionRevenue,
      totalRevenue: money(feeRevenue + subscriptionRevenue),
      payoutCount: fees._count._all,
      invoiceCount: invoices._count._all,
    };
  }
}
