import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsObject, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SettingsService } from './settings.service';
import { SettingsTester } from './settings.tester';
import { SettingGroupId } from './settings.catalog';

class UpdateSettingsDto {
  @IsObject()
  values!: Record<string, string>;
}

class TestConnectionDto {
  @IsString()
  group!: string;
}

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly tester: SettingsTester,
  ) {}

  @Get()
  list() {
    return this.settings.listForAdmin();
  }

  @Put()
  async update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.settings.setMany(dto.values, user.id);
    return this.settings.listForAdmin();
  }

  @Post('test/:group')
  test(@Param('group') group: string, @CurrentUser() user: { id: string }) {
    return this.tester.test(group as SettingGroupId, user.id);
  }
}
