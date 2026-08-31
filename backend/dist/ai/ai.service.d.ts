import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
export interface CreatorInsight {
    qualityScore: number;
    audienceSummary: string;
    strengths: string[];
    contentSuggestions: string[];
    estimatedReach: string;
    bestPlatform: string | null;
    aiGenerated: boolean;
}
export interface CampaignPrediction {
    estimatedReach: number;
    estimatedEngagement: number;
    estimatedConversions: number;
    estimatedCPE: number;
    estimatedROI: number;
    confidence: number;
    matchingCreators: number;
    historicalSampleSize: number;
    narrative: string;
    tips?: string[];
    aiGenerated: boolean;
}
export interface CampaignSuggestion {
    creatorProfileId: string;
    displayName: string;
    reason: string;
    fitScore: number;
    suggestedRate: string;
}
export declare class AiService {
    private readonly prisma;
    private readonly settings;
    private readonly logger;
    private client;
    private clientKey;
    constructor(prisma: PrismaService, settings: SettingsService);
    private get openai();
    private get model();
    analyzeCreator(creatorProfileId: string): Promise<CreatorInsight>;
    private mockCreatorInsight;
    predictCampaign(campaignId: string): Promise<CampaignPrediction>;
    suggestCreators(campaignId: string): Promise<CampaignSuggestion[]>;
    private mockCampaignSuggestions;
}
