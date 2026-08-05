import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBrandProfileDto } from './dto/upsert-brand-profile.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
  ) {}

  private async requireBrandRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || (user.role.name !== RoleName.BRAND && user.role.name !== RoleName.AGENCY)) {
      throw new ForbiddenException('Only brand or agency accounts can manage brand profiles.');
    }
  }

  /**
   * Edits the workspace the user is currently acting as, creating their first
   * one if they have none. Agencies add further client workspaces through
   * WorkspacesService rather than here.
   */
  async upsertProfile(userId: string, dto: UpsertBrandProfileDto) {
    await this.requireBrandRole(userId);
    const active = await this.workspaces.resolveActive(userId);

    if (!active) {
      return this.prisma.brandProfile.create({
        data: { userId, ...dto },
        include: { campaigns: true },
      });
    }

    return this.prisma.brandProfile.update({
      where: { id: active.id },
      data: dto,
      include: { campaigns: true },
    });
  }

  async getMyProfile(userId: string) {
    const active = await this.workspaces.resolveActive(userId);
    if (!active) return null;
    return this.prisma.brandProfile.findUnique({
      where: { id: active.id },
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
