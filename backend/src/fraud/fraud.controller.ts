import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FraudService } from './fraud.service';
import { Throttle } from '@nestjs/throttler';

@Controller('fraud')
@UseGuards(JwtAuthGuard)
export class FraudController {
  constructor(private readonly fraud: FraudService) {}

  // Any authenticated user can trigger analysis on a creator (brands, admins)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('analyze/:creatorProfileId')
  analyze(@Param('creatorProfileId') id: string) {
    return this.fraud.analyzeCreator(id);
  }

  @Get('history/:creatorProfileId')
  history(@Param('creatorProfileId') id: string) {
    return this.fraud.getCreatorFraudHistory(id);
  }

  // Admin-only endpoints
  @UseGuards(AdminGuard)
  @Get('stats')
  stats() {
    return this.fraud.getFraudStats();
  }

  @UseGuards(AdminGuard)
  @Post('scan-all')
  scanAll() {
    return this.fraud.scanAll();
  }
}
