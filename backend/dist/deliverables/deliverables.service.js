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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliverablesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const payouts_service_1 = require("../payments/payouts.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
const REVISION_INCLUDE = {
    revisions: { orderBy: { version: 'desc' } },
};
let DeliverablesService = class DeliverablesService {
    prisma;
    notifications;
    payouts;
    constructor(prisma, notifications, payouts) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.payouts = payouts;
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
    async creatorProfileFor(userId) {
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { userId },
        });
        if (!creator)
            throw new common_1.ForbiddenException('Creator profile required');
        return creator;
    }
    async create(brandUserId, campaignId, dto) {
        const campaign = await this.campaignOwnedByBrand(brandUserId, campaignId);
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { id: dto.creatorProfileId },
            include: { user: { select: { id: true, profile: { select: { displayName: true } } } } },
        });
        if (!creator)
            throw new common_1.NotFoundException('Creator not found');
        const engaged = await this.prisma.proposal.findFirst({
            where: { campaignId, creatorId: creator.id, status: 'ACCEPTED' },
        });
        const invited = await this.prisma.campaignInvitation.findFirst({
            where: { campaignId, creatorId: creator.id, status: 'ACCEPTED' },
        });
        if (!engaged && !invited) {
            throw new common_1.BadRequestException('This creator has not accepted an invitation or had a proposal accepted for this campaign yet.');
        }
        const deliverable = await this.prisma.deliverable.create({
            data: {
                campaignId,
                creatorProfileId: creator.id,
                title: dto.title,
                description: dto.description,
                platform: dto.platform,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                agreedRateUsd: dto.agreedRateUsd,
            },
            include: REVISION_INCLUDE,
        });
        await this.notifications.create(creator.user.id, {
            type: 'DELIVERABLE',
            title: 'New deliverable assigned',
            body: `"${dto.title}" for the campaign "${campaign.title}"`,
            link: '/dashboard/creator/deliverables',
        });
        return deliverable;
    }
    async update(brandUserId, deliverableId, dto) {
        const deliverable = await this.prisma.deliverable.findFirst({
            where: { id: deliverableId, campaign: { brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) } },
        });
        if (!deliverable)
            throw new common_1.NotFoundException('Deliverable not found');
        return this.prisma.deliverable.update({
            where: { id: deliverableId },
            data: {
                title: dto.title,
                description: dto.description,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                agreedRateUsd: dto.agreedRateUsd,
            },
            include: REVISION_INCLUDE,
        });
    }
    async cancel(brandUserId, deliverableId) {
        const deliverable = await this.prisma.deliverable.findFirst({
            where: { id: deliverableId, campaign: { brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) } },
        });
        if (!deliverable)
            throw new common_1.NotFoundException('Deliverable not found');
        if (deliverable.status === 'APPROVED') {
            throw new common_1.BadRequestException('An approved deliverable cannot be cancelled — it may already be owed a payout.');
        }
        return this.prisma.deliverable.update({
            where: { id: deliverableId },
            data: { status: 'CANCELLED' },
            include: REVISION_INCLUDE,
        });
    }
    async listForCampaign(brandUserId, campaignId) {
        await this.campaignOwnedByBrand(brandUserId, campaignId);
        return this.prisma.deliverable.findMany({
            where: { campaignId },
            include: {
                ...REVISION_INCLUDE,
                creatorProfile: {
                    include: {
                        user: { select: { profile: { select: { displayName: true, avatarUrl: true } } } },
                    },
                },
            },
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async listMine(creatorUserId) {
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { userId: creatorUserId },
        });
        if (!creator)
            return [];
        return this.prisma.deliverable.findMany({
            where: { creatorProfileId: creator.id, status: { not: 'CANCELLED' } },
            include: {
                ...REVISION_INCLUDE,
                campaign: { include: { brand: { select: { companyName: true, logoUrl: true } } } },
            },
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        });
    }
    async listPendingReview(brandUserId) {
        return this.prisma.deliverable.findMany({
            where: {
                campaign: { brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
                status: 'SUBMITTED',
            },
            include: {
                ...REVISION_INCLUDE,
                campaign: { select: { id: true, title: true } },
                creatorProfile: {
                    include: {
                        user: { select: { profile: { select: { displayName: true, avatarUrl: true } } } },
                    },
                },
            },
            orderBy: { submittedAt: 'asc' },
        });
    }
    async submit(creatorUserId, deliverableId, dto) {
        if (!dto.contentUrl && !dto.fileUrl) {
            throw new common_1.BadRequestException('Provide a link to the published content or upload a file.');
        }
        const creator = await this.creatorProfileFor(creatorUserId);
        const deliverable = await this.prisma.deliverable.findFirst({
            where: { id: deliverableId, creatorProfileId: creator.id },
            include: {
                campaign: { include: { brand: { select: { userId: true } } } },
                revisions: { orderBy: { version: 'desc' }, take: 1 },
            },
        });
        if (!deliverable)
            throw new common_1.NotFoundException('Deliverable not found');
        if (deliverable.status === 'APPROVED') {
            throw new common_1.BadRequestException('This deliverable has already been approved.');
        }
        if (deliverable.status === 'CANCELLED') {
            throw new common_1.BadRequestException('This deliverable was cancelled.');
        }
        if (deliverable.status === 'SUBMITTED') {
            throw new common_1.BadRequestException('This submission is already awaiting review. Wait for feedback before resubmitting.');
        }
        const nextVersion = (deliverable.revisions[0]?.version ?? 0) + 1;
        const [, updated] = await this.prisma.$transaction([
            this.prisma.deliverableRevision.create({
                data: {
                    deliverableId,
                    version: nextVersion,
                    contentUrl: dto.contentUrl,
                    fileUrl: dto.fileUrl,
                    note: dto.note,
                    submittedById: creatorUserId,
                },
            }),
            this.prisma.deliverable.update({
                where: { id: deliverableId },
                data: { status: 'SUBMITTED', submittedAt: new Date() },
                include: REVISION_INCLUDE,
            }),
        ]);
        await this.notifications.create(deliverable.campaign.brand.userId, {
            type: 'DELIVERABLE',
            title: nextVersion === 1
                ? 'Deliverable submitted for review'
                : `Revision ${nextVersion} submitted`,
            body: `"${deliverable.title}" is ready for your review.`,
            link: `/dashboard/brand/campaigns/${deliverable.campaignId}/deliverables`,
        });
        return updated;
    }
    async review(brandUserId, deliverableId, dto) {
        const deliverable = await this.prisma.deliverable.findFirst({
            where: { id: deliverableId, campaign: { brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) } },
            include: {
                campaign: { select: { id: true, title: true } },
                creatorProfile: { select: { userId: true } },
                revisions: { orderBy: { version: 'desc' }, take: 1 },
            },
        });
        if (!deliverable)
            throw new common_1.NotFoundException('Deliverable not found');
        if (deliverable.status !== 'SUBMITTED') {
            throw new common_1.BadRequestException('There is nothing awaiting review on this deliverable.');
        }
        if (dto.outcome === 'CHANGES_REQUESTED' && !dto.feedback?.trim()) {
            throw new common_1.BadRequestException('Explain what needs to change so the creator knows how to revise.');
        }
        const latest = deliverable.revisions[0];
        const approved = dto.outcome === 'APPROVED';
        const [, updated] = await this.prisma.$transaction([
            this.prisma.deliverableRevision.update({
                where: { id: latest.id },
                data: {
                    outcome: dto.outcome,
                    feedback: dto.feedback,
                    reviewedById: brandUserId,
                    reviewedAt: new Date(),
                },
            }),
            this.prisma.deliverable.update({
                where: { id: deliverableId },
                data: {
                    status: approved ? 'APPROVED' : 'CHANGES_REQUESTED',
                    approvedAt: approved ? new Date() : null,
                },
                include: REVISION_INCLUDE,
            }),
        ]);
        await this.notifications.create(deliverable.creatorProfile.userId, {
            type: 'DELIVERABLE',
            title: approved ? 'Deliverable approved' : 'Changes requested',
            body: approved
                ? `"${deliverable.title}" was approved for "${deliverable.campaign.title}".`
                : `"${deliverable.title}": ${dto.feedback}`,
            link: '/dashboard/creator/deliverables',
        });
        if (approved) {
            await this.payouts.createForApprovedDeliverable(deliverableId);
            await this.completeCampaignIfDone(deliverable.campaignId);
        }
        return updated;
    }
    async completeCampaignIfDone(campaignId) {
        const outstanding = await this.prisma.deliverable.count({
            where: {
                campaignId,
                status: { notIn: ['APPROVED', 'CANCELLED'] },
            },
        });
        if (outstanding > 0)
            return;
        const total = await this.prisma.deliverable.count({
            where: { campaignId, status: 'APPROVED' },
        });
        if (total === 0)
            return;
        await this.prisma.campaign.updateMany({
            where: { id: campaignId, status: 'ACTIVE' },
            data: { status: 'COMPLETED' },
        });
    }
    async summaryForCampaign(brandUserId, campaignId) {
        await this.campaignOwnedByBrand(brandUserId, campaignId);
        const grouped = await this.prisma.deliverable.groupBy({
            by: ['status'],
            where: { campaignId },
            _count: { _all: true },
            _sum: { agreedRateUsd: true },
        });
        const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
        const committedUsd = grouped
            .filter((g) => g.status !== 'CANCELLED')
            .reduce((sum, g) => sum + (g._sum.agreedRateUsd ?? 0), 0);
        const approvedUsd = grouped.find((g) => g.status === 'APPROVED')?._sum.agreedRateUsd ?? 0;
        const total = Object.entries(counts)
            .filter(([status]) => status !== 'CANCELLED')
            .reduce((sum, [, n]) => sum + n, 0);
        return {
            total,
            pending: counts.PENDING ?? 0,
            submitted: counts.SUBMITTED ?? 0,
            changesRequested: counts.CHANGES_REQUESTED ?? 0,
            approved: counts.APPROVED ?? 0,
            cancelled: counts.CANCELLED ?? 0,
            committedUsd,
            approvedUsd,
            percentComplete: total === 0 ? 0 : Math.round(((counts.APPROVED ?? 0) / total) * 100),
        };
    }
};
exports.DeliverablesService = DeliverablesService;
exports.DeliverablesService = DeliverablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        payouts_service_1.PayoutsService])
], DeliverablesService);
//# sourceMappingURL=deliverables.service.js.map