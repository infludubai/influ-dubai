"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const token_util_1 = require("./token.util");
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 30;
const REFRESH_TOKEN_TTL_DAYS = 7;
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    mail;
    constructor(prisma, jwt, config, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.ConflictException('An account with this email already exists.');
        }
        const role = await this.prisma.role.findUniqueOrThrow({ where: { name: dto.role } });
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                roleId: role.id,
                profile: { create: { displayName: dto.displayName } },
            },
            include: { profile: true, role: true },
        });
        await this.sendVerificationEmail(user.id, user.email);
        return this.toPublicUser(user);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { profile: true, role: true },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const tokens = await this.issueTokens(user.id, user.role.name);
        return { ...tokens, user: this.toPublicUser(user) };
    }
    async refresh(rawRefreshToken) {
        const tokenHash = (0, token_util_1.hashToken)(rawRefreshToken);
        const stored = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: { include: { role: true } } },
        });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token is invalid or expired.');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
        return this.issueTokens(stored.userId, stored.user.role.name);
    }
    async logout(rawRefreshToken) {
        const tokenHash = (0, token_util_1.hashToken)(rawRefreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async verifyEmail(rawToken) {
        const tokenHash = (0, token_util_1.hashToken)(rawToken);
        const record = await this.prisma.emailVerificationToken.findUnique({
            where: { tokenHash },
        });
        if (!record || record.usedAt || record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Verification link is invalid or expired.');
        }
        await this.prisma.$transaction([
            this.prisma.emailVerificationToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
            this.prisma.user.update({
                where: { id: record.userId },
                data: { status: 'ACTIVE' },
            }),
        ]);
        return { verified: true };
    }
    async resendVerification(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && user.status === 'PENDING_VERIFICATION') {
            await this.sendVerificationEmail(user.id, user.email);
        }
        return { sent: true };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user) {
            const { raw, hash } = (0, token_util_1.generateOpaqueToken)();
            await this.prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    tokenHash: hash,
                    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
                },
            });
            const link = `${this.config.get('FRONTEND_URL')}/reset-password?token=${raw}`;
            await this.mail.sendPasswordResetEmail(user.email, link);
        }
        return { sent: true };
    }
    async resetPassword(rawToken, newPassword) {
        const tokenHash = (0, token_util_1.hashToken)(rawToken);
        const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!record || record.usedAt || record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Reset link is invalid or expired.');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.$transaction([
            this.prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
            this.prisma.user.update({
                where: { id: record.userId },
                data: { passwordHash },
            }),
            this.prisma.refreshToken.updateMany({
                where: { userId: record.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
        return { reset: true };
    }
    async sendVerificationEmail(userId, email) {
        const { raw, hash } = (0, token_util_1.generateOpaqueToken)();
        await this.prisma.emailVerificationToken.create({
            data: {
                userId,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
            },
        });
        const link = `${this.config.get('FRONTEND_URL')}/verify-email?token=${raw}`;
        await this.mail.sendVerificationEmail(email, link);
    }
    async issueTokens(userId, roleName) {
        const accessToken = await this.jwt.signAsync({ sub: userId, role: roleName }, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
        });
        const { raw: refreshToken, hash } = (0, token_util_1.generateOpaqueToken)();
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
            },
        });
        return { accessToken, refreshToken };
    }
    toPublicUser(user) {
        return {
            id: user.id,
            email: user.email,
            status: user.status,
            role: user.role.name,
            displayName: user.profile?.displayName ?? null,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map