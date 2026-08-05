import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { VerificationService } from './verification.service';
import { ReviewsService } from './reviews.service';
import { ShortlistsService } from './shortlists.service';

class RequestVerificationDto {
  @IsOptional()
  @IsUrl({ require_protocol: true })
  evidenceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

class DecideVerificationDto {
  @IsEnum(['VERIFIED', 'REJECTED'])
  decision!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  /** Required for brand→creator reviews; ignored otherwise. */
  @IsOptional()
  @IsString()
  creatorProfileId?: string;
}

class AddShortlistDto {
  @IsString()
  creatorProfileId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  listName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class TrustController {
  constructor(
    private readonly verification: VerificationService,
    private readonly reviews: ReviewsService,
    private readonly shortlists: ShortlistsService,
  ) {}

  // ── Verification ──────────────────────────────────────────────────────────

  @Post('verification/request')
  requestVerification(
    @CurrentUser() user: { id: string },
    @Body() dto: RequestVerificationDto,
  ) {
    return this.verification.request(user.id, dto.evidenceUrl, dto.note);
  }

  @Get('verification/me')
  myVerification(@CurrentUser() user: { id: string }) {
    return this.verification.myStatus(user.id);
  }

  @UseGuards(AdminGuard)
  @Get('admin/verification')
  listVerification(@Query('status') status = 'PENDING') {
    return this.verification.listForAdmin(status);
  }

  @UseGuards(AdminGuard)
  @Get('admin/verification/stats')
  verificationStats() {
    return this.verification.queueStats();
  }

  @UseGuards(AdminGuard)
  @Patch('admin/verification/:id')
  decideVerification(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: DecideVerificationDto,
  ) {
    return this.verification.decide(user.id, id, dto.decision, dto.reason);
  }

  // ── Reviews ───────────────────────────────────────────────────────────────

  @Post('campaigns/:campaignId/reviews/creator')
  reviewCreator(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.createFromBrand(
      user.id,
      campaignId,
      dto.creatorProfileId!,
      dto.rating,
      dto.comment,
    );
  }

  @Post('campaigns/:campaignId/reviews/brand')
  reviewBrand(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.createFromCreator(user.id, campaignId, dto.rating, dto.comment);
  }

  @Get('reviews/pending')
  pendingReviews(@CurrentUser() user: { id: string }) {
    return this.reviews.pendingForBrand(user.id);
  }

  // ── Shortlists ────────────────────────────────────────────────────────────

  @Get('shortlists')
  listShortlist(@CurrentUser() user: { id: string }) {
    return this.shortlists.list(user.id);
  }

  @Get('shortlists/ids')
  shortlistIds(@CurrentUser() user: { id: string }) {
    return this.shortlists.savedIds(user.id);
  }

  @Post('shortlists')
  addShortlist(@CurrentUser() user: { id: string }, @Body() dto: AddShortlistDto) {
    return this.shortlists.add(user.id, dto.creatorProfileId, dto.listName, dto.note);
  }

  @Delete('shortlists/:creatorProfileId')
  removeShortlist(
    @CurrentUser() user: { id: string },
    @Param('creatorProfileId') id: string,
  ) {
    return this.shortlists.remove(user.id, id);
  }
}
