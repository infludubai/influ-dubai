import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'X'] as const;

export class CreateDeliverableDto {
  @IsString()
  creatorProfileId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(140)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(PLATFORMS)
  platform?: (typeof PLATFORMS)[number];

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  agreedRateUsd?: number;
}

export class UpdateDeliverableDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  agreedRateUsd?: number;
}

export class SubmitDeliverableDto {
  @IsOptional()
  @IsUrl({ require_protocol: true })
  contentUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ReviewDeliverableDto {
  @IsEnum(['APPROVED', 'CHANGES_REQUESTED'])
  outcome!: 'APPROVED' | 'CHANGES_REQUESTED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}
