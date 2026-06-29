import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT:     ['ACTIVE', 'CANCELLED'],
  ACTIVE:    ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED:    ['ACTIVE', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBrandProfile(userId: string) {
    const profile = await this.prisma.brandProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Complete your brand profile first.');
    return profile;
  }

  private async ownsCampaign(userId: string, campaignId: string) {
    const brand = await this.getBrandProfile(userId);
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found.');
    if (campaign.brandId !== brand.id) throw new ForbiddenException('Not your campaign.');
    return campaign;
  }

  async create(userId: string, dto: CreateCampaignDto) {
    const brand = await this.getBrandProfile(userId);
    return this.prisma.campaign.create({
      data: {
        brandId: brand.id,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        budgetUsd: dto.budgetUsd,
        targetAudience: dto.targetAudience,
        targetLocations: dto.targetLocations ?? [],
        targetCategories: dto.targetCategories ?? [],
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        requirements: dto.requirements,
      },
      include: { brand: true },
    });
  }

  async findAllForBrand(userId: string) {
    const brand = await this.getBrandProfile(userId);
    return this.prisma.campaign.findMany({
      where: { brandId: brand.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { brand: { include: { user: { include: { profile: true } } } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found.');
    return campaign;
  }

  async update(userId: string, campaignId: string, dto: UpdateCampaignDto) {
    const campaign = await this.ownsCampaign(userId, campaignId);

    if (dto.status && dto.status !== campaign.status) {
      const allowed = VALID_TRANSITIONS[campaign.status];
      if (!allowed.includes(dto.status)) {
        throw new ForbiddenException(
          `Cannot transition campaign from ${campaign.status} to ${dto.status}.`,
        );
      }
    }

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.budgetUsd !== undefined && { budgetUsd: dto.budgetUsd }),
        ...(dto.targetAudience !== undefined && { targetAudience: dto.targetAudience }),
        ...(dto.targetLocations && { targetLocations: dto.targetLocations }),
        ...(dto.targetCategories && { targetCategories: dto.targetCategories }),
        ...(dto.deadline && { deadline: new Date(dto.deadline) }),
        ...(dto.requirements !== undefined && { requirements: dto.requirements }),
        ...(dto.status && { status: dto.status }),
      },
      include: { brand: true },
    });
  }

  async remove(userId: string, campaignId: string) {
    await this.ownsCampaign(userId, campaignId);
    return this.prisma.campaign.delete({ where: { id: campaignId } });
  }

  async listPublic(filters: { type?: string; status?: string; page?: number; limit?: number }) {
    const { type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    const where: any = { status: 'ACTIVE' };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { brand: true },
      }),
      this.prisma.campaign.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}
