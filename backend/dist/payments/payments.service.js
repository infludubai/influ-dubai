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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const settings_service_1 = require("../settings/settings.service");
const audit_service_1 = require("../audit/audit.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
function money(n) {
    return Math.round(n * 100) / 100;
}
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    settings;
    audit;
    workspaces;
    logger = new common_1.Logger(PaymentsService_1.name);
    client = null;
    clientKey = '';
    constructor(prisma, settings, audit, workspaces) {
        this.prisma = prisma;
        this.settings = settings;
        this.audit = audit;
        this.workspaces = workspaces;
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
    async campaignOwnedByBrand(brandUserId, campaignId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
            include: { brand: true },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return campaign;
    }
    async fundCampaign(brandUserId, campaignId, amountUsd, urls) {
        if (!(amountUsd > 0)) {
            throw new common_1.BadRequestException('Enter an amount greater than zero.');
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
    async markCheckoutPaid(sessionId, paymentIntentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { stripeCheckoutSessionId: sessionId },
        });
        if (!payment || payment.status === 'PAID')
            return;
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
    async listForCampaign(brandUserId, campaignId) {
        await this.campaignOwnedByBrand(brandUserId, campaignId);
        return this.prisma.payment.findMany({
            where: { campaignId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async spendSummary(brandUserId) {
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
        const committedUsd = money(payouts.reduce((t, p) => t + (p._sum.grossUsd ?? 0), 0));
        const paidOutUsd = money(payouts
            .filter((p) => p.status === 'PAID')
            .reduce((t, p) => t + (p._sum.grossUsd ?? 0), 0));
        return {
            fundedUsd,
            committedUsd,
            paidOutUsd,
            balanceUsd: money(fundedUsd - committedUsd),
            payments,
        };
    }
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService,
        audit_service_1.AuditService,
        workspaces_service_1.WorkspacesService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map