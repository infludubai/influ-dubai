import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FraudAnalysis {
  riskScore: number;       // 0–100 (higher = riskier)
  riskLevel: RiskLevel;
  flags: string[];
  engagementAnomaly: number | null;
  followerAnomaly: number | null;
  summary: string;
  aiGenerated: boolean;
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);
  private readonly openai: OpenAI | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    this.openai = key ? new OpenAI({ apiKey: key }) : null;
    if (!this.openai) this.logger.warn('OPENAI_API_KEY not set — fraud detection runs in rule-based mode');
  }

  async analyzeCreator(creatorProfileId: string): Promise<FraudAnalysis> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      include: { socialAccounts: true },
    });
    if (!creator) throw new NotFoundException('Creator not found');

    // ── Rule-based signals ───────────────────────────────────────────
    const flags: string[] = [];
    let riskScore = 0;

    const accounts = creator.socialAccounts;

    // Signal 1: Very high engagement rate (>15% is suspicious for large accounts)
    for (const acc of accounts) {
      if (acc.engagementRate && acc.followersCount) {
        if (acc.followersCount > 50_000 && acc.engagementRate > 15) {
          flags.push(`Unusually high engagement rate (${acc.engagementRate.toFixed(1)}%) on ${acc.platform} for ${(acc.followersCount / 1000).toFixed(0)}K followers`);
          riskScore += 25;
        }
        // Signal 2: Engagement rate below 0.5% (ghost followers)
        if (acc.engagementRate < 0.5 && acc.followersCount > 5_000) {
          flags.push(`Very low engagement rate (${acc.engagementRate.toFixed(2)}%) on ${acc.platform} — possible ghost followers`);
          riskScore += 20;
        }
      }
    }

    // Signal 3: No social accounts linked
    if (accounts.length === 0) {
      flags.push('No social accounts linked — unable to verify audience');
      riskScore += 15;
    }

    // Signal 4: Inconsistent follower counts across platforms (>10x difference)
    if (accounts.length >= 2) {
      const counts = accounts.filter(a => a.followersCount).map(a => a.followersCount!);
      if (counts.length >= 2) {
        const max = Math.max(...counts);
        const min = Math.min(...counts);
        if (max / min > 15) {
          flags.push(`Large follower count disparity across platforms (${(min / 1000).toFixed(0)}K–${(max / 1000).toFixed(0)}K)`);
          riskScore += 15;
        }
      }
    }

    // Signal 5: No bio / incomplete profile
    if (!creator.bio || creator.bio.length < 20) {
      flags.push('Incomplete profile — very short or missing bio');
      riskScore += 5;
    }

    // Signal 6: Zero rate set (might be scraper or bot account)
    if (!creator.minRateUsd && !creator.maxRateUsd) {
      flags.push('No rate information provided');
      riskScore += 5;
    }

    // Compute anomaly scores (0–1)
    const avgEngagement = accounts.length
      ? accounts.reduce((s, a) => s + (a.engagementRate ?? 0), 0) / accounts.length
      : null;
    const engagementAnomaly = avgEngagement !== null
      ? Math.min(1, Math.max(0, avgEngagement > 15 ? (avgEngagement - 15) / 15 : avgEngagement < 0.5 ? (0.5 - avgEngagement) / 0.5 : 0))
      : null;
    const followerAnomaly = accounts.length >= 2
      ? Math.min(1, (Math.max(...accounts.map(a => a.followersCount ?? 0)) / Math.max(1, Math.min(...accounts.map(a => a.followersCount ?? 1))) - 1) / 15)
      : null;

    // Cap score
    riskScore = Math.min(100, riskScore);

    // ── AI enhancement (if key available) ───────────────────────────
    let summary = '';
    let aiGenerated = false;

    if (this.openai && accounts.length > 0) {
      try {
        const prompt = `You are an influencer fraud detection expert. Analyze this creator profile for authenticity risks.

Creator data:
- Bio: ${creator.bio ?? 'none'}
- Categories: ${creator.categories.join(', ') || 'none'}
- Social accounts: ${accounts.map(a => `${a.platform}: ${(a.followersCount ?? 0).toLocaleString()} followers, ${(a.engagementRate ?? 0).toFixed(2)}% engagement`).join(' | ')}
- Rule-based flags found: ${flags.join('; ') || 'none'}
- Current risk score: ${riskScore}/100

Provide a JSON response:
{
  "additionalFlags": ["string"],
  "adjustedScore": number,
  "summary": "2-3 sentence plain-English assessment of authenticity risks and any positive signals"
}`;

        const res = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
        });

        const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
        if (parsed.additionalFlags?.length) flags.push(...parsed.additionalFlags);
        if (typeof parsed.adjustedScore === 'number') riskScore = Math.min(100, Math.max(0, parsed.adjustedScore));
        summary = parsed.summary ?? '';
        aiGenerated = true;
      } catch (e) {
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

    const riskLevel: RiskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';

    // ── Persist result ───────────────────────────────────────────────
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

  async getCreatorFraudHistory(creatorProfileId: string) {
    return this.prisma.fraudReport.findMany({
      where: { creatorId: creatorProfileId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  // Admin: bulk scan — returns summary of all high-risk creators
  async scanAll() {
    const creators = await this.prisma.creatorProfile.findMany({
      include: { socialAccounts: true },
      take: 100,
    });

    const results: Array<{ creatorId: string } & FraudAnalysis> = [];
    for (const c of creators) {
      try {
        const r = await this.analyzeCreator(c.id);
        if (r.riskLevel !== 'LOW') results.push({ creatorId: c.id, ...r });
      } catch { /* skip */ }
    }
    return { scanned: creators.length, flagged: results.length, results };
  }

  // Platform-level stats for admin dashboard
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
}
