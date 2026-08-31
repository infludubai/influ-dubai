"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MessagingService = class MessagingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateConversation(userId1, userId2) {
        const [p1, p2] = [userId1, userId2].sort();
        return this.prisma.conversation.upsert({
            where: { participant1_participant2: { participant1: p1, participant2: p2 } },
            create: { participant1: p1, participant2: p2 },
            update: {},
        });
    }
    async sendMessage(senderId, conversationId, content) {
        const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        if (conv.participant1 !== senderId && conv.participant2 !== senderId) {
            throw new common_1.NotFoundException('Not a participant');
        }
        const msg = await this.prisma.message.create({
            data: { conversationId, senderId, content },
        });
        await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        return msg;
    }
    async getMessages(userId, conversationId) {
        const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conv || (conv.participant1 !== userId && conv.participant2 !== userId)) {
            throw new common_1.NotFoundException('Conversation not found');
        }
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
    async listConversations(userId) {
        const convs = await this.prisma.conversation.findMany({
            where: { OR: [{ participant1: userId }, { participant2: userId }] },
            include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return Promise.all(convs.map(async (c) => {
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
                    brandProfiles: { select: { logoUrl: true }, take: 1 },
                },
            });
            return {
                ...c,
                unread,
                otherId,
                otherDisplayName: otherUser?.profile?.displayName ?? null,
                otherImageUrl: otherUser?.creatorProfile?.profileImageUrl ??
                    otherUser?.brandProfiles?.[0]?.logoUrl ??
                    null,
                otherRole: otherUser?.role?.name ?? null,
            };
        }));
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map