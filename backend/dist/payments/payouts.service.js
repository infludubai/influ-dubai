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
var PayoutsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const settings_service_1 = require("../settings/settings.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
const DEFAULT_FEE_PERCENT = 10;
function money(n) {
    return Math.round(n * 100) / 100;
}
let PayoutsService = PayoutsService_1 = class PayoutsService {
    prisma;
    settings;
    notifications;
    audit;
    logger = new common_1.Logger(PayoutsService_1.name);
    constructor(prisma, settings, notifications, audit) {
        this.prisma = prisma;
        this.settings = settings;
        this.notifications = notifications;
        this.audit = audit;
    }
    feePercent() {
        const raw = this.settings.getNumber('PLATFORM_FEE_PERCENT', DEFAULT_FEE_PERCENT);
        if (raw < 0 || raw > 100) {
            this.logger.warn(`PLATFORM_FEE_PERCENT is ${raw}, outside 0–100 — falling back to ${DEFAULT_FEE_PERCENT}%.`);
            return DEFAULT_FEE_PERCENT;
        }
        return raw;
    }
    async createForApprovedDeliverable(deliverableId) {
        const deliverable = await this.prisma.deliverable.findUnique({
            where: { id: deliverableId },
            include: {
                payout: true,
                campaign: { select: { id: true, title: true } },
                creatorProfile: { select: { id: true, userId: true } },
            },
        });
        if (!deliverable)
            return null;
        if (deliverable.payout)
            return deliverable.payout;
        const gross = deliverable.agreedRateUsd ?? 0;
        if (gross <= 0) {
            return null;
        }
        const feePercent = this.feePercent();
        const feeUsd = money((gross * feePercent) / 100);
        const netUsd = money(gross - feeUsd);
        const payout = await this.prisma.payout.create({
            data: {
                deliverableId,
                creatorProfileId: deliverable.creatorProfile.id,
                campaignId: deliverable.campaignId,
                grossUsd: money(gross),
                feePercent,
                feeUsd,
                netUsd,
            },
        });
        await this.notifications.create(deliverable.creatorProfile.userId, {
            type: 'PAYOUT',
            title: 'Payment pending',
            body: `$${netUsd.toLocaleString()} is queued for "${deliverable.title}" (after a ${feePercent}% platform fee).`,
            link: '/dashboard/creator/earnings',
        });
        return payout;
    }
    async earningsFor(creatorUserId) {
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { userId: creatorUserId },
            select: { id: true },
        });
        if (!creator) {
            return { payouts: [], totals: { pending: 0, paid: 0, lifetimeGross: 0, fees: 0 } };
        }
        const payouts = await this.prisma.payout.findMany({
            where: { creatorProfileId: creator.id },
            include: {
                deliverable: { select: { title: true, approvedAt: true } },
                campaign: { select: { id: true, title: true, brand: { select: { companyName: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const sum = (filter, field) => money(payouts.filter(filter).reduce((t, p) => t + p[field], 0));
        return {
            payouts,
            totals: {
                pending: sum((p) => p.status === 'PENDING' || p.status === 'PROCESSING', 'netUsd'),
                paid: sum((p) => p.status === 'PAID', 'netUsd'),
                lifetimeGross: sum(() => true, 'grossUsd'),
                fees: sum(() => true, 'feeUsd'),
            },
        };
    }
    async listForAdmin(status) {
        const where = status && status !== 'ALL' ? { status: status } : {};
        const payouts = await this.prisma.payout.findMany({
            where,
            include: {
                deliverable: { select: { title: true } },
                campaign: { select: { title: true, brand: { select: { companyName: true } } } },
                creatorProfile: {
                    select: {
                        id: true,
                        user: { select: { email: true, profile: { select: { displayName: true } } } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
        const grouped = await this.prisma.payout.groupBy({
            by: ['status'],
            _count: { _all: true },
            _sum: { netUsd: true, feeUsd: true },
        });
        return {
            payouts,
            summary: grouped.map((g) => ({
                status: g.status,
                count: g._count._all,
                netUsd: money(g._sum.netUsd ?? 0),
                feeUsd: money(g._sum.feeUsd ?? 0),
            })),
        };
    }
    async updateStatus(adminUserId, payoutId, status, opts = {}) {
        const payout = await this.prisma.payout.findUnique({
            where: { id: payoutId },
            include: {
                deliverable: { select: { title: true } },
                creatorProfile: { select: { userId: true } },
            },
        });
        if (!payout)
            throw new common_1.NotFoundException('Payout not found');
        if (payout.status === 'PAID') {
            throw new common_1.BadRequestException('This payout is already marked paid — reversing it would need a manual refund record.');
        }
        if (status === 'FAILED' && !opts.failureReason?.trim()) {
            throw new common_1.BadRequestException('Give a reason so the creator knows what went wrong.');
        }
        const updated = await this.prisma.payout.update({
            where: { id: payoutId },
            data: {
                status,
                reference: opts.reference ?? payout.reference,
                failureReason: status === 'FAILED' ? opts.failureReason : null,
                paidAt: status === 'PAID' ? new Date() : null,
                releasedById: adminUserId,
            },
        });
        this.audit.log({
            userId: adminUserId,
            action: `payout.${status.toLowerCase()}`,
            resource: 'payout',
            resourceId: payoutId,
            meta: { netUsd: payout.netUsd, reference: opts.reference },
        });
        if (status === 'PAID') {
            await this.notifications.create(payout.creatorProfile.userId, {
                type: 'PAYOUT',
                title: 'You have been paid',
                body: `$${payout.netUsd.toLocaleString()} for "${payout.deliverable.title}" has been released.`,
                link: '/dashboard/creator/earnings',
            });
        }
        else if (status === 'FAILED') {
            await this.notifications.create(payout.creatorProfile.userId, {
                type: 'PAYOUT',
                title: 'Payment failed',
                body: opts.failureReason ?? 'Your payout could not be processed.',
                link: '/dashboard/creator/earnings',
            });
        }
        return updated;
    }
};
exports.PayoutsService = PayoutsService;
exports.PayoutsService = PayoutsService = PayoutsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], PayoutsService);
//# sourceMappingURL=payouts.service.js.map