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
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
let VerificationService = class VerificationService {
    prisma;
    notifications;
    audit;
    constructor(prisma, notifications, audit) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.audit = audit;
    }
    async request(creatorUserId, evidenceUrl, note) {
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { userId: creatorUserId },
            include: { socialAccounts: true },
        });
        if (!creator)
            throw new common_1.ForbiddenException('Creator profile required');
        if (creator.verificationStatus === 'VERIFIED') {
            throw new common_1.BadRequestException('Your profile is already verified.');
        }
        if (creator.socialAccounts.length === 0) {
            throw new common_1.BadRequestException('Link at least one social account before requesting verification.');
        }
        const open = await this.prisma.verificationRequest.findFirst({
            where: { creatorProfileId: creator.id, status: 'PENDING' },
        });
        if (open) {
            throw new common_1.BadRequestException('You already have a verification request under review.');
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
    async myStatus(creatorUserId) {
        const creator = await this.prisma.creatorProfile.findUnique({
            where: { userId: creatorUserId },
            select: { id: true, verificationStatus: true },
        });
        if (!creator)
            return { status: 'UNVERIFIED', requests: [] };
        const requests = await this.prisma.verificationRequest.findMany({
            where: { creatorProfileId: creator.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        return { status: creator.verificationStatus, requests };
    }
    async listForAdmin(status = 'PENDING') {
        const where = status === 'ALL' ? {} : { status: status };
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
    async decide(adminUserId, requestId, decision, reason) {
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId },
            include: { creatorProfile: { select: { id: true, userId: true } } },
        });
        if (!request)
            throw new common_1.NotFoundException('Verification request not found');
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException('This request has already been decided.');
        }
        if (decision === 'REJECTED' && !reason?.trim()) {
            throw new common_1.BadRequestException('Give a reason so the creator knows what to fix before reapplying.');
        }
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
            body: decision === 'VERIFIED'
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
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map