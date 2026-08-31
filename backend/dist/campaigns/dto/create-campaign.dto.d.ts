import { CampaignType } from '@prisma/client';
export declare class CreateCampaignDto {
    title: string;
    description?: string;
    type: CampaignType;
    budgetUsd: number;
    targetAudience?: string;
    targetLocations?: string[];
    targetCategories?: string[];
    deadline?: string;
    requirements?: string;
}
