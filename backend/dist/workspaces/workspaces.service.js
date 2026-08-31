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
var WorkspacesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const mail_service_1 = require("../mail/mail.service");
const settings_service_1 = require("../settings/settings.service");
const ROLE_RANK = {
    VIEWER: 0,
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
};
const PLAN_SEATS = {
    FREE: 1,
    PROFESSIONAL: 5,
    ENTERPRISE: -1,
};
let WorkspacesService = WorkspacesService_1 = class WorkspacesService {
    prisma;
    notifications;
    mail;
    settings;
    constructor(prisma, notifications, mail, settings) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.mail = mail;
        this.settings = settings;
    }
    static accessFilter(userId) {
        return {
            OR: [
                { userId },
                { members: { some: { userId, status: 'ACTIVE' } } },
            ],
        };
    }
    async resolveActive(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { activeBrandProfileId: true },
        });
        if (user?.activeBrandProfileId) {
            const active = await this.prisma.brandProfile.findFirst({
                where: {
                    id: user.activeBrandProfileId,
                    ...WorkspacesService_1.accessFilter(userId),
                },
            });
            if (active)
                return active;
        }
        return this.prisma.brandProfile.findFirst({
            where: WorkspacesService_1.accessFilter(userId),
            orderBy: { createdAt: 'asc' },
        });
    }
    async requireActive(userId) {
        const active = await this.resolveActive(userId);
        if (!active)
            throw new common_1.ForbiddenException('Brand profile required');
        return active;
    }
    async assertAccess(userId, brandProfileId, minRole = 'VIEWER') {
        const brand = await this.prisma.brandProfile.findUnique({
            where: { id: brandProfileId },
            include: { members: { where: { userId } } },
        });
        if (!brand)
            throw new common_1.NotFoundException('Workspace not found');
        const role = brand.userId === userId ? 'OWNER' : (brand.members[0]?.status === 'ACTIVE'
            ? brand.members[0].role
            : null);
        if (!role)
            throw new common_1.ForbiddenException('You do not have access to this workspace');
        if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
            throw new common_1.ForbiddenException(`This action requires the ${minRole.toLowerCase()} role or higher.`);
        }
        return { brand, role };
    }
    async listMine(userId) {
        const [owned, memberships, user] = await Promise.all([
            this.prisma.brandProfile.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.workspaceMember.findMany({
                where: { userId, status: 'ACTIVE' },
                include: { brandProfile: true },
            }),
            this.prisma.user.findUnique({
                where: { id: userId },
                select: { activeBrandProfileId: true },
            }),
        ]);
        const active = await this.resolveActive(userId);
        return {
            activeId: active?.id ?? user?.activeBrandProfileId ?? null,
            workspaces: [
                ...owned.map((b) => ({
                    id: b.id,
                    companyName: b.companyName,
                    logoUrl: b.logoUrl,
                    role: 'OWNER',
                })),
                ...memberships.map((m) => ({
                    id: m.brandProfile.id,
                    companyName: m.brandProfile.companyName,
                    logoUrl: m.brandProfile.logoUrl,
                    role: m.role,
                })),
            ],
        };
    }
    async create(userId, companyName, industry) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role.name !== 'AGENCY') {
            const owned = await this.prisma.brandProfile.count({ where: { userId } });
            if (owned >= 1) {
                throw new common_1.BadRequestException('Only agency accounts can manage multiple client workspaces. Switch your account type to Agency to add clients.');
            }
        }
        const brand = await this.prisma.brandProfile.create({
            data: { userId, companyName, industry },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { activeBrandProfileId: brand.id },
        });
        return brand;
    }
    async switchActive(userId, brandProfileId) {
        await this.assertAccess(userId, brandProfileId);
        await this.prisma.user.update({
            where: { id: userId },
            data: { activeBrandProfileId: brandProfileId },
        });
        return { activeId: brandProfileId };
    }
    async listMembers(userId, brandProfileId) {
        const { brand } = await this.assertAccess(userId, brandProfileId);
        const [owner, members] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: brand.userId },
                select: { id: true, email: true, profile: { select: { displayName: true } } },
            }),
            this.prisma.workspaceMember.findMany({
                where: { brandProfileId, status: { not: 'REVOKED' } },
                include: {
                    user: {
                        select: { id: true, email: true, profile: { select: { displayName: true } } },
                    },
                },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        const seatLimit = await this.seatLimit(brand.userId);
        const used = 1 + members.filter((m) => m.status !== 'REVOKED').length;
        return {
            owner: {
                userId: owner?.id,
                email: owner?.email,
                displayName: owner?.profile?.displayName ?? null,
                role: 'OWNER',
                status: 'ACTIVE',
            },
            members: members.map((m) => ({
                id: m.id,
                userId: m.userId,
                email: m.user?.email ?? m.invitedEmail,
                displayName: m.user?.profile?.displayName ?? null,
                role: m.role,
                status: m.status,
                createdAt: m.createdAt,
            })),
            seats: { used, limit: seatLimit },
        };
    }
    async seatLimit(ownerUserId) {
        const sub = await this.prisma.subscription.findUnique({
            where: { userId: ownerUserId },
            select: { plan: true, status: true },
        });
        const plan = sub?.status === 'ACTIVE' ? sub.plan : 'FREE';
        return PLAN_SEATS[plan] ?? 1;
    }
    async invite(userId, brandProfileId, email, role) {
        const { brand } = await this.assertAccess(userId, brandProfileId, 'ADMIN');
        if (role === 'OWNER') {
            throw new common_1.BadRequestException('A workspace can only have one owner.');
        }
        const normalised = email.trim().toLowerCase();
        const ownerEmail = await this.prisma.user.findUnique({
            where: { id: brand.userId },
            select: { email: true },
        });
        if (ownerEmail?.email.toLowerCase() === normalised) {
            throw new common_1.BadRequestException('That person already owns this workspace.');
        }
        const limit = await this.seatLimit(brand.userId);
        if (limit !== -1) {
            const used = 1 +
                (await this.prisma.workspaceMember.count({
                    where: { brandProfileId, status: { not: 'REVOKED' } },
                }));
            if (used >= limit) {
                throw new common_1.BadRequestException(`Your plan includes ${limit} seat${limit === 1 ? '' : 's'}. Upgrade to invite more team members.`);
            }
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: normalised },
            select: { id: true },
        });
        const member = await this.prisma.workspaceMember.upsert({
            where: { brandProfileId_invitedEmail: { brandProfileId, invitedEmail: normalised } },
            create: {
                brandProfileId,
                invitedEmail: normalised,
                userId: existingUser?.id,
                role,
                status: existingUser ? 'ACTIVE' : 'INVITED',
                invitedById: userId,
                acceptedAt: existingUser ? new Date() : null,
            },
            update: {
                role,
                status: existingUser ? 'ACTIVE' : 'INVITED',
                userId: existingUser?.id,
            },
        });
        if (existingUser) {
            await this.notifications.create(existingUser.id, {
                type: 'WORKSPACE',
                title: `You were added to ${brand.companyName}`,
                body: `You now have ${role.toLowerCase()} access to this workspace.`,
                link: '/dashboard/brand/team',
            });
        }
        else {
            const base = this.settings.get('FRONTEND_URL') ?? 'https://www.infludubai.com';
            await this.mail.sendVerificationEmail(normalised, `${base}/register?email=${encodeURIComponent(normalised)}&role=BRAND`);
        }
        return member;
    }
    async updateRole(userId, brandProfileId, memberId, role) {
        await this.assertAccess(userId, brandProfileId, 'ADMIN');
        if (role === 'OWNER') {
            throw new common_1.BadRequestException('Ownership cannot be reassigned here.');
        }
        const member = await this.prisma.workspaceMember.findFirst({
            where: { id: memberId, brandProfileId },
        });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        return this.prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role },
        });
    }
    async removeMember(userId, brandProfileId, memberId) {
        await this.assertAccess(userId, brandProfileId, 'ADMIN');
        const member = await this.prisma.workspaceMember.findFirst({
            where: { id: memberId, brandProfileId },
        });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        await this.prisma.workspaceMember.update({
            where: { id: memberId },
            data: { status: 'REVOKED', userId: null },
        });
        if (member.userId) {
            await this.prisma.user.updateMany({
                where: { id: member.userId, activeBrandProfileId: brandProfileId },
                data: { activeBrandProfileId: null },
            });
        }
        return { removed: true };
    }
    async claimInvitations(userId, email) {
        const pending = await this.prisma.workspaceMember.findMany({
            where: { invitedEmail: email.toLowerCase(), status: 'INVITED', userId: null },
        });
        if (pending.length === 0)
            return 0;
        await this.prisma.workspaceMember.updateMany({
            where: { id: { in: pending.map((p) => p.id) } },
            data: { userId, status: 'ACTIVE', acceptedAt: new Date() },
        });
        return pending.length;
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = WorkspacesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        mail_service_1.MailService,
        settings_service_1.SettingsService])
], WorkspacesService);
//# sourceMappingURL=workspaces.service.js.map