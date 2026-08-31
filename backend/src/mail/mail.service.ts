import { Injectable, Logger } from '@nestjs/common';
import type { Transporter } from 'nodemailer';
import { SettingsService } from '../settings/settings.service';
import { ContentService } from '../content/content.service';
import { CONTENT_FIELDS } from '../content/content.catalog';

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

  constructor(
    private readonly settings: SettingsService,
    private readonly content: ContentService,
  ) {}

  private get transport(): Transporter | null {
    // The explicit switch wins over configuration: "off" silences all email
    // while keeping every SMTP credential in place for later.
    const enabled = this.settings.get('EMAIL_ENABLED')?.trim().toLowerCase();
    if (enabled === 'off' || enabled === 'false' || enabled === '0' || enabled === 'no') {
      return null;
    }
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
      // Required here rather than imported: the SMTP client is dead weight
      // at boot on a container this small, and most deploys never send mail.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
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

  /**
   * Resolves an admin-edited template with its shipped default underneath, and
   * substitutes {{placeholders}}. An emptied field falls back to the default,
   * so a template can never be saved into a blank email.
   */
  private tpl(
    prefix: 'approved' | 'passwordReset' | 'verification',
    vars: Record<string, string>,
  ): { subject: string; body: string; cta: string } {
    const overrides = this.content.getPublic();
    const pick = (part: 'subject' | 'body' | 'cta') => {
      const key = `email.${prefix}.${part}`;
      const raw =
        overrides[key]?.trim() ||
        CONTENT_FIELDS.find((f) => f.key === key)?.default ||
        '';
      return raw.replace(/{{(w+)}}/g, (_, name) => vars[name] ?? '');
    };
    return { subject: pick('subject'), body: pick('body'), cta: pick('cta') };
  }

  private get brandName(): string {
    return this.content.getPublic()['global.brandName'] ?? 'InfluDubai AI';
  }

  async sendVerificationEmail(to: string, link: string) {
    const t = this.tpl('verification', { brandName: this.brandName });
    await this.send({
      to,
      subject: t.subject,
      heading: 'Confirm your email',
      body: t.body,
      ctaLabel: t.cta,
      link,
      devLabel: 'Verify your email',
    });
  }

  async sendPasswordResetEmail(to: string, link: string) {
    const t = this.tpl('passwordReset', { brandName: this.brandName });
    await this.send({
      to,
      subject: t.subject,
      heading: 'Reset your password',
      body: t.body,
      ctaLabel: t.cta,
      link,
      devLabel: 'Reset your password',
    });
  }

  /** Sent when an admin approves an account that was waiting in the queue. */
  async sendAccountApproved(to: string, displayName: string) {
    const t = this.tpl('approved', { name: displayName, brandName: this.brandName });
    await this.send({
      to,
      subject: t.subject,
      heading: `Welcome${displayName ? ', ' + displayName : ''}!`,
      body: t.body,
      ctaLabel: t.cta,
      link: `${process.env.FRONTEND_URL ?? 'https://www.infludubai.ae'}/login`,
      devLabel: 'Account approved',
    });
  }

  /**
   * A real end-to-end test message, sent to the admin pressing the button in
   * Admin → Settings → Email. Throws on failure so the tester can surface the
   * SMTP error verbatim instead of a vague "something went wrong".
   */
  async sendTestEmail(to: string) {
    const transport = this.transport;
    if (!transport) {
      throw new Error(
        'Email is disabled or SMTP is not configured, so nothing was sent.',
      );
    }
    await transport.sendMail({
      from: this.from,
      to,
      subject: `${this.brandName} test email`,
      text: 'This is a test message from Admin → Settings → Email. If you are reading it, SMTP is working.',
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
