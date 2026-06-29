import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MessagingService } from './messaging.service';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.messaging.listConversations(user.id);
  }

  @Post('with/:otherUserId')
  start(
    @CurrentUser() user: { id: string },
    @Param('otherUserId') otherId: string,
  ) {
    return this.messaging.getOrCreateConversation(user.id, otherId);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.messaging.getMessages(user.id, id);
  }

  @Post(':id/messages')
  send(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.messaging.sendMessage(user.id, id, content);
  }
}
