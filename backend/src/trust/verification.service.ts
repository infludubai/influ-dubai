import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  /** Creator asks to be verified, optionally attaching evidence. */
  async request(creatorUserId: string, evidenceUrl?: string, note?: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      include: { socialAccounts: true },
    });
    if (!creator) throw new ForbiddenException('Creator profile required');

    if (creator.verificationStatus === 'VERIFIED') {
      throw new BadRequestException('Your profile is already verified.');
    }
    if (creator.socialAccounts.length === 0) {
      throw new BadRequestException(
        'Link at least one social account before requesting verification.',
      );
    }

    const open = await this.prisma.verificationRequest.findFirst({
      where: { creatorProfileId: creator.id, status: 'PENDING' },
    });
    if (open) {
      throw new BadRequestException(
        'You already have a verification request under review.',
      );
    }

    const [request] = await this.prisma.$transaction([
      this.prisma.verificationRequest.create({
        data: { creatorProfileId: creator.id, evidenceUrl, note, status: 'PENDING' },
      }),
      this.prisma.creatorProfile.update({
        where: { id: creator.id },
        data: { verificationStatus: 'PENDING' },
      }),
    ]);

    return request;
  }

  async myStatus(creatorUserId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
      select: { id: true, verificationStatus: true },
    });
    if (!creator) return { status: 'UNVERIFIED', requests: [] };

    const requests = await this.prisma.verificationRequest.findMany({
      where: { creatorProfileId: creator.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return { status: creator.verificationStatus, requests };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listForAdmin(status = 'PENDING') {
    const where = status === 'ALL' ? {} : { status: status as never };
    return this.prisma.verificationRequest.findMany({
      where,
      include: {
        creatorProfile: {
          include: {
            socialAccounts: true,
            user: {
              select: {
                email: true,
                createdAt: true,
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async decide(
    adminUserId: string,
    requestId: string,
    decision: 'VERIFIED' | 'REJECTED',
    reason?: string,
  ) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { creatorProfile: { select: { id: true, userId: true } } },
    });
    if (!request) throw new NotFoundException('Verification request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been decided.');
    }
    if (decision === 'REJECTED' && !reason?.trim()) {
      throw new BadRequestException(
        'Give a reason so the creator knows what to fix before reapplying.',
      );
    }

    // Request record and profile flag must move together, otherwise the badge
    // and the queue disagree about whether the creator is verified.
    const [updated] = await this.prisma.$transaction([
      this.prisma.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          reviewedById: adminUserId,
          reviewedAt: new Date(),
          decisionReason: reason,
        },
      }),
      this.prisma.creatorProfile.update({
        where: { id: request.creatorProfile.id },
        data: { verificationStatus: decision },
      }),
    ]);

    this.audit.log({
      userId: adminUserId,
      action: `verification.${decision.toLowerCase()}`,
      resource: 'creator_profile',
      resourceId: request.creatorProfile.id,
      meta: { requestId, reason },
    });

    await this.notifications.create(request.creatorProfile.userId, {
      type: 'VERIFICATION',
      title: decision === 'VERIFIED' ? 'Your profile is verified' : 'Verification declined',
      body:
        decision === 'VERIFIED'
          ? 'The verified badge now shows on your profile and in the marketplace.'
          : (reason ?? 'Your verification request was declined.'),
      link: '/dashboard/creator/profile',
    });

    return updated;
  }

  async queueStats() {
    const grouped = await this.prisma.verificationRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  }
}
