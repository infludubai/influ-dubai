import { Module } from '@nestjs/common';
import { TrustController } from './trust.controller';
import { TrustPublicController } from './trust-public.controller';
import { VerificationService } from './verification.service';
import { ReviewsService } from './reviews.service';
import { ShortlistsService } from './shortlists.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TrustPublicController, TrustController],
  providers: [VerificationService, ReviewsService, ShortlistsService],
  exports: [VerificationService, ReviewsService, ShortlistsService],
})
export class TrustModule {}
