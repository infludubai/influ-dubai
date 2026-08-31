import { MessagingService } from './messaging.service';
export declare class MessagingController {
    private readonly messaging;
    constructor(messaging: MessagingService);
    list(user: {
        id: string;
    }): Promise<{
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
    start(user: {
        id: string;
    }, otherId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        participant1: string;
        participant2: string;
    }>;
    messages(user: {
        id: string;
    }, id: string): Promise<{
        id: string;
        createdAt: Date;
        readAt: Date | null;
        senderId: string;
        content: string;
        conversationId: string;
    }[]>;
    send(user: {
        id: string;
    }, id: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        readAt: Date | null;
        senderId: string;
        content: string;
        conversationId: string;
    }>;
}
