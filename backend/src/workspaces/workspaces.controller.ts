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
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WorkspacesService } from './workspaces.service';

const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER', 'VIEWER'] as const;

class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  industry?: string;
}

class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(ASSIGNABLE_ROLES)
  role!: (typeof ASSIGNABLE_ROLES)[number];
}

class UpdateRoleDto {
  @IsEnum(ASSIGNABLE_ROLES)
  role!: (typeof ASSIGNABLE_ROLES)[number];
}

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.workspaces.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(user.id, dto.companyName, dto.industry);
  }

  @Post(':id/switch')
  switch(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.workspaces.switchActive(user.id, id);
  }

  @Get(':id/members')
  members(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.workspaces.listMembers(user.id, id);
  }

  @Post(':id/members')
  invite(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspaces.invite(user.id, id, dto.email, dto.role as WorkspaceRole);
  }

  @Patch(':id/members/:memberId')
  updateRole(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.workspaces.updateRole(user.id, id, memberId, dto.role as WorkspaceRole);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspaces.removeMember(user.id, id, memberId);
  }
}
