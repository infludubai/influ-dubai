import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CreatorsModule } from './creators/creators.module';
import { BrandsModule } from './brands/brands.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ProposalsModule } from './proposals/proposals.module';
import { MessagingModule } from './messaging/messaging.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { FraudModule } from './fraud/fraud.module';
import { UploadModule } from './upload/upload.module';
import { SettingsModule } from './settings/settings.module';
import { DeliverablesModule } from './deliverables/deliverables.module';
import { PaymentsModule } from './payments/payments.module';
import { TrustModule } from './trust/trust.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ContactModule } from './contact/contact.module';
import { HealthModule } from './health/health.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // A single dashboard page load fans out to ~10 endpoints, so 100/min
    // throttled ordinary use. Auth routes keep their own stricter 10/min cap
    // (see AuthController) — that's where brute-force protection matters.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    HealthModule,
    AuditModule,
    SettingsModule,
    ContentModule,
    WorkspacesModule,
    AuthModule,
    UsersModule,
    CreatorsModule,
    BrandsModule,
    CampaignsModule,
    NotificationsModule,
    InvitationsModule,
    ProposalsModule,
    DeliverablesModule,
    PaymentsModule,
    TrustModule,
    ContactModule,
    MessagingModule,
    AnalyticsModule,
    AiModule,
    BillingModule,
    AdminModule,
    FraudModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
