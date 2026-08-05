import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ShortlistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
  ) {}

  /** Shortlists belong to the workspace, so the whole team shares one. */
  private async brandProfile(userId: string) {
    const brand = await this.workspaces.resolveActive(userId);
    if (!brand) throw new ForbiddenException('Brand profile required');
    return brand;
  }

  async list(brandUserId: string) {
    const brand = await this.brandProfile(brandUserId);
    return this.prisma.shortlist.findMany({
      where: { brandProfileId: brand.id },
      include: {
        creatorProfile: {
          include: {
            socialAccounts: true,
            user: { select: { profile: { select: { displayName: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Saving an already-saved creator updates the note instead of failing. */
  async add(
    brandUserId: string,
    creatorProfileId: string,
    listName = 'Saved',
    note?: string,
  ) {
    const brand = await this.brandProfile(brandUserId);
    return this.prisma.shortlist.upsert({
      where: {
        brandProfileId_creatorProfileId: {
          brandProfileId: brand.id,
          creatorProfileId,
        },
      },
      create: { brandProfileId: brand.id, creatorProfileId, listName, note },
      update: { listName, note },
    });
  }

  async remove(brandUserId: string, creatorProfileId: string) {
    const brand = await this.brandProfile(brandUserId);
    await this.prisma.shortlist
      .delete({
        where: {
          brandProfileId_creatorProfileId: {
            brandProfileId: brand.id,
            creatorProfileId,
          },
        },
      })
      .catch(() => undefined); // already gone — removing twice is not an error
    return { removed: true };
  }

  /** Ids only — lets the marketplace render saved state without N queries. */
  async savedIds(brandUserId: string) {
    const brand = await this.workspaces.resolveActive(brandUserId);
    if (!brand) return [];
    const rows = await this.prisma.shortlist.findMany({
      where: { brandProfileId: brand.id },
      select: { creatorProfileId: true },
    });
    return rows.map((r) => r.creatorProfileId);
  }
}
