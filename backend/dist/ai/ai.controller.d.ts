import { AiService } from './ai.service';
export declare class AiController {
    private readonly ai;
    constructor(ai: AiService);
    analyzeCreator(id: string): Promise<import("./ai.service").CreatorInsight>;
    getInsights(id: string): Promise<import("./ai.service").CreatorInsight>;
    suggestCreators(id: string): Promise<import("./ai.service").CampaignSuggestion[]>;
    predictCampaign(id: string): Promise<import("./ai.service").CampaignPrediction>;
}
