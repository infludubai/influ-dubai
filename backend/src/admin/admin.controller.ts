import {
  Body, Controller, Delete, Get, Param, Patch, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  getStats() {
    return this.admin.getSystemStats();
  }

  @Get('users')
  listUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.admin.listUsers(+page, +limit, role, search, status);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.admin.updateUserStatus(id, status);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.admin.updateUserRole(id, role);
  }

  @Patch('users/:id/features')
  updateUserFeatures(
    @Param('id') id: string,
    @Body() overrides: Record<string, unknown>,
  ) {
    return this.admin.updateUserFeatures(id, overrides);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  @Get('campaigns')
  listCampaigns(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.admin.listCampaigns(+page, +limit, status);
  }

  @Patch('campaigns/:id/status')
  updateCampaignStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.admin.updateCampaignStatus(id, status);
  }

  @Get('revenue')
  getRevenue() {
    return this.admin.getRevenueStats();
  }

  @Get('logs')
  getAuditLog(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.admin.getAuditLog(+page, +limit);
  }
}
