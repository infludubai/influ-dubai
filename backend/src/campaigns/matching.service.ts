import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MatchedCreator {
  creatorProfileId: string;
  displayName: string;
  location: string | null;
  categories: string[];
  languages: string[];
  minRateUsd: number | null;
  maxRateUsd: number | null;
  totalAudienceSize: number | null;
  profileImageUrl: string | null;
  verificationStatus: string;
  socialAccounts: any[];
  score: number;
  scoreBreakdown: {
    categoryScore: number;
    locationScore: number;
    budgetScore: number;
    audienceScore: number;
  };
}

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async recommend(campaignId: string): Promise<MatchedCreator[]> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) return [];

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
        } as MatchedCreator;
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return scored;
  }

  private score(campaign: any, creator: any) {
    // ── Category overlap (0–40 pts) ──────────────────────────────────────
    const targetCats: string[] = campaign.targetCategories ?? [];
    const creatorCats: string[] = creator.categories ?? [];
    let categoryScore = 0;
    if (targetCats.length > 0 && creatorCats.length > 0) {
      const overlap = creatorCats.filter((c) => targetCats.includes(c)).length;
      categoryScore = Math.min(40, (overlap / targetCats.length) * 40);
    } else if (targetCats.length === 0) {
      categoryScore = 20; // no preference — neutral
    }

    // ── Location match (0–20 pts) ────────────────────────────────────────
    const targetLocs: string[] = campaign.targetLocations ?? [];
    let locationScore = 0;
    if (creator.location && targetLocs.length > 0) {
      const locLower = creator.location.toLowerCase();
      const matches = targetLocs.some((l) => locLower.includes(l.toLowerCase()));
      locationScore = matches ? 20 : 0;
    } else if (targetLocs.length === 0) {
      locationScore = 10; // no preference — neutral
    }

    // ── Budget fit (0–20 pts) ────────────────────────────────────────────
    // campaign budget per creator estimated as budget / 5 (assume 5 creators)
    const estimatedPerCreator = campaign.budgetUsd / 5;
    const minRate = creator.minRateUsd ?? 0;
    const maxRate = creator.maxRateUsd ?? Infinity;
    let budgetScore = 0;
    if (estimatedPerCreator >= minRate && estimatedPerCreator <= maxRate) {
      budgetScore = 20; // perfect fit
    } else if (estimatedPerCreator >= minRate * 0.7) {
      budgetScore = 10; // within 30% below max
    } else if (minRate === 0 && maxRate === Infinity) {
      budgetScore = 10; // rate not set — partial credit
    }

    // ── Audience size (0–20 pts, log scale) ─────────────────────────────
    const aud = creator.totalAudienceSize ?? 0;
    let audienceScore = 0;
    if (aud > 0) {
      // log10(1000)=3 → 5pts, log10(10000)=4 → 10pts, log10(100000)=5 → 15pts, log10(1M)=6 → 20pts
      audienceScore = Math.min(20, Math.max(0, (Math.log10(aud) - 2) * 5));
    }

    return {
      categoryScore: Math.round(categoryScore),
      locationScore: Math.round(locationScore),
      budgetScore:   Math.round(budgetScore),
      audienceScore: Math.round(audienceScore),
    };
  }
}
