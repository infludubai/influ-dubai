import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async invite(brandUserId: string, campaignId: string, dto: CreateInvitationDto) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, brand: { userId: brandUserId } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found or not yours');

    const creator = await this.prisma.creatorProfile.findUnique({ where: { id: dto.creatorId } });
    if (!creator) throw new NotFoundException('Creator not found');

    const inv = await this.prisma.campaignInvitation.upsert({
      where: { campaignId_creatorId: { campaignId, creatorId: dto.creatorId } },
      create: { campaignId, creatorId: dto.creatorId, message: dto.message },
      update: { status: 'PENDING', message: dto.message },
    });

    await this.notifications.create(creator.userId, {
      type: 'INVITATION',
      title: 'New campaign invitation',
      body: `You've been invited to "${campaign.title}"`,
      link: `/dashboard/creator/inbox`,
    });

    return inv;
  }

  async listForCampaign(brandUserId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, brand: { userId: brandUserId } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return this.prisma.campaignInvitation.findMany({
      where: { campaignId },
      include: { creator: { include: { user: { select: { profile: { select: { displayName: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForCreator(creatorUserId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) return [];
    return this.prisma.campaignInvitation.findMany({
      where: { creatorId: creator.id },
      include: { campaign: { include: { brand: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respond(creatorUserId: string, invitationId: string, status: 'ACCEPTED' | 'DECLINED') {
    const inv = await this.prisma.campaignInvitation.findUnique({
      where: { id: invitationId },
      include: { creator: true, campaign: { include: { brand: true } } },
    });
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.creator.userId !== creatorUserId) throw new ForbiddenException();

    const updated = await this.prisma.campaignInvitation.update({
      where: { id: invitationId },
      data: { status },
    });

    await this.notifications.create(inv.campaign.brand.userId, {
      type: 'INVITATION_RESPONSE',
      title: `Invitation ${status.toLowerCase()}`,
      body: `A creator has ${status.toLowerCase()} your invitation to "${inv.campaign.title}"`,
      link: `/dashboard/brand/campaigns/${inv.campaignId}`,
    });

    return updated;
  }
}
