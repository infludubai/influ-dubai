import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBrandProfileDto } from './dto/upsert-brand-profile.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireBrandRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || (user.role.name !== RoleName.BRAND && user.role.name !== RoleName.AGENCY)) {
      throw new ForbiddenException('Only brand or agency accounts can manage brand profiles.');
    }
  }

  async upsertProfile(userId: string, dto: UpsertBrandProfileDto) {
    await this.requireBrandRole(userId);
    return this.prisma.brandProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
      include: { campaigns: true },
    });
  }

  async getMyProfile(userId: string) {
    return this.prisma.brandProfile.findUnique({
      where: { userId },
      include: {
        campaigns: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getPublicProfile(brandProfileId: string) {
    const profile = await this.prisma.brandProfile.findUnique({
      where: { id: brandProfileId },
      include: { user: { include: { profile: true } } },
    });
    if (!profile) throw new NotFoundException('Brand profile not found.');
    return profile;
  }
}
