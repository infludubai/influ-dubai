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
exports.ProposalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
let ProposalsService = class ProposalsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async submit(creatorUserId, campaignId, dto) {
        const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
        if (!creator)
            throw new common_1.ForbiddenException('Creator profile required');
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { brand: true },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        const proposal = await this.prisma.proposal.upsert({
            where: { campaignId_creatorId: { campaignId, creatorId: creator.id } },
            create: { campaignId, creatorId: creator.id, ...dto },
            update: { coverLetter: dto.coverLetter, proposedRate: dto.proposedRate, status: 'PENDING' },
        });
        await this.notifications.create(campaign.brand.userId, {
            type: 'PROPOSAL',
            title: 'New proposal received',
            body: `A creator submitted a proposal for "${campaign.title}"`,
            link: `/dashboard/brand/campaigns/${campaignId}/proposals`,
        });
        return proposal;
    }
    async listForCampaign(brandUserId, campaignId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return this.prisma.proposal.findMany({
            where: { campaignId },
            include: {
                creator: {
                    include: {
                        user: { select: { profile: { select: { displayName: true } } } },
                        socialAccounts: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listMine(creatorUserId) {
        const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
        if (!creator)
            return [];
        return this.prisma.proposal.findMany({
            where: { creatorId: creator.id },
            include: { campaign: { include: { brand: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async respond(brandUserId, proposalId, status) {
        const proposal = await this.prisma.proposal.findUnique({
            where: { id: proposalId },
            include: { campaign: { include: { brand: true } }, creator: true },
        });
        if (!proposal)
            throw new common_1.NotFoundException('Proposal not found');
        if (proposal.campaign.brand.userId !== brandUserId)
            throw new common_1.ForbiddenException();
        const updated = await this.prisma.proposal.update({
            where: { id: proposalId },
            data: { status },
        });
        await this.notifications.create(proposal.creator.userId, {
            type: 'PROPOSAL_RESPONSE',
            title: `Proposal ${status.toLowerCase()}`,
            body: `Your proposal for "${proposal.campaign.title}" was ${status.toLowerCase()}`,
            link: `/dashboard/creator/inbox`,
        });
        return updated;
    }
    async withdraw(creatorUserId, proposalId) {
        const proposal = await this.prisma.proposal.findUnique({
            where: { id: proposalId },
            include: { creator: true },
        });
        if (!proposal)
            throw new common_1.NotFoundException();
        if (proposal.creator.userId !== creatorUserId)
            throw new common_1.ForbiddenException();
        return this.prisma.proposal.update({ where: { id: proposalId }, data: { status: 'WITHDRAWN' } });
    }
};
exports.ProposalsService = ProposalsService;
exports.ProposalsService = ProposalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ProposalsService);
//# sourceMappingURL=proposals.service.js.map