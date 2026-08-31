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
var SettingsTester_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsTester = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("./settings.service");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
let SettingsTester = SettingsTester_1 = class SettingsTester {
    settings;
    mail;
    prisma;
    logger = new common_1.Logger(SettingsTester_1.name);
    constructor(settings, mail, prisma) {
        this.settings = settings;
        this.mail = mail;
        this.prisma = prisma;
    }
    async test(group, callerId) {
        try {
            switch (group) {
                case 'openai':
                    return await this.testOpenAi();
                case 'stripe':
                    return await this.testStripe();
                case 'smtp':
                    return this.testSmtp(callerId);
                default:
                    return { ok: false, message: 'This section has nothing to test.' };
            }
        }
        catch (err) {
            const message = err.message ?? 'Unknown error';
            this.logger.warn(`Connection test failed for ${group}: ${message}`);
            return { ok: false, message };
        }
    }
    async testOpenAi() {
        const apiKey = this.settings.get('OPENAI_API_KEY');
        if (!apiKey)
            return { ok: false, message: 'No API key configured.' };
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey });
        const models = await client.models.list();
        const wanted = this.settings.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
        const available = models.data.some((m) => m.id === wanted);
        return {
            ok: true,
            message: available
                ? `Connected. Model "${wanted}" is available.`
                : `Connected, but model "${wanted}" was not found on this account — AI calls will fail until you pick an available model.`,
        };
    }
    async testStripe() {
        const apiKey = this.settings.get('STRIPE_SECRET_KEY');
        if (!apiKey)
            return { ok: false, message: 'No secret key configured.' };
        const Stripe = require('stripe');
        const stripe = new Stripe(apiKey);
        const balance = await stripe.balance.retrieve();
        const mode = apiKey.startsWith('sk_live') ? 'LIVE' : 'test';
        const currencies = [
            ...new Set(balance.available.map((b) => b.currency.toUpperCase())),
        ];
        return {
            ok: true,
            message: `Connected in ${mode} mode${currencies.length ? ` (balance currencies: ${currencies.join(', ')})` : ''}.`,
        };
    }
    async testSmtp(callerId) {
        const host = this.settings.get('SMTP_HOST');
        const from = this.settings.get('MAIL_FROM');
        if (this.settings.get('EMAIL_ENABLED')?.trim().toLowerCase() === 'off') {
            return { ok: false, message: 'Sending is switched off. Set "Sending enabled" back to on first.' };
        }
        if (!host) {
            return {
                ok: false,
                message: 'No SMTP host configured — emails are being written to the server log.',
            };
        }
        if (!from) {
            return { ok: false, message: 'Set a From address before sending mail.' };
        }
        const caller = callerId
            ? await this.prisma.user.findUnique({ where: { id: callerId }, select: { email: true } })
            : null;
        if (!caller) {
            return { ok: true, message: `SMTP configured for ${host}.` };
        }
        try {
            await this.mail.sendTestEmail(caller.email);
            return { ok: true, message: `Test email sent to ${caller.email} — check the inbox (and spam).` };
        }
        catch (err) {
            return { ok: false, message: `SMTP refused the message: ${err.message}` };
        }
    }
};
exports.SettingsTester = SettingsTester;
exports.SettingsTester = SettingsTester = SettingsTester_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        mail_service_1.MailService,
        prisma_service_1.PrismaService])
], SettingsTester);
//# sourceMappingURL=settings.tester.js.map