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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ContactController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const class_validator_1 = require("class-validator");
const mail_service_1 = require("../mail/mail.service");
const settings_service_1 = require("../settings/settings.service");
const audit_service_1 = require("../audit/audit.service");
const TOPICS = ['GENERAL', 'BRAND', 'CREATOR', 'AGENCY', 'PARTNERSHIP'];
class ContactDto {
    name;
    email;
    company;
    topic;
    message;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], ContactDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ContactDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], ContactDto.prototype, "company", void 0);
__decorate([
    (0, class_validator_1.IsIn)(TOPICS),
    __metadata("design:type", Object)
], ContactDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], ContactDto.prototype, "message", void 0);
let ContactController = ContactController_1 = class ContactController {
    mail;
    settings;
    audit;
    logger = new common_1.Logger(ContactController_1.name);
    constructor(mail, settings, audit) {
        this.mail = mail;
        this.settings = settings;
        this.audit = audit;
    }
    async submit(dto) {
        const to = this.settings.get('SUPPORT_EMAIL') ?? 'hello@infludubai.com';
        const body = [
            `Topic: ${dto.topic}`,
            `From: ${dto.name} <${dto.email}>`,
            dto.company ? `Company: ${dto.company}` : null,
            '',
            dto.message,
        ]
            .filter(Boolean)
            .join('\n');
        await this.mail.sendContactMessage(to, `[${dto.topic}] Enquiry from ${dto.name}`, body, dto.email);
        this.audit.log({
            action: 'contact.submitted',
            resource: 'contact',
            meta: { topic: dto.topic, email: dto.email },
        });
        return { received: true };
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60_000, limit: 5 } }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ContactDto]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "submit", null);
exports.ContactController = ContactController = ContactController_1 = __decorate([
    (0, common_1.Controller)('contact'),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        settings_service_1.SettingsService,
        audit_service_1.AuditService])
], ContactController);
//# sourceMappingURL=contact.controller.js.map