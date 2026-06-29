import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  // Brand: invite creator to campaign
  @Post('campaigns/:campaignId/invitations')
  invite(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitations.invite(user.id, campaignId, dto);
  }

  // Brand: list invitations for a campaign
  @Get('campaigns/:campaignId/invitations')
  listForCampaign(
    @CurrentUser() user: { id: string },
    @Param('campaignId') campaignId: string,
  ) {
    return this.invitations.listForCampaign(user.id, campaignId);
  }

  // Creator: list my invitations
  @Get('invitations/me')
  listMine(@CurrentUser() user: { id: string }) {
    return this.invitations.listForCreator(user.id);
  }

  // Creator: accept or decline
  @Patch('invitations/:id/respond')
  respond(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('status') status: 'ACCEPTED' | 'DECLINED',
  ) {
    return this.invitations.respond(user.id, id, status);
  }
}
