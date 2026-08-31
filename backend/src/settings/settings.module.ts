import { Global, Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsTester } from './settings.tester';
import { MailModule } from '../mail/mail.module';

/**
 * Global so any service can resolve runtime configuration without every
 * feature module having to import it — mirrors how AuditModule is wired.
 */
@Global()
@Module({
  imports: [MailModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsTester],
  exports: [SettingsService],
})
export class SettingsModule {}
