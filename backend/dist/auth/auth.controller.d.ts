import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
        status: string;
        role: string;
        displayName: string | null;
    }>;
    login(dto: LoginDto): Promise<import("./auth.service").AuthTokens & {
        user: ReturnType<AuthService["toPublicUser"]>;
    }>;
    refresh(dto: RefreshTokenDto): Promise<import("./auth.service").AuthTokens>;
    logout(dto: RefreshTokenDto): Promise<void>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        verified: boolean;
    }>;
    resendVerification(dto: ForgotPasswordDto): Promise<{
        sent: boolean;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        sent: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        reset: boolean;
    }>;
    me(user: {
        id: string;
        role: string;
    }): {
        id: string;
        role: string;
    };
}
