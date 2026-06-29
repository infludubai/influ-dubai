import { IsOptional, IsString } from 'class-validator';

export class UpsertBrandProfileDto {
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
