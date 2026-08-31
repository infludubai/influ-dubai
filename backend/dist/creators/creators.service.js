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
exports.CreatorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const json_array_1 = require("../common/json-array");
let CreatorsService = class CreatorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async requireCreatorRole(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user || user.role.name !== client_1.RoleName.CREATOR) {
            throw new common_1.ForbiddenException('Only creator accounts can manage creator profiles.');
        }
    }
    async upsertProfile(userId, dto) {
        await this.requireCreatorRole(userId);
        return this.prisma.creatorProfile.upsert({
            where: { userId },
            create: { userId, ...dto },
            update: dto,
            include: { socialAccounts: true, portfolioItems: true },
        });
    }
    async getMyProfile(userId) {
        const profile = await this.prisma.creatorProfile.findUnique({
            where: { userId },
            include: { socialAccounts: true, portfolioItems: true },
        });
        return profile;
    }
    async getPublicProfile(creatorProfileId) {
        const profile = await this.prisma.creatorProfile.findUnique({
            where: { id: creatorProfileId },
            include: {
                user: { select: { profile: { select: { displayName: true, avatarUrl: true, country: true, city: true } } } },
                socialAccounts: true,
                portfolioItems: true,
            },
        });
        if (!profile)
            throw new common_1.NotFoundException('Creator profile not found.');
        return profile;
    }
    async listPublicProfiles(filters) {
        const { q, category, location, language, minFollowers, maxFollowers, minRate, maxRate, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const where = { verificationStatus: { not: 'REJECTED' } };
        if (category)
            where.categories = (0, json_array_1.listHas)(category);
        if (location)
            where.location = { contains: location };
        if (language)
            where.languages = (0, json_array_1.listHas)(language);
        if (minFollowers !== undefined)
            where.totalAudienceSize = { ...where.totalAudienceSize, gte: minFollowers };
        if (maxFollowers !== undefined)
            where.totalAudienceSize = { ...where.totalAudienceSize, lte: maxFollowers };
        if (minRate !== undefined)
            where.minRateUsd = { gte: minRate };
        if (maxRate !== undefined)
            where.maxRateUsd = { lte: maxRate };
        if (q)
            where.bio = { contains: q };
        const safeUserSelect = {
            profile: { select: { displayName: true, avatarUrl: true, country: true, city: true } },
        };
        const [items, total] = await Promise.all([
            this.prisma.creatorProfile.findMany({
                where,
                skip,
                take: limit,
                include: { user: { select: safeUserSelect }, socialAccounts: true },
                orderBy: { totalAudienceSize: 'desc' },
            }),
            this.prisma.creatorProfile.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async upsertSocialAccount(userId, dto) {
        const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Complete your creator profile first.');
        return this.prisma.socialAccount.upsert({
            where: { creatorId_platform: { creatorId: profile.id, platform: dto.platform } },
            create: { creatorId: profile.id, ...dto },
            update: { handle: dto.handle, followersCount: dto.followersCount, engagementRate: dto.engagementRate, profileUrl: dto.profileUrl },
        });
    }
    async deleteSocialAccount(userId, platform) {
        const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Creator profile not found.');
        const account = await this.prisma.socialAccount.findUnique({
            where: { creatorId_platform: { creatorId: profile.id, platform: platform } },
        });
        if (!account)
            throw new common_1.NotFoundException('Social account not found.');
        return this.prisma.socialAccount.delete({
            where: { id: account.id },
        });
    }
    async createPortfolioItem(userId, dto, mediaUrl) {
        const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Complete your creator profile first.');
        return this.prisma.portfolioItem.create({
            data: { creatorId: profile.id, ...dto, mediaUrl },
        });
    }
    async deletePortfolioItem(userId, itemId) {
        const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Creator profile not found.');
        const item = await this.prisma.portfolioItem.findFirst({
            where: { id: itemId, creatorId: profile.id },
        });
        if (!item)
            throw new common_1.NotFoundException('Portfolio item not found.');
        return this.prisma.portfolioItem.delete({ where: { id: itemId } });
    }
    async updateProfileImage(userId, imageUrl) {
        return this.prisma.creatorProfile.upsert({
            where: { userId },
            create: { userId, profileImageUrl: imageUrl },
            update: { profileImageUrl: imageUrl },
        });
    }
    async updateMediaKit(userId, mediaKitUrl) {
        return this.prisma.creatorProfile.upsert({
            where: { userId },
            create: { userId, mediaKitUrl },
            update: { mediaKitUrl },
        });
    }
    completionScore(profile) {
        if (!profile)
            return 0;
        const checks = [
            !!profile.bio,
            !!profile.location,
            profile.languages?.length > 0,
            profile.categories?.length > 0,
            profile.minRateUsd != null,
            profile.profileImageUrl != null,
            profile.socialAccounts?.length > 0,
            profile.portfolioItems?.length > 0,
        ];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }
};
exports.CreatorsService = CreatorsService;
exports.CreatorsService = CreatorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreatorsService);
//# sourceMappingURL=creators.service.js.map