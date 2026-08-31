import { SettingsService } from '../settings/settings.service';
import { ContentService } from '../content/content.service';
export declare class MailService {
    private readonly settings;
    private readonly content;
    private readonly logger;
    private transporter;
    private transporterKey;
    constructor(settings: SettingsService, content: ContentService);
    private get transport();
    private get from();
    private tpl;
    private get brandName();
    sendVerificationEmail(to: string, link: string): Promise<void>;
    sendPasswordResetEmail(to: string, link: string): Promise<void>;
    sendAccountApproved(to: string, displayName: string): Promise<void>;
    sendTestEmail(to: string): Promise<void>;
    sendContactMessage(to: string, subject: string, body: string, replyTo: string): Promise<void>;
    private send;
    private template;
}
