import {
  IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { CampaignType } from '@prisma/client';

export class CreateCampaignDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsNumber()
  @Min(0)
  budgetUsd: number;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetLocations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCategories?: string[];

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  requirements?: string;
}
