import { Global, Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsTester } from './settings.tester';

/**
 * Global so any service can resolve runtime configuration without every
 * feature module having to import it — mirrors how AuditModule is wired.
 */
@Global()
@Module({
  controllers: [SettingsController],
  providers: [SettingsService, SettingsTester],
  exports: [SettingsService],
})
export class SettingsModule {}
