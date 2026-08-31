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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("../settings/settings.service");
const content_service_1 = require("../content/content.service");
const content_catalog_1 = require("../content/content.catalog");
let MailService = MailService_1 = class MailService {
    settings;
    content;
    logger = new common_1.Logger(MailService_1.name);
    transporter = null;
    transporterKey = '';
    constructor(settings, content) {
        this.settings = settings;
        this.content = content;
    }
    get transport() {
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
            const nodemailer = require('nodemailer');
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: user && pass ? { user, pass } : undefined,
            });
            this.transporterKey = fingerprint;
        }
        return this.transporter;
    }
    get from() {
        return (this.settings.get('MAIL_FROM') ?? 'InfluDubai AI <noreply@infludubai.com>');
    }
    tpl(prefix, vars) {
        const overrides = this.content.getPublic();
        const pick = (part) => {
            const key = `email.${prefix}.${part}`;
            const raw = overrides[key]?.trim() ||
                content_catalog_1.CONTENT_FIELDS.find((f) => f.key === key)?.default ||
                '';
            return raw.replace(/{{(w+)}}/g, (_, name) => vars[name] ?? '');
        };
        return { subject: pick('subject'), body: pick('body'), cta: pick('cta') };
    }
    get brandName() {
        return this.content.getPublic()['global.brandName'] ?? 'InfluDubai AI';
    }
    async sendVerificationEmail(to, link) {
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
    async sendPasswordResetEmail(to, link) {
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
    async sendAccountApproved(to, displayName) {
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
    async sendTestEmail(to) {
        const transport = this.transport;
        if (!transport) {
            throw new Error('Email is disabled or SMTP is not configured, so nothing was sent.');
        }
        await transport.sendMail({
            from: this.from,
            to,
            subject: `${this.brandName} test email`,
            text: 'This is a test message from Admin → Settings → Email. If you are reading it, SMTP is working.',
        });
    }
    async sendContactMessage(to, subject, body, replyTo) {
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
        }
        catch (err) {
            this.logger.error(`SMTP send failed for contact form: ${err.message}`);
            this.logger.log(`[FALLBACK] Contact enquiry\n${body}`);
        }
    }
    async send(opts) {
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
        }
        catch (err) {
            this.logger.error(`SMTP send failed for ${opts.to}: ${err.message}`);
            this.logger.log(`[FALLBACK] ${opts.devLabel} for ${opts.to}: ${opts.link}`);
        }
    }
    template(opts) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        content_service_1.ContentService])
], MailService);
//# sourceMappingURL=mail.service.js.map