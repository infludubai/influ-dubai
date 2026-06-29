import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatorInsight {
  qualityScore: number;          // 0–100
  audienceSummary: string;
  strengths: string[];
  contentSuggestions: string[];
  estimatedReach: string;
  bestPlatform: string | null;
  aiGenerated: boolean;
}

export interface CampaignPrediction {
  estimatedReach: number;
  estimatedEngagement: number;
  estimatedConversions: number;
  estimatedCPE: number;        // cost per engagement in USD
  estimatedROI: number;        // % return on investment
  confidence: number;          // 0–100 confidence level
  matchingCreators: number;
  historicalSampleSize: number;
  narrative: string;
  tips?: string[];
  aiGenerated: boolean;
}

export interface CampaignSuggestion {
  creatorProfileId: string;
  displayName: string;
  reason: string;
  fitScore: number;             // 0–100
  suggestedRate: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI | null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    this.openai = key ? new OpenAI({ apiKey: key }) : null;
    if (!this.openai) this.logger.warn('OPENAI_API_KEY not set — AI endpoints will return mock data');
  }

  // ── Creator analysis ────────────────────────────────────────────────────

  async analyzeCreator(creatorProfileId: string): Promise<CreatorInsight> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      include: {
        socialAccounts: true,
        portfolioItems: true,
        user: { select: { profile: { select: { displayName: true } } } },
      },
    });
    if (!creator) throw new NotFoundException('Creator not found');

    const topPlatform = creator.socialAccounts.sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0))[0];
    const totalAudience = creator.totalAudienceSize ?? creator.socialAccounts.reduce((s, a) => s + (a.followersCount ?? 0), 0);

    if (!this.openai) return this.mockCreatorInsight(creator, topPlatform, totalAudience);

    const prompt = `You are an influencer marketing analyst. Analyze this creator profile and return a JSON object.

Creator profile:
- Name: ${creator.user?.profile?.displayName ?? 'Unknown'}
- Bio: ${creator.bio ?? 'Not provided'}
- Location: ${creator.location ?? 'Unknown'}
- Categories: ${creator.categories.join(', ') || 'None'}
- Languages: ${creator.languages.join(', ') || 'None'}
- Total audience: ${totalAudience.toLocaleString()}
- Rate range: $${creator.minRateUsd ?? 0} – $${creator.maxRateUsd ?? 'open'}
- Social accounts: ${creator.socialAccounts.map(a => `${a.platform}(${a.followersCount ?? 0} followers, ${a.engagementRate ?? 0}% engagement)`).join(', ') || 'None'}
- Portfolio items: ${creator.portfolioItems.length}

Return ONLY valid JSON with this exact shape:
{
  "qualityScore": <integer 0-100>,
  "audienceSummary": "<2 sentences describing the audience>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "contentSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "estimatedReach": "<e.g. 50K–120K per post>",
  "bestPlatform": "<platform name or null>"
}`;

    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });
      const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
      return { ...parsed, aiGenerated: true };
    } catch (err) {
      this.logger.error('OpenAI creator analysis failed', err);
      return this.mockCreatorInsight(creator, topPlatform, totalAudience);
    }
  }

  private mockCreatorInsight(creator: any, topPlatform: any, totalAudience: number): CreatorInsight {
    const cats = creator.categories ?? [];
    const base = Math.min(100, 30 + cats.length * 8 + (creator.socialAccounts?.length ?? 0) * 10 + (creator.bio ? 10 : 0) + (creator.location ? 5 : 0));
    return {
      qualityScore: base,
      audienceSummary: `This creator focuses on ${cats.join(' and ') || 'general content'} and is based in ${creator.location ?? 'an unknown location'}. Their audience spans ${totalAudience.toLocaleString()} followers across platforms.`,
      strengths: [
        cats.length > 0 ? `Strong niche presence in ${cats[0]}` : 'Broad content appeal',
        creator.socialAccounts?.length > 1 ? 'Multi-platform presence' : 'Focused platform strategy',
        creator.bio ? 'Clear personal brand' : 'Growth potential',
      ],
      contentSuggestions: [
        `Create ${cats[0] ?? 'niche'}-focused short-form video content`,
        'Collaborate with complementary UAE/MENA creators',
        'Post consistently during peak Gulf engagement hours (7–9 PM GST)',
      ],
      estimatedReach: totalAudience > 0 ? `${Math.round(totalAudience * 0.08).toLocaleString()}–${Math.round(totalAudience * 0.15).toLocaleString()} per post` : 'Insufficient data',
      bestPlatform: topPlatform?.platform ?? null,
      aiGenerated: false,
    };
  }

  // ── Campaign performance predictor ──────────────────────────────────────

  async predictCampaign(campaignId: string): Promise<CampaignPrediction> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        brand: true,
        metrics: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Pull historical averages from completed campaigns in the same type
    const historical = await this.prisma.campaignMetric.findMany({
      where: {
        campaign: {
          type: campaign.type,
          status: 'COMPLETED',
          budgetUsd: { gte: campaign.budgetUsd * 0.5, lte: campaign.budgetUsd * 2 },
        },
      },
      take: 20,
    });

    // Count creators available in target categories
    const matchingCreators = await this.prisma.creatorProfile.count({
      where: campaign.targetCategories.length
        ? { categories: { hasSome: campaign.targetCategories } }
        : {},
    });

    // Rule-based prediction ─────────────────────────────────────
    const budget = campaign.budgetUsd;
    const typeMultiplier: Record<string, number> = {
      AWARENESS: 1.4, ENGAGEMENT: 1.0, LEAD_GEN: 0.7, SALES: 0.6,
    };
    const mult = typeMultiplier[campaign.type] ?? 1.0;

    let baseReach = 0, baseEngagement = 0, baseConversions = 0, baseCpe = 0, baseRoi = 0;

    if (historical.length >= 3) {
      const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
      baseReach       = Math.round(avg(historical.map(m => m.reach)) * mult);
      baseEngagement  = Math.round(avg(historical.map(m => m.engagement)) * mult);
      baseConversions = Math.round(avg(historical.map(m => m.conversions)) * mult);
      baseCpe         = baseEngagement > 0 ? +(budget / baseEngagement).toFixed(2) : 0;
      baseRoi         = +(((baseConversions * 50 - budget) / budget) * 100).toFixed(1);
    } else {
      // Fallback: budget-based heuristics for UAE/MENA market
      baseReach       = Math.round(budget * 4 * mult);
      baseEngagement  = Math.round(baseReach * 0.035);
      baseConversions = Math.round(baseEngagement * 0.025);
      baseCpe         = baseEngagement > 0 ? +(budget / baseEngagement).toFixed(2) : 0;
      baseRoi         = +(((baseConversions * 50 - budget) / budget) * 100).toFixed(1);
    }

    // Confidence: higher when more historical data and matching creators
    const confidence = Math.min(95, 40 + historical.length * 2.5 + Math.min(matchingCreators, 10) * 3);

    const result: CampaignPrediction = {
      estimatedReach: baseReach,
      estimatedEngagement: baseEngagement,
      estimatedConversions: baseConversions,
      estimatedCPE: baseCpe,
      estimatedROI: baseRoi,
      confidence: Math.round(confidence),
      matchingCreators,
      historicalSampleSize: historical.length,
      narrative: '',
      aiGenerated: false,
    };

    if (this.openai) {
      try {
        const prompt = `You are an influencer marketing performance analyst specializing in UAE and MENA markets.

Campaign details:
- Title: ${campaign.title}
- Type: ${campaign.type}
- Budget: $${budget.toLocaleString()} USD
- Target categories: ${campaign.targetCategories.join(', ') || 'General'}
- Target locations: ${campaign.targetLocations.join(', ') || 'UAE/MENA'}
- Matching creators on platform: ${matchingCreators}
- Historical data points: ${historical.length}

Rule-based predictions:
- Estimated reach: ${baseReach.toLocaleString()}
- Estimated engagement: ${baseEngagement.toLocaleString()}
- Estimated conversions: ${baseConversions.toLocaleString()}
- Estimated CPE: $${baseCpe}
- Estimated ROI: ${baseRoi}%
- Confidence: ${Math.round(confidence)}%

Return ONLY valid JSON:
{
  "narrative": "<2-3 sentence plain-English assessment of expected performance, key drivers, and one risk factor specific to this campaign>",
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"]
}`;

        const res = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 400,
        });
        const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
        result.narrative = parsed.narrative ?? '';
        result.tips = parsed.tips ?? [];
        result.aiGenerated = true;
      } catch (err) {
        this.logger.warn('OpenAI campaign prediction narrative failed, using rule-based', err);
      }
    }

    if (!result.narrative) {
      result.narrative = baseRoi > 50
        ? `This ${campaign.type.toLowerCase()} campaign is projected to deliver strong returns at ${baseRoi}% ROI with ${baseReach.toLocaleString()} estimated reach. ${matchingCreators} matching creators are available on the platform, giving you good selection depth.`
        : `This ${campaign.type.toLowerCase()} campaign is projected to reach ${baseReach.toLocaleString()} people with ${baseEngagement.toLocaleString()} engagements. ${historical.length < 3 ? 'Projections are based on market benchmarks as historical data for this campaign type is limited.' : 'Based on similar past campaigns.'}`;
      result.tips = [
        `Activate during peak Gulf engagement hours (7–10 PM GST) for up to 30% more reach`,
        `Target creators with 2–5% engagement rate for optimal CPE at your $${budget.toLocaleString()} budget`,
        campaign.targetCategories.length
          ? `Your ${campaign.targetCategories[0]} niche has strong brand affinity in UAE — lean into authentic storytelling`
          : `Define target categories to improve creator matching and prediction accuracy`,
      ];
    }

    return result;
  }

  // ── Campaign creator suggestions ─────────────────────────────────────────

  async suggestCreators(campaignId: string): Promise<CampaignSuggestion[]> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const creators = await this.prisma.creatorProfile.findMany({
      where: { verificationStatus: { not: 'REJECTED' } },
      include: {
        socialAccounts: true,
        user: { select: { profile: { select: { displayName: true } } } },
      },
      take: 30,
    });

    if (!this.openai) return this.mockCampaignSuggestions(campaign, creators);

    const creatorList = creators.map((c, i) =>
      `${i + 1}. id=${c.id} name="${c.user?.profile?.displayName ?? 'Creator'}" cats=[${c.categories.join(',')}] loc="${c.location ?? ''}" audience=${c.totalAudienceSize ?? 0} rate=$${c.minRateUsd ?? 0}-$${c.maxRateUsd ?? 0}`
    ).join('\n');

    const prompt = `You are an influencer marketing strategist for UAE/MENA.

Campaign details:
- Title: ${campaign.title}
- Type: ${campaign.type}
- Budget: $${campaign.budgetUsd}
- Target categories: ${campaign.targetCategories.join(', ') || 'Any'}
- Target locations: ${campaign.targetLocations.join(', ') || 'Any'}
- Description: ${campaign.description ?? 'None'}

Available creators:
${creatorList}

Select the TOP 5 best-fit creators and return ONLY valid JSON:
{
  "suggestions": [
    {
      "creatorProfileId": "<id>",
      "displayName": "<name>",
      "reason": "<1–2 sentence explanation of why this creator fits>",
      "fitScore": <integer 0-100>,
      "suggestedRate": "<e.g. $500–$1,200>"
    }
  ]
}`;

    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });
      const parsed = JSON.parse(res.choices[0].message.content ?? '{}');
      return parsed.suggestions ?? [];
    } catch (err) {
      this.logger.error('OpenAI campaign suggestions failed', err);
      return this.mockCampaignSuggestions(campaign, creators);
    }
  }

  private mockCampaignSuggestions(campaign: any, creators: any[]): CampaignSuggestion[] {
    return creators
      .map((c) => {
        const catMatch = (c.categories ?? []).filter((cat: string) => campaign.targetCategories.includes(cat)).length;
        const locMatch = campaign.targetLocations.some((l: string) => (c.location ?? '').toLowerCase().includes(l.toLowerCase()));
        const fit = Math.min(100, catMatch * 25 + (locMatch ? 20 : 0) + 20);
        return {
          creatorProfileId: c.id,
          displayName: c.user?.profile?.displayName ?? 'Creator',
          reason: `Matches ${catMatch} campaign ${catMatch === 1 ? 'category' : 'categories'}${locMatch ? ' and is in the target location' : ''}.`,
          fitScore: fit,
          suggestedRate: c.minRateUsd ? `$${c.minRateUsd}–$${c.maxRateUsd ?? c.minRateUsd * 2}` : 'Negotiable',
        };
      })
      .filter((s) => s.fitScore > 0)
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 5);
  }
}
