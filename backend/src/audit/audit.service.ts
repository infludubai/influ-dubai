import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(data: { userId?: string; action: string; resource: string; resourceId?: string; meta?: object; ip?: string }) {
    // Fire-and-forget — don't block request
    this.prisma.auditLog.create({ data }).catch(() => {});
  }

  getLogs(filters?: { userId?: string; resource?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.resource) where.resource = filters.resource;
    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
