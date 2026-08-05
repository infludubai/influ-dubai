import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { SettingsService } from '../settings/settings.service';

/**
 * Sends transactional email over SMTP when credentials are configured in
 * Admin → Settings (or the environment), and falls back to logging the link
 * to the server console otherwise — so the verification and password-reset
 * flows stay fully testable on localhost with no provider account.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private transporterKey = '';

  constructor(private readonly settings: SettingsService) {}

  private get transport(): Transporter | null {
    const host = this.settings.get('SMTP_HOST');
    if (!host) {
      this.transporter = null;
      this.transporterKey = '';
      return null;
    }

    const port = this.settings.getNumber('SMTP_PORT', 587);
    const user = this.settings.get('SMTP_USER');
    const pass = this.settings.get('SMTP_PASS');
    const fingerprint = `${host}:${port}:${user ?? ''}:${pass ?? ''}`;

    if (!this.transporter || this.transporterKey !== fingerprint) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // implicit TLS on 465, STARTTLS elsewhere
        auth: user && pass ? { user, pass } : undefined,
      });
      this.transporterKey = fingerprint;
    }
    return this.transporter;
  }

  private get from(): string {
    return (
      this.settings.get('MAIL_FROM') ?? 'InfluDubai AI <noreply@infludubai.com>'
    );
  }

  async sendVerificationEmail(to: string, link: string) {
    await this.send({
      to,
      subject: 'Verify your InfluDubai AI account',
      heading: 'Confirm your email',
      body: 'Thanks for signing up. Confirm your email address to activate your account and start using the platform.',
      ctaLabel: 'Verify email',
      link,
      devLabel: 'Verify your email',
    });
  }

  async sendPasswordResetEmail(to: string, link: string) {
    await this.send({
      to,
      subject: 'Reset your InfluDubai AI password',
      heading: 'Reset your password',
      body: "We received a request to reset your password. This link expires in 1 hour. If you didn't request it, you can safely ignore this email.",
      ctaLabel: 'Reset password',
      link,
      devLabel: 'Reset your password',
    });
  }

  /**
   * Support enquiry from the public contact form. `replyTo` is the enquirer,
   * so hitting reply in the support inbox goes to them rather than to us.
   */
  async sendContactMessage(
    to: string,
    subject: string,
    body: string,
    replyTo: string,
  ) {
    const transport = this.transport;

    if (!transport) {
      this.logger.log(`[DEV EMAIL] Contact enquiry to ${to}\n${body}`);
      return;
    }

    try {
      await transport.sendMail({
        from: this.from,
        to,
        replyTo,
        subject,
        text: body,
      });
      this.logger.log(`Contact enquiry forwarded to ${to}`);
    } catch (err) {
      this.logger.error(`SMTP send failed for contact form: ${(err as Error).message}`);
      this.logger.log(`[FALLBACK] Contact enquiry\n${body}`);
    }
  }

  private async send(opts: {
    to: string;
    subject: string;
    heading: string;
    body: string;
    ctaLabel: string;
    link: string;
    devLabel: string;
  }) {
    const transport = this.transport;

    if (!transport) {
      this.logger.log(`[DEV EMAIL] ${opts.devLabel} for ${opts.to}: ${opts.link}`);
      return;
    }

    try {
      await transport.sendMail({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        text: `${opts.heading}\n\n${opts.body}\n\n${opts.link}`,
        html: this.template(opts),
      });
      this.logger.log(`Sent "${opts.subject}" to ${opts.to}`);
    } catch (err) {
      // A mail outage must not fail the signup/reset request itself — the
      // link is logged so the flow can still be completed manually.
      this.logger.error(
        `SMTP send failed for ${opts.to}: ${(err as Error).message}`,
      );
      this.logger.log(`[FALLBACK] ${opts.devLabel} for ${opts.to}: ${opts.link}`);
    }
  }

  private template(opts: {
    heading: string;
    body: string;
    ctaLabel: string;
    link: string;
  }): string {
    return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <div style="font-size:17px;font-weight:700;color:#7c3aed;letter-spacing:-0.01em;">InfluDubai AI</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#18181b;font-weight:700;">${opts.heading}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#52525b;">${opts.body}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <a href="${opts.link}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:10px;">${opts.ctaLabel}</a>
                <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#a1a1aa;">Or paste this link into your browser:<br><span style="color:#7c3aed;word-break:break-all;">${opts.link}</span></p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
                <p style="margin:0;font-size:12px;color:#a1a1aa;">Creator intelligence &amp; influencer marketing for UAE &amp; MENA.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}
