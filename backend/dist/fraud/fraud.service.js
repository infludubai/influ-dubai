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
var FraudService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const json_array_1 = require("../common/json-array");
const settings_service_1 = require("../settings/settings.service");
let FraudService = FraudService_1 = class FraudService {
    prisma;
    settings;
    logger = new common_1.Logger(FraudService_1.name);
    client = null;
    clientKey = '';
    constructor(prisma, settings) {
        this.prisma = prisma;
        this.settings = settings;
    }
    get openai() {
        const key = this.settings.get('OPENAI_API_KEY');
        if (!key) {
            this.client = null;
            this.clientKey = '';
            return null;
        }
        if (!this.client || this.clientKey !== key) {
            const OpenAI = require('openai');
            this.client = new OpenAI({ apiKey: key });
            this.clientKey = key;
        }
        return this.client;
    }
    async analyzeCreator(creatorProfileId) {
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { id: creatorProfileId },
            include: { socialAccounts: true },
        });
        if (!creator)
            throw new common_1.NotFoundException('Creator not found');
        const flags = [];
        let riskScore = 0;
        const accounts = creator.socialAccounts;
        for (const acc of accounts) {
            if (acc.engagementRate && acc.followersCount) {
                if (acc.followersCount > 50_000 && acc.engagementRate > 15) {
                    flags.push(`Unusually high engagement rate (${acc.engagementRate.toFixed(1)}%) on ${acc.platform} for ${(acc.followersCount / 1000).toFixed(0)}K followers`);
                    riskScore += 25;
                }
                if (acc.engagementRate < 0.5 && acc.followersCount > 5_000) {
                    flags.push(`Very low engagement rate (${acc.engagementRate.toFixed(2)}%) on ${acc.platform} — possible ghost followers`);
                    riskScore += 20;
                }
            }
        }
        if (accounts.length === 0) {
            flags.push('No social accounts linked — unable to verify audience');
            riskScore += 15;
        }
        if (accounts.length >= 2) {
            const counts = accounts.filter(a => a.followersCount).map(a => a.followersCount);
            if (counts.length >= 2) {
                const max = Math.max(...counts);
                const min = Math.min(...counts);
                if (max / min > 15) {
                    flags.push(`Large follower count disparity across platforms (${(min / 1000).toFixed(0)}K–${(max / 1000).toFixed(0)}K)`);
                    riskScore += 15;
                }
            }
        }
        if (!creator.bio || creator.bio.length < 20) {
            flags.push('Incomplete profile — very short or missing bio');
            riskScore += 5;
        }
        if (!creator.minRateUsd && !creator.maxRateUsd) {
            flags.push('No rate information provided');
            riskScore += 5;
        }
        const avgEngagement = accounts.length
            ? accounts.reduce((s, a) => s + (a.engagementRate ?? 0), 0) / accounts.length
            : null;
        const engagementAnomaly = avgEngagement !== null
            ? Math.min(1, Math.max(0, avgEngagement > 15 ? (avgEngagement - 15) / 15 : avgEngagement < 0.5 ? (0.5 - avgEngagement) / 0.5 : 0))
            : null;
        const followerAnomaly = accounts.length >= 2
            ? Math.min(1, (Math.max(...accounts.map(a => a.followersCount ?? 0)) / Math.max(1, Math.min(...accounts.map(a => a.followersCount ?? 1))) - 1) / 15)
            : null;
        riskScore = Math.min(100, riskScore);
        let summary = '';
        let aiGenerated = false;
        const openai = this.openai;
        if (openai && accounts.length > 0) {
            try {
                const prompt = `You are an influencer fraud detection expert. Analyze this creator profile for authenticity risks.

Creator data:
- Bio: ${creator.bio ?? 'none'}
- Categories: ${(0, json_array_1.toStringList)(creator.categories).join(', ') || 'none'}
- Social accounts: ${accounts.map(a => `${a.platform}: ${(a.followersCount ?? 0).toLocaleString()} followers, ${(a.engagementRate ?? 0).toFixed(2)}% engagement`).join(' | ')}
- Rule-based flags found: ${flags.join('; ') || 'none'}
- Current risk score: ${riskScore}/100

Provide a JSON response:
{
  "additionalFlags": ["string"],
  "adjustedScore": number,
  "summary": "2-3 sentence plain-English assessment of authenticity risks and any positive signals"
}`;
                const res = await openai.chat.completions.create({
                    model: this.settings.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
                    response_format: { type: 'json_object' },
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 400,
                });
                const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
                if (parsed.additionalFlags?.length)
                    flags.push(...parsed.additionalFlags);
                if (typeof parsed.adjustedScore === 'number')
                    riskScore = Math.min(100, Math.max(0, parsed.adjustedScore));
                summary = parsed.summary ?? '';
                aiGenerated = true;
            }
            catch (e) {
                this.logger.warn('AI fraud analysis failed, using rule-based only', e);
            }
        }
        if (!summary) {
            summary = riskScore >= 60
                ? `High risk detected (${riskScore}/100). Multiple suspicious signals found. Manual review recommended before campaign engagement.`
                : riskScore >= 30
                    ? `Moderate risk (${riskScore}/100). Some anomalies detected. Proceed with caution and verify audience authenticity.`
                    : `Low risk (${riskScore}/100). Profile appears authentic. ${flags.length ? 'Minor flags noted.' : 'No significant red flags detected.'}`;
        }
        const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';
        await this.prisma.creatorProfile.update({
            where: { id: creatorProfileId },
            data: {
                fraudRiskScore: riskScore,
                fraudRiskLevel: riskLevel,
                fraudFlags: flags,
                fraudAnalyzedAt: new Date(),
            },
        });
        await this.prisma.fraudReport.create({
            data: {
                creatorId: creatorProfileId,
                riskScore,
                riskLevel,
                flags,
                engagementAnom: engagementAnomaly,
                followerAnom: followerAnomaly,
                summary,
            },
        });
        return { riskScore, riskLevel, flags, engagementAnomaly, followerAnomaly, summary, aiGenerated };
    }
    async getCreatorFraudHistory(creatorProfileId) {
        return this.prisma.fraudReport.findMany({
            where: { creatorId: creatorProfileId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    }
    async scanAll() {
        const creators = await this.prisma.creatorProfile.findMany({
            include: { socialAccounts: true },
            take: 100,
        });
        const results = [];
        for (const c of creators) {
            try {
                const r = await this.analyzeCreator(c.id);
                if (r.riskLevel !== 'LOW')
                    results.push({ creatorId: c.id, ...r });
            }
            catch { }
        }
        return { scanned: creators.length, flagged: results.length, results };
    }
    async getFraudStats() {
        const [total, high, medium, low] = await Promise.all([
            this.prisma.creatorProfile.count({ where: { fraudRiskScore: { not: null } } }),
            this.prisma.creatorProfile.count({ where: { fraudRiskLevel: 'HIGH' } }),
            this.prisma.creatorProfile.count({ where: { fraudRiskLevel: 'MEDIUM' } }),
            this.prisma.creatorProfile.count({ where: { fraudRiskLevel: 'LOW' } }),
        ]);
        const recentReports = await this.prisma.fraudReport.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { creator: { select: { id: true, location: true, categories: true } } },
        });
        return { analyzed: total, high, medium, low, recentReports };
    }
};
exports.FraudService = FraudService;
exports.FraudService = FraudService = FraudService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], FraudService);
//# sourceMappingURL=fraud.service.js.map