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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const workspaces_service_1 = require("../workspaces/workspaces.service");
let BrandsService = class BrandsService {
    prisma;
    workspaces;
    constructor(prisma, workspaces) {
        this.prisma = prisma;
        this.workspaces = workspaces;
    }
    async requireBrandRole(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user || (user.role.name !== client_1.RoleName.BRAND && user.role.name !== client_1.RoleName.AGENCY)) {
            throw new common_1.ForbiddenException('Only brand or agency accounts can manage brand profiles.');
        }
    }
    async upsertProfile(userId, dto) {
        await this.requireBrandRole(userId);
        const active = await this.workspaces.resolveActive(userId);
        if (!active) {
            return this.prisma.brandProfile.create({
                data: { userId, ...dto },
                include: { campaigns: true },
            });
        }
        return this.prisma.brandProfile.update({
            where: { id: active.id },
            data: dto,
            include: { campaigns: true },
        });
    }
    async getMyProfile(userId) {
        const active = await this.workspaces.resolveActive(userId);
        if (!active)
            return null;
        return this.prisma.brandProfile.findUnique({
            where: { id: active.id },
            include: {
                campaigns: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }
    async getPublicProfile(brandProfileId) {
        const profile = await this.prisma.brandProfile.findUnique({
            where: { id: brandProfileId },
            include: { user: { include: { profile: true } } },
        });
        if (!profile)
            throw new common_1.NotFoundException('Brand profile not found.');
        return profile;
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        workspaces_service_1.WorkspacesService])
], BrandsService);
//# sourceMappingURL=brands.service.js.map