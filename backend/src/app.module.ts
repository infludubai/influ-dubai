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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CreatorsModule,
    BrandsModule,
    CampaignsModule,
    NotificationsModule,
    InvitationsModule,
    ProposalsModule,
    MessagingModule,
    AnalyticsModule,
    AiModule,
    BillingModule,
    AdminModule,
    AuditModule,
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
