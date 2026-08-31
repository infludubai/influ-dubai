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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = exports.GRANTABLE_FEATURES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
exports.GRANTABLE_FEATURES = [
    'aiInsights',
    'analytics',
    'unlimitedCampaigns',
];
let AdminService = AdminService_1 = class AdminService {
    prisma;
    mail;
    logger = new common_1.Logger(AdminService_1.name);
    constructor(prisma, mail) {
        this.prisma = prisma;
        this.mail = mail;
    }
    async getSystemStats() {
        const [totalUsers, totalCreators, totalBrands, totalCampaigns, activeCampaigns, totalMessages, totalRevenue,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.creatorProfile.count(),
            this.prisma.brandProfile.count(),
            this.prisma.campaign.count(),
            this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
            this.prisma.message.count(),
            this.prisma.invoice.aggregate({ _sum: { amountUsd: true }, where: { status: 'paid' } }),
        ]);
        return {
            totalUsers,
            totalCreators,
            totalBrands,
            totalCampaigns,
            activeCampaigns,
            totalMessages,
            totalRevenueUsd: totalRevenue._sum.amountUsd ?? 0,
        };
    }
    async listUsers(page, limit, role, search, status) {
        const where = {};
        if (role)
            where.role = { name: role };
        if (status)
            where.status = status;
        if (search)
            where.OR = [
                { email: { contains: search } },
                { profile: { displayName: { contains: search } } },
            ];
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    status: true,
                    createdAt: true,
                    featureOverrides: true,
                    role: { select: { name: true } },
                    profile: { select: { displayName: true, avatarUrl: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, page, limit };
    }
    async updateUserStatus(userId, status) {
        if (!Object.values(client_1.UserStatus).includes(status)) {
            throw new common_1.BadRequestException(`Unknown status: ${status}`);
        }
        const before = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: { profile: true },
        });
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { status: status },
        });
        if (before.status === 'PENDING_APPROVAL' && status === 'ACTIVE') {
            this.mail
                .sendAccountApproved(before.email, before.profile?.displayName ?? '')
                .catch((err) => this.logger.warn(`Approval email to ${before.email} failed: ${err.message}`));
        }
        return user;
    }
    async updateUserRole(userId, roleName) {
        if (!Object.values(client_1.RoleName).includes(roleName)) {
            throw new common_1.BadRequestException(`Unknown role: ${roleName}`);
        }
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: { role: true },
        });
        if (user.role.name === 'ADMIN' && roleName !== 'ADMIN') {
            const admins = await this.prisma.user.count({ where: { role: { name: 'ADMIN' } } });
            if (admins <= 1) {
                throw new common_1.BadRequestException('This is the only admin account — grant another user ADMIN first.');
            }
        }
        const role = await this.prisma.role.findUniqueOrThrow({
            where: { name: roleName },
        });
        return this.prisma.user.update({
            where: { id: userId },
            data: { roleId: role.id },
            include: { role: { select: { name: true } } },
        });
    }
    async updateUserFeatures(userId, overrides) {
        const clean = {};
        for (const key of exports.GRANTABLE_FEATURES) {
            if (overrides[key] === true)
                clean[key] = true;
        }
        const unknown = Object.keys(overrides).filter((k) => !exports.GRANTABLE_FEATURES.includes(k));
        if (unknown.length > 0) {
            throw new common_1.BadRequestException(`Unknown feature(s): ${unknown.join(', ')}`);
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                featureOverrides: Object.keys(clean).length ? clean : client_1.Prisma.JsonNull,
            },
            select: { id: true, featureOverrides: true },
        });
    }
    async deleteUser(userId) {
        return this.prisma.user.delete({ where: { id: userId } });
    }
    async listCampaigns(page, limit, status) {
        const where = {};
        if (status)
            where.status = status;
        const [campaigns, total] = await Promise.all([
            this.prisma.campaign.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    brand: { select: { companyName: true } },
                    _count: { select: { invitations: true, proposals: true } },
                },
            }),
            this.prisma.campaign.count({ where }),
        ]);
        return { campaigns, total, page, limit };
    }
    async updateCampaignStatus(campaignId, status) {
        return this.prisma.campaign.update({ where: { id: campaignId }, data: { status: status } });
    }
    async getRevenueStats() {
        const invoices = await this.prisma.invoice.findMany({
            where: { status: 'paid' },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const byPlan = await this.prisma.$queryRaw `
      SELECT s.plan, COUNT(i.id) as count, SUM(i.amount_usd) as total
      FROM invoices i
      JOIN subscriptions s ON i.subscription_id = s.id
      WHERE i.status = 'paid'
      GROUP BY s.plan
    `;
        return { recentInvoices: invoices, byPlan: byPlan.map(r => ({ ...r, count: Number(r.count) })) };
    }
    async getAuditLog(page, limit) {
        const [messages, invitations, proposals] = await Promise.all([
            this.prisma.message.findMany({
                orderBy: { createdAt: 'desc' },
                take: 30,
            }),
            this.prisma.campaignInvitation.findMany({
                orderBy: { createdAt: 'desc' },
                take: 30,
                include: { campaign: { select: { title: true } } },
            }),
            this.prisma.proposal.findMany({
                orderBy: { createdAt: 'desc' },
                take: 30,
                include: { campaign: { select: { title: true } } },
            }),
        ]);
        const log = [
            ...messages.map(m => ({
                type: 'MESSAGE',
                at: m.createdAt,
                detail: `User sent a message (conversation ${m.conversationId.slice(0, 8)}…)`,
            })),
            ...invitations.map(i => ({
                type: 'INVITATION',
                at: i.createdAt,
                detail: `Invitation to "${i.campaign.title}" — ${i.status}`,
            })),
            ...proposals.map(p => ({
                type: 'PROPOSAL',
                at: p.createdAt,
                detail: `Proposal for "${p.campaign.title}" — ${p.status}`,
            })),
        ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
            .slice((page - 1) * limit, page * limit);
        return { log, page, limit };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], AdminService);
//# sourceMappingURL=admin.service.js.map