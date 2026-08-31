import { CampaignStatus, CampaignType } from '@prisma/client';
export declare class UpdateCampaignDto {
    title?: string;
    description?: string;
    type?: CampaignType;
    status?: CampaignStatus;
    budgetUsd?: number;
    targetAudience?: string;
    targetLocations?: string[];
    targetCategories?: string[];
    deadline?: string;
    requirements?: string;
}
