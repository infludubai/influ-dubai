import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

export type ReviewDirection = 'BRAND_TO_CREATOR' | 'CREATOR_TO_BRAND';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Reviews are only allowed between parties who actually completed work
   * together — an approved deliverable on the campaign is the proof. Without
   * that gate, ratings could be farmed by anyone with an account.
   */
  private async assertWorkedTogether(campaignId: string, creatorProfileId: string) {
    const approved = await this.prisma.deliverable.count({
      where: { campaignId, creatorProfileId, status: 'APPROVED' },
    });
    if (approved === 0) {
      throw new BadRequestException(
        'You can only leave a review after a deliverable on this campaign has been approved.',
      );
    }
  }

  async createFromBrand(
    brandUserId: string,
    campaignId: string,
    creatorProfileId: string,
    rating: number,
    comment?: string,
  ) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, brand: WorkspacesService.accessFilter(brandUserId) },
      include: { brand: { select: { id: true, companyName: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.assertWorkedTogether(campaignId, creatorProfileId);

    const creator = await this.prisma.creatorProfile.findUnique({
      where: { id: creatorProfileId },
      select: { userId: true },
    });
    if (!creator) throw new NotFoundException('Creator not found');

    const review = await this.prisma.review.upsert({
      where: {
        campaignId_direction_authorUserId: {
          campaignId,
          direction: 'BRAND_TO_CREATOR',
          authorUserId: brandUserId,
        },
      },
      create: {
        campaignId,
        creatorProfileId,
        brandProfileId: campaign.brand.id,
        direction: 'BRAND_TO_CREATOR',
        authorUserId: brandUserId,
        rating,
        comment,
      },
      update: { rating, comment },
    });

    await this.recomputeCreatorRating(creatorProfileId);

    await this.notifications.create(creator.userId, {
      type: 'REVIEW',
      title: `${campaign.brand.companyName} left you a ${rating}-star review`,
      body: comment ?? `For the campaign "${campaign.title}".`,
      link: '/dashboard/creator/profile',
    });

    return review;
  }

  async createFromCreator(
    creatorUserId: string,
    campaignId: string,
    rating: number,
    comment?: string,
  ) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      select: { id: true },
    });
    if (!creator) throw new ForbiddenException('Creator profile required');

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { brand: { select: { id: true, userId: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.assertWorkedTogether(campaignId, creator.id);

    const review = await this.prisma.review.upsert({
      where: {
        campaignId_direction_authorUserId: {
          campaignId,
          direction: 'CREATOR_TO_BRAND',
          authorUserId: creatorUserId,
        },
      },
      create: {
        campaignId,
        creatorProfileId: creator.id,
        brandProfileId: campaign.brand.id,
        direction: 'CREATOR_TO_BRAND',
        authorUserId: creatorUserId,
        rating,
        comment,
      },
      update: { rating, comment },
    });

    await this.recomputeBrandRating(campaign.brand.id);

    await this.notifications.create(campaign.brand.userId, {
      type: 'REVIEW',
      title: `A creator left you a ${rating}-star review`,
      body: comment ?? `For the campaign "${campaign.title}".`,
      link: '/dashboard/brand/profile',
    });

    return review;
  }

  private async recomputeCreatorRating(creatorProfileId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { creatorProfileId, direction: 'BRAND_TO_CREATOR' },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await this.prisma.creatorProfile.update({
      where: { id: creatorProfileId },
      data: {
        ratingAvg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
        ratingCount: agg._count._all,
      },
    });
  }

  private async recomputeBrandRating(brandProfileId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { brandProfileId, direction: 'CREATOR_TO_BRAND' },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await this.prisma.brandProfile.update({
      where: { id: brandProfileId },
      data: {
        ratingAvg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
        ratingCount: agg._count._all,
      },
    });
  }

  listForCreator(creatorProfileId: string) {
    return this.prisma.review.findMany({
      where: { creatorProfileId, direction: 'BRAND_TO_CREATOR' },
      include: {
        campaign: { select: { title: true } },
        brandProfile: { select: { companyName: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  listForBrand(brandProfileId: string) {
    return this.prisma.review.findMany({
      where: { brandProfileId, direction: 'CREATOR_TO_BRAND' },
      include: {
        campaign: { select: { title: true } },
        creatorProfile: {
          select: {
            id: true,
            profileImageUrl: true,
            user: { select: { profile: { select: { displayName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Campaigns where this user still owes a review — drives the prompt shown
   * after a collaboration wraps up.
   */
  async pendingForBrand(brandUserId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        brand: WorkspacesService.accessFilter(brandUserId),
        deliverables: { some: { status: 'APPROVED' } },
      },
      include: {
        deliverables: {
          where: { status: 'APPROVED' },
          select: {
            creatorProfileId: true,
            creatorProfile: {
              select: { user: { select: { profile: { select: { displayName: true } } } } },
            },
          },
        },
        reviews: { where: { direction: 'BRAND_TO_CREATOR', authorUserId: brandUserId } },
      },
      take: 20,
    });

    return campaigns
      .filter((c) => c.reviews.length === 0 && c.deliverables.length > 0)
      .map((c) => ({
        campaignId: c.id,
        campaignTitle: c.title,
        creatorProfileId: c.deliverables[0].creatorProfileId,
        creatorName:
          c.deliverables[0].creatorProfile.user?.profile?.displayName ?? 'Creator',
      }));
  }
}
