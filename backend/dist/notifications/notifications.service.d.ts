import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, data: {
        type: string;
        title: string;
        body: string;
        link?: string;
    }): Promise<{
        id: string;
        link: string | null;
        createdAt: Date;
        userId: string;
        type: string;
        title: string;
        body: string;
        readAt: Date | null;
    }>;
    list(userId: string): Promise<{
        id: string;
        link: string | null;
        createdAt: Date;
        userId: string;
        type: string;
        title: string;
        body: string;
        readAt: Date | null;
    }[]>;
    markRead(userId: string, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    unreadCount(userId: string): Promise<number>;
}
