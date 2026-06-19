import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { generateOpaqueToken, hashToken } from './token.util';

const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 30;
const REFRESH_TOKEN_TTL_DAYS = 7;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
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

  async login(dto: LoginDto): Promise<AuthTokens & { user: ReturnType<AuthService['toPublicUser']> }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true, role: true },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.issueTokens(user.id, user.role.name);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    // Rotate: revoke the used token and issue a fresh pair.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.userId, stored.user.role.name);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Verification link is invalid or expired.');
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

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Don't leak whether an email exists; always return success-shaped response.
    if (user && user.status === 'PENDING_VERIFICATION') {
      await this.sendVerificationEmail(user.id, user.email);
    }
    return { sent: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const { raw, hash } = generateOpaqueToken();
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
    // Same response whether or not the email is registered (avoids account enumeration).
    return { sent: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or expired.');
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
      // Reset implies any existing sessions should be invalidated.
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { reset: true };
  }

  // --- helpers ---------------------------------------------------------

  private async sendVerificationEmail(userId: string, email: string) {
    const { raw, hash } = generateOpaqueToken();
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

  private async issueTokens(userId: string, roleName: string): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role: roleName },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN'),
      },
    );

    const { raw: refreshToken, hash } = generateOpaqueToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    status: string;
    role: { name: string };
    profile: { displayName: string } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role.name,
      displayName: user.profile?.displayName ?? null,
    };
  }
}
