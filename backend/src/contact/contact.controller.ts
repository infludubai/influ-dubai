import { Body, Controller, Logger, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';

const TOPICS = ['GENERAL', 'BRAND', 'CREATOR', 'AGENCY', 'PARTNERSHIP'] as const;

class ContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @IsIn(TOPICS)
  topic!: (typeof TOPICS)[number];

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;
}

@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(
    private readonly mail: MailService,
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Public, unauthenticated — so it gets a tight rate limit of its own.
   * Without one this is an open relay for spam to the support inbox.
   */
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  async submit(@Body() dto: ContactDto) {
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

    // MailService already falls back to console logging when SMTP is absent,
    // so an enquiry is never silently lost in local or pre-launch setups.
    await this.mail.sendContactMessage(to, `[${dto.topic}] Enquiry from ${dto.name}`, body, dto.email);

    this.audit.log({
      action: 'contact.submitted',
      resource: 'contact',
      meta: { topic: dto.topic, email: dto.email },
    });

    return { received: true };
  }
}
