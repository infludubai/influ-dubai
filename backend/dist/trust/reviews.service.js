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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
let ReviewsService = class ReviewsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async assertWorkedTogether(campaignId, creatorProfileId) {
        const approved = await this.prisma.deliverable.count({
            where: { campaignId, creatorProfileId, status: 'APPROVED' },
        });
        if (approved === 0) {
            throw new common_1.BadRequestException('You can only leave a review after a deliverable on this campaign has been approved.');
        }
    }
    async createFromBrand(brandUserId, campaignId, creatorProfileId, rating, comment) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
            include: { brand: { select: { id: true, companyName: true } } },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.assertWorkedTogether(campaignId, creatorProfileId);
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { id: creatorProfileId },
            select: { userId: true },
        });
        if (!creator)
            throw new common_1.NotFoundException('Creator not found');
        const review = await this.prisma.review.upsert({
            where: {
                campaignId_direction_authorUserId: {
                    campaignId,
                    direction: 'BRAND_TO_CREATOR',
                    authorUserId: brandUserId,
                },
            },
            create: {
                campaignId,
                creatorProfileId,
                brandProfileId: campaign.brand.id,
                direction: 'BRAND_TO_CREATOR',
                authorUserId: brandUserId,
                rating,
                comment,
            },
            update: { rating, comment },
        });
        await this.recomputeCreatorRating(creatorProfileId);
        await this.notifications.create(creator.userId, {
            type: 'REVIEW',
            title: `${campaign.brand.companyName} left you a ${rating}-star review`,
            body: comment ?? `For the campaign "${campaign.title}".`,
            link: '/dashboard/creator/profile',
        });
        return review;
    }
    async createFromCreator(creatorUserId, campaignId, rating, comment) {
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { userId: creatorUserId },
            select: { id: true },
        });
        if (!creator)
            throw new common_1.ForbiddenException('Creator profile required');
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { brand: { select: { id: true, userId: true } } },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.assertWorkedTogether(campaignId, creator.id);
        const review = await this.prisma.review.upsert({
            where: {
                campaignId_direction_authorUserId: {
                    campaignId,
                    direction: 'CREATOR_TO_BRAND',
                    authorUserId: creatorUserId,
                },
            },
            create: {
                campaignId,
                creatorProfileId: creator.id,
                brandProfileId: campaign.brand.id,
                direction: 'CREATOR_TO_BRAND',
                authorUserId: creatorUserId,
                rating,
                comment,
            },
            update: { rating, comment },
        });
        await this.recomputeBrandRating(campaign.brand.id);
        await this.notifications.create(campaign.brand.userId, {
            type: 'REVIEW',
            title: `A creator left you a ${rating}-star review`,
            body: comment ?? `For the campaign "${campaign.title}".`,
            link: '/dashboard/brand/profile',
        });
        return review;
    }
    async recomputeCreatorRating(creatorProfileId) {
        const agg = await this.prisma.review.aggregate({
            where: { creatorProfileId, direction: 'BRAND_TO_CREATOR' },
            _avg: { rating: true },
            _count: { _all: true },
        });
        await this.prisma.creatorProfile.update({
            where: { id: creatorProfileId },
            data: {
                ratingAvg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
                ratingCount: agg._count._all,
            },
        });
    }
    async recomputeBrandRating(brandProfileId) {
        const agg = await this.prisma.review.aggregate({
            where: { brandProfileId, direction: 'CREATOR_TO_BRAND' },
            _avg: { rating: true },
            _count: { _all: true },
        });
        await this.prisma.brandProfile.update({
            where: { id: brandProfileId },
            data: {
                ratingAvg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
                ratingCount: agg._count._all,
            },
        });
    }
    listForCreator(creatorProfileId) {
        return this.prisma.review.findMany({
            where: { creatorProfileId, direction: 'BRAND_TO_CREATOR' },
            include: {
                campaign: { select: { title: true } },
                brandProfile: { select: { companyName: true, logoUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    listForBrand(brandProfileId) {
        return this.prisma.review.findMany({
            where: { brandProfileId, direction: 'CREATOR_TO_BRAND' },
            include: {
                campaign: { select: { title: true } },
                creatorProfile: {
                    select: {
                        id: true,
                        profileImageUrl: true,
                        user: { select: { profile: { select: { displayName: true } } } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async pendingForBrand(brandUserId) {
        const campaigns = await this.prisma.campaign.findMany({
            where: {
                brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId),
                deliverables: { some: { status: 'APPROVED' } },
            },
            include: {
                deliverables: {
                    where: { status: 'APPROVED' },
                    select: {
                        creatorProfileId: true,
                        creatorProfile: {
                            select: { user: { select: { profile: { select: { displayName: true } } } } },
                        },
                    },
                },
                reviews: { where: { direction: 'BRAND_TO_CREATOR', authorUserId: brandUserId } },
            },
            take: 20,
        });
        return campaigns
            .filter((c) => c.reviews.length === 0 && c.deliverables.length > 0)
            .map((c) => ({
            campaignId: c.id,
            campaignTitle: c.title,
            creatorProfileId: c.deliverables[0].creatorProfileId,
            creatorName: c.deliverables[0].creatorProfile.user?.profile?.displayName ?? 'Creator',
        }));
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map