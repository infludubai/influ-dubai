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
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
const VALID_TRANSITIONS = {
    DRAFT: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
    PAUSED: ['ACTIVE', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
};
let CampaignsService = class CampaignsService {
    prisma;
    workspaces;
    constructor(prisma, workspaces) {
        this.prisma = prisma;
        this.workspaces = workspaces;
    }
    async getBrandProfile(userId) {
        const profile = await this.workspaces.resolveActive(userId);
        if (!profile)
            throw new common_1.NotFoundException('Complete your brand profile first.');
        return profile;
    }
    async ownsCampaign(userId, campaignId) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, brand: workspaces_service_1.WorkspacesService.accessFilter(userId) },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found.');
        return campaign;
    }
    async create(userId, dto) {
        const brand = await this.getBrandProfile(userId);
        return this.prisma.campaign.create({
            data: {
                brandId: brand.id,
                title: dto.title,
                description: dto.description,
                type: dto.type,
                budgetUsd: dto.budgetUsd,
                targetAudience: dto.targetAudience,
                targetLocations: dto.targetLocations ?? [],
                targetCategories: dto.targetCategories ?? [],
                deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                requirements: dto.requirements,
            },
            include: { brand: true },
        });
    }
    async findAllForBrand(userId) {
        const brand = await this.getBrandProfile(userId);
        return this.prisma.campaign.findMany({
            where: { brandId: brand.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(campaignId) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { brand: { include: { user: { include: { profile: true } } } } },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found.');
        return campaign;
    }
    async update(userId, campaignId, dto) {
        const campaign = await this.ownsCampaign(userId, campaignId);
        if (dto.status && dto.status !== campaign.status) {
            const allowed = VALID_TRANSITIONS[campaign.status];
            if (!allowed.includes(dto.status)) {
                throw new common_1.ForbiddenException(`Cannot transition campaign from ${campaign.status} to ${dto.status}.`);
            }
        }
        return this.prisma.campaign.update({
            where: { id: campaignId },
            data: {
                ...(dto.title && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.type && { type: dto.type }),
                ...(dto.budgetUsd !== undefined && { budgetUsd: dto.budgetUsd }),
                ...(dto.targetAudience !== undefined && { targetAudience: dto.targetAudience }),
                ...(dto.targetLocations && { targetLocations: dto.targetLocations }),
                ...(dto.targetCategories && { targetCategories: dto.targetCategories }),
                ...(dto.deadline && { deadline: new Date(dto.deadline) }),
                ...(dto.requirements !== undefined && { requirements: dto.requirements }),
                ...(dto.status && { status: dto.status }),
            },
            include: { brand: true },
        });
    }
    async remove(userId, campaignId) {
        await this.ownsCampaign(userId, campaignId);
        return this.prisma.campaign.delete({ where: { id: campaignId } });
    }
    async listPublic(filters) {
        const { type, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const where = { status: 'ACTIVE' };
        if (type)
            where.type = type;
        const [items, total] = await Promise.all([
            this.prisma.campaign.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { brand: true },
            }),
            this.prisma.campaign.count({ where }),
        ]);
        return { items, total, page, limit };
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        workspaces_service_1.WorkspacesService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map