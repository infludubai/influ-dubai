import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaymentsService } from './payments.service';
import { PayoutsService } from './payouts.service';

class FundCampaignDto {
  @IsNumber()
  @Min(1)
  amountUsd!: number;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  successUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  cancelUrl?: string;
}

class UpdatePayoutDto {
  @IsEnum(['PROCESSING', 'PAID', 'FAILED'])
  status!: 'PROCESSING' | 'PAID' | 'FAILED';

  @IsOptional()
  @IsString()
  @MaxLength(140)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly payouts: PayoutsService,
  ) {}

  // ── Brand ─────────────────────────────────────────────────────────────────

  @Post('campaigns/:campaignId/fund')
  fund(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
    @Body() dto: FundCampaignDto,
  ) {
    const base = process.env.FRONTEND_URL ?? 'https://www.infludubai.com';
    return this.payments.fundCampaign(user.id, campaignId, dto.amountUsd, {
      successUrl: dto.successUrl ?? `${base}/dashboard/brand/campaigns/${campaignId}?funded=1`,
      cancelUrl: dto.cancelUrl ?? `${base}/dashboard/brand/campaigns/${campaignId}`,
    });
  }

  @Get('campaigns/:campaignId/payments')
  listCampaignPayments(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
  ) {
    return this.payments.listForCampaign(user.id, campaignId);
  }

  @Get('payments/spend')
  spend(@CurrentUser() user: { id: string }) {
    return this.payments.spendSummary(user.id);
  }

  // ── Creator ───────────────────────────────────────────────────────────────

  @Get('payouts/me')
  myEarnings(@CurrentUser() user: { id: string }) {
    return this.payouts.earningsFor(user.id);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @UseGuards(AdminGuard)
  @Get('admin/payouts')
  adminList(@Query('status') status?: string) {
    return this.payouts.listForAdmin(status);
  }

  @UseGuards(AdminGuard)
  @Patch('admin/payouts/:id')
  adminUpdate(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdatePayoutDto,
  ) {
    return this.payouts.updateStatus(user.id, id, dto.status, {
      reference: dto.reference,
      failureReason: dto.failureReason,
    });
  }

  @UseGuards(AdminGuard)
  @Get('admin/revenue/platform')
  adminRevenue() {
    return this.payments.platformRevenue();
  }
}
