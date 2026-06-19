import { Injectable, Logger } from '@nestjs/common';

/**
 * Dev-mode mail service: logs the email instead of sending it, so the
 * verification/reset flow is fully testable on localhost with no SMTP
 * credentials configured. Swap the body of these methods for a real
 * provider (SES, Postmark, etc.) when credentials are available —
 * the call sites in AuthService don't need to change.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationEmail(to: string, link: string) {
    this.logger.log(`[DEV EMAIL] Verify your email for ${to}: ${link}`);
  }

  async sendPasswordResetEmail(to: string, link: string) {
    this.logger.log(`[DEV EMAIL] Reset your password for ${to}: ${link}`);
  }
}
