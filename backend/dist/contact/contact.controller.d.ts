import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
declare const TOPICS: readonly ["GENERAL", "BRAND", "CREATOR", "AGENCY", "PARTNERSHIP"];
declare class ContactDto {
    name: string;
    email: string;
    company?: string;
    topic: (typeof TOPICS)[number];
    message: string;
}
export declare class ContactController {
    private readonly mail;
    private readonly settings;
    private readonly audit;
    private readonly logger;
    constructor(mail: MailService, settings: SettingsService, audit: AuditService);
    submit(dto: ContactDto): Promise<{
        received: boolean;
    }>;
}
export {};
