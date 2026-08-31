import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(data: {
        userId?: string;
        action: string;
        resource: string;
        resourceId?: string;
        meta?: object;
        ip?: string;
    }): void;
    getLogs(filters?: {
        userId?: string;
        resource?: string;
        page?: number;
        limit?: number;
    }): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        meta: import("@prisma/client/runtime/library").JsonValue | null;
        ip: string | null;
    }[]>;
}
