import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertCreatorProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minRateUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRateUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAudienceSize?: number;
}
