import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCreatorProfileDto } from './dto/upsert-creator-profile.dto';
import { UpsertSocialAccountDto } from './dto/upsert-social-account.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
import { RoleName } from '@prisma/client';

@Injectable()
export class CreatorsService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireCreatorRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || user.role.name !== RoleName.CREATOR) {
      throw new ForbiddenException('Only creator accounts can manage creator profiles.');
    }
  }

  async upsertProfile(userId: string, dto: UpsertCreatorProfileDto) {
    await this.requireCreatorRole(userId);
    return this.prisma.creatorProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
      include: { socialAccounts: true, portfolioItems: true },
    });
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: { socialAccounts: true, portfolioItems: true },
    });
    return profile;
  }

  async getPublicProfile(creatorProfileId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      include: {
        user: { select: { profile: { select: { displayName: true, avatarUrl: true, country: true, city: true } } } },
        socialAccounts: true,
        portfolioItems: true,
      },
    });
    if (!profile) throw new NotFoundException('Creator profile not found.');
    return profile;
  }

  async listPublicProfiles(filters: {
    q?: string;
    category?: string;
    location?: string;
    language?: string;
    minFollowers?: number;
    maxFollowers?: number;
    minRate?: number;
    maxRate?: number;
    page?: number;
    limit?: number;
  }) {
    const { q, category, location, language, minFollowers, maxFollowers, minRate, maxRate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { verificationStatus: { not: 'REJECTED' } };
    if (category) where.categories = { has: category };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (language) where.languages = { has: language };
    if (minFollowers !== undefined) where.totalAudienceSize = { ...where.totalAudienceSize, gte: minFollowers };
    if (maxFollowers !== undefined) where.totalAudienceSize = { ...where.totalAudienceSize, lte: maxFollowers };
    if (minRate !== undefined) where.minRateUsd = { gte: minRate };
    if (maxRate !== undefined) where.maxRateUsd = { lte: maxRate };
    if (q) where.bio = { contains: q, mode: 'insensitive' };

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

  async upsertSocialAccount(userId: string, dto: UpsertSocialAccountDto) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Complete your creator profile first.');

    return this.prisma.socialAccount.upsert({
      where: { creatorId_platform: { creatorId: profile.id, platform: dto.platform } },
      create: { creatorId: profile.id, ...dto },
      update: { handle: dto.handle, followersCount: dto.followersCount, engagementRate: dto.engagementRate, profileUrl: dto.profileUrl },
    });
  }

  async deleteSocialAccount(userId: string, platform: string) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found.');

    const account = await this.prisma.socialAccount.findUnique({
      where: { creatorId_platform: { creatorId: profile.id, platform: platform as any } },
    });
    if (!account) throw new NotFoundException('Social account not found.');

    return this.prisma.socialAccount.delete({
      where: { id: account.id },
    });
  }

  async createPortfolioItem(userId: string, dto: CreatePortfolioItemDto, mediaUrl?: string) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Complete your creator profile first.');

    return this.prisma.portfolioItem.create({
      data: { creatorId: profile.id, ...dto, mediaUrl },
    });
  }

  async deletePortfolioItem(userId: string, itemId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found.');

    const item = await this.prisma.portfolioItem.findFirst({
      where: { id: itemId, creatorId: profile.id },
    });
    if (!item) throw new NotFoundException('Portfolio item not found.');

    return this.prisma.portfolioItem.delete({ where: { id: itemId } });
  }

  async updateProfileImage(userId: string, imageUrl: string) {
    return this.prisma.creatorProfile.upsert({
      where: { userId },
      create: { userId, profileImageUrl: imageUrl },
      update: { profileImageUrl: imageUrl },
    });
  }

  async updateMediaKit(userId: string, mediaKitUrl: string) {
    return this.prisma.creatorProfile.upsert({
      where: { userId },
      create: { userId, mediaKitUrl },
      update: { mediaKitUrl },
    });
  }

  completionScore(profile: any): number {
    if (!profile) return 0;
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
}
