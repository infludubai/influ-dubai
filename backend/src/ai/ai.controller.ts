import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('creator/:id/analyze')
  analyzeCreator(@Param('id') id: string) {
    return this.ai.analyzeCreator(id);
  }

  @Get('creator/:id/insights')
  getInsights(@Param('id') id: string) {
    return this.ai.analyzeCreator(id);
  }

  @Post('campaign/:id/suggest')
  suggestCreators(@Param('id') id: string) {
    return this.ai.suggestCreators(id);
  }

  @Post('campaign/:id/predict')
  predictCampaign(@Param('id') id: string) {
    return this.ai.predictCampaign(id);
  }
}
