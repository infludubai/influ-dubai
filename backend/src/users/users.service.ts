import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.update({
      where: { userId },
      data: dto,
    });
    return profile;
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
