import { PrismaService } from '../prisma/prisma.service';
export declare class MessagingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOrCreateConversation(userId1: string, userId2: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participant1: string;
        participant2: string;
    }>;
    sendMessage(senderId: string, conversationId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        readAt: Date | null;
        senderId: string;
        content: string;
        conversationId: string;
    }>;
    getMessages(userId: string, conversationId: string): Promise<{
        id: string;
        createdAt: Date;
        readAt: Date | null;
        senderId: string;
        content: string;
        conversationId: string;
    }[]>;
    listConversations(userId: string): Promise<{
        unread: number;
        otherId: string;
        otherDisplayName: string | null;
        otherImageUrl: string | null;
        otherRole: import("@prisma/client").$Enums.RoleName | null;
        messages: {
            id: string;
            createdAt: Date;
            readAt: Date | null;
            senderId: string;
            content: string;
            conversationId: string;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participant1: string;
        participant2: string;
    }[]>;
}
