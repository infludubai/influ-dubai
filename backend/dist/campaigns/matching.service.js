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
exports.MatchingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MatchingService = class MatchingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recommend(campaignId) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign)
            return [];
        const creators = await this.prisma.creatorProfile.findMany({
            where: { verificationStatus: { not: 'REJECTED' } },
            include: {
                socialAccounts: true,
                user: { select: { profile: { select: { displayName: true } } } },
            },
        });
        const scored = creators
            .map((c) => {
            const breakdown = this.score(campaign, c);
            const total = breakdown.categoryScore + breakdown.locationScore + breakdown.budgetScore + breakdown.audienceScore;
            return {
                creatorProfileId: c.id,
                displayName: c.user?.profile?.displayName ?? 'Creator',
                location: c.location,
                categories: c.categories,
                languages: c.languages,
                minRateUsd: c.minRateUsd,
                maxRateUsd: c.maxRateUsd,
                totalAudienceSize: c.totalAudienceSize,
                profileImageUrl: c.profileImageUrl,
                verificationStatus: c.verificationStatus,
                socialAccounts: c.socialAccounts,
                score: Math.round(total),
                scoreBreakdown: breakdown,
            };
        })
            .filter((c) => c.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);
        return scored;
    }
    score(campaign, creator) {
        const targetCats = campaign.targetCategories ?? [];
        const creatorCats = creator.categories ?? [];
        let categoryScore = 0;
        if (targetCats.length > 0 && creatorCats.length > 0) {
            const overlap = creatorCats.filter((c) => targetCats.includes(c)).length;
            categoryScore = Math.min(40, (overlap / targetCats.length) * 40);
        }
        else if (targetCats.length === 0) {
            categoryScore = 20;
        }
        const targetLocs = campaign.targetLocations ?? [];
        let locationScore = 0;
        if (creator.location && targetLocs.length > 0) {
            const locLower = creator.location.toLowerCase();
            const matches = targetLocs.some((l) => locLower.includes(l.toLowerCase()));
            locationScore = matches ? 20 : 0;
        }
        else if (targetLocs.length === 0) {
            locationScore = 10;
        }
        const estimatedPerCreator = campaign.budgetUsd / 5;
        const minRate = creator.minRateUsd ?? 0;
        const maxRate = creator.maxRateUsd ?? Infinity;
        let budgetScore = 0;
        if (estimatedPerCreator >= minRate && estimatedPerCreator <= maxRate) {
            budgetScore = 20;
        }
        else if (estimatedPerCreator >= minRate * 0.7) {
            budgetScore = 10;
        }
        else if (minRate === 0 && maxRate === Infinity) {
            budgetScore = 10;
        }
        const aud = creator.totalAudienceSize ?? 0;
        let audienceScore = 0;
        if (aud > 0) {
            audienceScore = Math.min(20, Math.max(0, (Math.log10(aud) - 2) * 5));
        }
        return {
            categoryScore: Math.round(categoryScore),
            locationScore: Math.round(locationScore),
            budgetScore: Math.round(budgetScore),
            audienceScore: Math.round(audienceScore),
        };
    }
};
exports.MatchingService = MatchingService;
exports.MatchingService = MatchingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MatchingService);
//# sourceMappingURL=matching.service.js.map