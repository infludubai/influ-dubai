import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async submit(creatorUserId: string, campaignId: string, dto: CreateProposalDto) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) throw new ForbiddenException('Creator profile required');

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { brand: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const proposal = await this.prisma.proposal.upsert({
      where: { campaignId_creatorId: { campaignId, creatorId: creator.id } },
      create: { campaignId, creatorId: creator.id, ...dto },
      update: { coverLetter: dto.coverLetter, proposedRate: dto.proposedRate, status: 'PENDING' },
    });

    await this.notifications.create(campaign.brand.userId, {
      type: 'PROPOSAL',
      title: 'New proposal received',
      body: `A creator submitted a proposal for "${campaign.title}"`,
      link: `/dashboard/brand/campaigns/${campaignId}/proposals`,
    });

    return proposal;
  }

  async listForCampaign(brandUserId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, brand: { userId: brandUserId } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return this.prisma.proposal.findMany({
      where: { campaignId },
      include: {
        creator: {
          include: {
            user: { select: { profile: { select: { displayName: true } } } },
            socialAccounts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMine(creatorUserId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId: creatorUserId } });
    if (!creator) return [];
    return this.prisma.proposal.findMany({
      where: { creatorId: creator.id },
      include: { campaign: { include: { brand: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respond(brandUserId: string, proposalId: string, status: 'ACCEPTED' | 'REJECTED') {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { campaign: { include: { brand: true } }, creator: true },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.campaign.brand.userId !== brandUserId) throw new ForbiddenException();

    const updated = await this.prisma.proposal.update({
      where: { id: proposalId },
      data: { status },
    });

    await this.notifications.create(proposal.creator.userId, {
      type: 'PROPOSAL_RESPONSE',
      title: `Proposal ${status.toLowerCase()}`,
      body: `Your proposal for "${proposal.campaign.title}" was ${status.toLowerCase()}`,
      link: `/dashboard/creator/inbox`,
    });

    return updated;
  }

  async withdraw(creatorUserId: string, proposalId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { creator: true },
    });
    if (!proposal) throw new NotFoundException();
    if (proposal.creator.userId !== creatorUserId) throw new ForbiddenException();
    return this.prisma.proposal.update({ where: { id: proposalId }, data: { status: 'WITHDRAWN' } });
  }
}
