import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DeliverablesService } from './deliverables.service';
import {
  CreateDeliverableDto,
  ReviewDeliverableDto,
  SubmitDeliverableDto,
  UpdateDeliverableDto,
} from './dto/deliverable.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class DeliverablesController {
  constructor(private readonly deliverables: DeliverablesService) {}

  // ── Brand ─────────────────────────────────────────────────────────────────

  @Post('campaigns/:campaignId/deliverables')
  create(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateDeliverableDto,
  ) {
    return this.deliverables.create(user.id, campaignId, dto);
  }

  @Get('campaigns/:campaignId/deliverables')
  listForCampaign(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
  ) {
    return this.deliverables.listForCampaign(user.id, campaignId);
  }

  @Get('campaigns/:campaignId/deliverables/summary')
  summary(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
  ) {
    return this.deliverables.summaryForCampaign(user.id, campaignId);
  }

  @Get('deliverables/pending-review')
  pendingReview(@CurrentUser() user: { id: string }) {
    return this.deliverables.listPendingReview(user.id);
  }

  @Patch('deliverables/:id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    return this.deliverables.update(user.id, id, dto);
  }

  @Patch('deliverables/:id/review')
  review(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ReviewDeliverableDto,
  ) {
    return this.deliverables.review(user.id, id, dto);
  }

  @Delete('deliverables/:id')
  cancel(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.deliverables.cancel(user.id, id);
  }

  // ── Creator ───────────────────────────────────────────────────────────────

  @Get('deliverables/me')
  listMine(@CurrentUser() user: { id: string }) {
    return this.deliverables.listMine(user.id);
  }

  @Post('deliverables/:id/submit')
  submit(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: SubmitDeliverableDto,
  ) {
    return this.deliverables.submit(user.id, id, dto);
  }
}
