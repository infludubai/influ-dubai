import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BrandsService } from './brands.service';
import { UpsertBrandProfileDto } from './dto/upsert-brand-profile.dto';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.brands.getPublicProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.brands.getMyProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  upsertProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpsertBrandProfileDto,
  ) {
    return this.brands.upsertProfile(user.id, dto);
  }
}
