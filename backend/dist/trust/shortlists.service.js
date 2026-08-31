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
exports.ShortlistsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
let ShortlistsService = class ShortlistsService {
    prisma;
    workspaces;
    constructor(prisma, workspaces) {
        this.prisma = prisma;
        this.workspaces = workspaces;
    }
    async brandProfile(userId) {
        const brand = await this.workspaces.resolveActive(userId);
        if (!brand)
            throw new common_1.ForbiddenException('Brand profile required');
        return brand;
    }
    async list(brandUserId) {
        const brand = await this.brandProfile(brandUserId);
        return this.prisma.shortlist.findMany({
            where: { brandProfileId: brand.id },
            include: {
                creatorProfile: {
                    include: {
                        socialAccounts: true,
                        user: { select: { profile: { select: { displayName: true, avatarUrl: true } } } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async add(brandUserId, creatorProfileId, listName = 'Saved', note) {
        const brand = await this.brandProfile(brandUserId);
        return this.prisma.shortlist.upsert({
            where: {
                brandProfileId_creatorProfileId: {
                    brandProfileId: brand.id,
                    creatorProfileId,
                },
            },
            create: { brandProfileId: brand.id, creatorProfileId, listName, note },
            update: { listName, note },
        });
    }
    async remove(brandUserId, creatorProfileId) {
        const brand = await this.brandProfile(brandUserId);
        await this.prisma.shortlist
            .delete({
            where: {
                brandProfileId_creatorProfileId: {
                    brandProfileId: brand.id,
                    creatorProfileId,
                },
            },
        })
            .catch(() => undefined);
        return { removed: true };
    }
    async savedIds(brandUserId) {
        const brand = await this.workspaces.resolveActive(brandUserId);
        if (!brand)
            return [];
        const rows = await this.prisma.shortlist.findMany({
            where: { brandProfileId: brand.id },
            select: { creatorProfileId: true },
        });
        return rows.map((r) => r.creatorProfileId);
    }
};
exports.ShortlistsService = ShortlistsService;
exports.ShortlistsService = ShortlistsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        workspaces_service_1.WorkspacesService])
], ShortlistsService);
//# sourceMappingURL=shortlists.service.js.map