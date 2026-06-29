import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(userId1: string, userId2: string) {
    const [p1, p2] = [userId1, userId2].sort();
    return this.prisma.conversation.upsert({
      where: { participant1_participant2: { participant1: p1, participant2: p2 } },
      create: { participant1: p1, participant2: p2 },
      update: {},
    });
  }

  async sendMessage(senderId: string, conversationId: string, content: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.participant1 !== senderId && conv.participant2 !== senderId) {
      throw new NotFoundException('Not a participant');
    }
    const msg = await this.prisma.message.create({
      data: { conversationId, senderId, content },
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return msg;
  }

  async getMessages(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || (conv.participant1 !== userId && conv.participant2 !== userId)) {
      throw new NotFoundException('Conversation not found');
    }
    // mark incoming as read
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async listConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ participant1: userId }, { participant2: userId }] },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      convs.map(async (c) => {
        const unread = await this.prisma.message.count({
          where: { conversationId: c.id, senderId: { not: userId }, readAt: null },
        });
        const otherId = c.participant1 === userId ? c.participant2 : c.participant1;
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherId },
          select: {
            profile: { select: { displayName: true } },
            role: { select: { name: true } },
            creatorProfile: { select: { profileImageUrl: true } },
            brandProfile: { select: { logoUrl: true } },
          },
        });
        return {
          ...c,
          unread,
          otherId,
          otherDisplayName: otherUser?.profile?.displayName ?? null,
          otherImageUrl: otherUser?.creatorProfile?.profileImageUrl ?? otherUser?.brandProfile?.logoUrl ?? null,
          otherRole: otherUser?.role?.name ?? null,
        };
      }),
    );
  }
}
