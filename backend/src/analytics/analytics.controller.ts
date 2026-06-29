import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { RecordMetricDto } from './dto/record-metric.dto';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('brand/overview')
  brandOverview(@CurrentUser() user: { id: string }) {
    return this.analytics.getBrandOverview(user.id);
  }

  @Get('campaigns/:id')
  campaignAnalytics(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.analytics.getCampaignAnalytics(user.id, id);
  }

  @Post('campaigns/:id/metrics')
  recordMetric(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: RecordMetricDto,
  ) {
    return this.analytics.recordMetric(user.id, id, dto);
  }

  @Get('creator/overview')
  creatorAnalytics(@CurrentUser() user: { id: string }) {
    return this.analytics.getCreatorAnalytics(user.id);
  }
}
