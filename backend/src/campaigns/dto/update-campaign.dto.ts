import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CampaignStatus, CampaignType } from '@prisma/client';

export class UpdateCampaignDto {
  @IsOptional() @IsString()   title?: string;
  @IsOptional() @IsString()   description?: string;
  @IsOptional() @IsEnum(CampaignType) type?: CampaignType;
  @IsOptional() @IsEnum(CampaignStatus) status?: CampaignStatus;
  @IsOptional() @IsNumber() @Min(0) budgetUsd?: number;
  @IsOptional() @IsString()   targetAudience?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) targetLocations?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) targetCategories?: string[];
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsString()   requirements?: string;
}
