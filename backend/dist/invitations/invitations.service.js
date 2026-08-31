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
exports.InvitationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
let InvitationsService = class InvitationsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async invite(brandUserId, campaignId, dto) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found or not yours');
        const creator = await this.prisma.creatorProfile.findUnique({ where: { id: dto.creatorId } });
        if (!creator)
            throw new common_1.NotFoundException('Creator not found');
        const inv = await this.prisma.campaignInvitation.upsert({
            where: { campaignId_creatorId: { campaignId, creatorId: dto.creatorId } },
            create: { campaignId, creatorId: dto.creatorId, message: dto.message },
            update: { status: 'PENDING', message: dto.message },
        });
        await this.notifications.create(creator.userId, {
            type: 'INVITATION',
            title: 'New campaign invitation',
            body: `You've been invited to "${campaign.title}"`,
            link: `/dashboard/creator/inbox`,
        });
        return inv;
    }
    async listForCampaign(brandUserId, campaignId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, brand: workspaces_service_1.WorkspacesService.accessFilter(brandUserId) },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return this.prisma.campaignInvitation.findMany({
            where: { campaignId },
            include: { creator: { include: { user: { select: { profile: { select: { displayName: true } } } } } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listForCreator(creatorUserId) {
        const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
        if (!creator)
            return [];
        return this.prisma.campaignInvitation.findMany({
            where: { creatorId: creator.id },
            include: { campaign: { include: { brand: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async respond(creatorUserId, invitationId, status) {
        const inv = await this.prisma.campaignInvitation.findUnique({
            where: { id: invitationId },
            include: { creator: true, campaign: { include: { brand: true } } },
        });
        if (!inv)
            throw new common_1.NotFoundException('Invitation not found');
        if (inv.creator.userId !== creatorUserId)
            throw new common_1.ForbiddenException();
        const updated = await this.prisma.campaignInvitation.update({
            where: { id: invitationId },
            data: { status },
        });
        await this.notifications.create(inv.campaign.brand.userId, {
            type: 'INVITATION_RESPONSE',
            title: `Invitation ${status.toLowerCase()}`,
            body: `A creator has ${status.toLowerCase()} your invitation to "${inv.campaign.title}"`,
            link: `/dashboard/brand/campaigns/${inv.campaignId}`,
        });
        return updated;
    }
};
exports.InvitationsService = InvitationsService;
exports.InvitationsService = InvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], InvitationsService);
//# sourceMappingURL=invitations.service.js.map