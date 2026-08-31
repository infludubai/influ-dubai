import { SocialPlatform } from '@prisma/client';
export declare class UpsertSocialAccountDto {
    platform: SocialPlatform;
    handle: string;
    followersCount?: number;
    engagementRate?: number;
    profileUrl?: string;
}
