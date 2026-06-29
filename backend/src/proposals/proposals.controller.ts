import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProposalsController {
  constructor(private readonly proposals: ProposalsService) {}

  // Creator: submit proposal to a campaign
  @Post('campaigns/:campaignId/proposals')
  submit(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposals.submit(user.id, campaignId, dto);
  }

  // Brand: list proposals for a campaign
  @Get('campaigns/:campaignId/proposals')
  listForCampaign(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
  ) {
    return this.proposals.listForCampaign(user.id, campaignId);
  }

  // Creator: list my proposals
  @Get('proposals/me')
  listMine(@CurrentUser() user: { id: string }) {
    return this.proposals.listMine(user.id);
  }

  // Brand: accept or reject a proposal
  @Patch('proposals/:id/respond')
  respond(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('status') status: 'ACCEPTED' | 'REJECTED',
  ) {
    return this.proposals.respond(user.id, id, status);
  }

  // Creator: withdraw a proposal
  @Patch('proposals/:id/withdraw')
  withdraw(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.proposals.withdraw(user.id, id);
  }
}
