import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(user: {
        id: string;
    }): Promise<{
        id: string;
        link: string | null;
        createdAt: Date;
        userId: string;
        type: string;
        title: string;
        body: string;
        readAt: Date | null;
    }[]>;
    unreadCount(user: {
        id: string;
    }): Promise<number>;
    markRead(user: {
        id: string;
    }, id: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllRead(user: {
        id: string;
    }): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
