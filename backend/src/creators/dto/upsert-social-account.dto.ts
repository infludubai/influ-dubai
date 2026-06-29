import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SocialPlatform } from '@prisma/client';

export class UpsertSocialAccountDto {
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @IsString()
  handle: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  followersCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  engagementRate?: number;

  @IsOptional()
  @IsString()
  profileUrl?: string;
}
