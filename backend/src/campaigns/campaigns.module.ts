import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { MatchingService } from './matching.service';

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService, MatchingService],
  exports: [CampaignsService, MatchingService],
})
export class CampaignsModule {}
