import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly mail;
    private readonly workspaces;
    private readonly settings;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, mail: MailService, workspaces: WorkspacesService, settings: SettingsService);
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
        status: string;
        role: string;
        displayName: string | null;
    }>;
    private shouldBootstrapAsAdmin;
    login(dto: LoginDto): Promise<AuthTokens & {
        user: ReturnType<AuthService['toPublicUser']>;
    }>;
    refresh(rawRefreshToken: string): Promise<AuthTokens>;
    logout(rawRefreshToken: string): Promise<void>;
    verifyEmail(rawToken: string): Promise<{
        verified: boolean;
    }>;
    resendVerification(email: string): Promise<{
        sent: boolean;
    }>;
    forgotPassword(email: string): Promise<{
        sent: boolean;
    }>;
    resetPassword(rawToken: string, newPassword: string): Promise<{
        reset: boolean;
    }>;
    private sendVerificationEmail;
    private issueTokens;
    private toPublicUser;
}
