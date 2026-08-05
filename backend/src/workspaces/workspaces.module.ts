import { Global, Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

/**
 * Global because brand-scoped authorization lives here — nearly every feature
 * module needs to resolve the caller's active workspace.
 */
@Global()
@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
