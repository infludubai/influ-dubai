import { SettingsService } from './settings.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingGroupId } from './settings.catalog';
export interface TestResult {
    ok: boolean;
    message: string;
}
export declare class SettingsTester {
    private readonly settings;
    private readonly mail;
    private readonly prisma;
    private readonly logger;
    constructor(settings: SettingsService, mail: MailService, prisma: PrismaService);
    test(group: SettingGroupId, callerId?: string): Promise<TestResult>;
    private testOpenAi;
    private testStripe;
    private testSmtp;
}
