import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { IsObject } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ContentService } from './content.service';

class UpdateContentDto {
  @IsObject()
  values!: Record<string, string>;
}

/**
 * Public copy feed. Unauthenticated and throttle-exempt: every marketing page
 * render calls it, and rate-limiting the site's own text would take the
 * homepage down under modest traffic.
 */
@SkipThrottle()
@Controller('content')
export class PublicContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  get() {
    return this.content.getPublic();
  }
}

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  list() {
    return this.content.listForAdmin();
  }

  @Put()
  update(@Body() dto: UpdateContentDto, @CurrentUser() user: { id: string }) {
    return this.content.setMany(dto.values, user.id);
  }

  @Post('reset/:page')
  resetPage(@Param('page') page: string, @CurrentUser() user: { id: string }) {
    return this.content.resetPage(page, user.id);
  }
}
