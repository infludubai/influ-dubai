import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.update({
      where: { userId },
      data: dto,
    });
    return profile;
  }

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        creatorProfile: { include: { socialAccounts: true, portfolioItems: true } },
        brandProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found.');
    this.audit.log({ userId, action: 'GDPR_EXPORT', resource: 'user', resourceId: userId });
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async deleteAccount(userId: string) {
    this.audit.log({ userId, action: 'GDPR_DELETE', resource: 'user', resourceId: userId });
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role.name,
      profile: user.profile,
      createdAt: user.createdAt,
    };
  }
}
