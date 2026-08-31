declare const PLATFORMS: readonly ["INSTAGRAM", "TIKTOK", "YOUTUBE", "LINKEDIN", "X"];
export declare class CreateDeliverableDto {
    creatorProfileId: string;
    title: string;
    description?: string;
    platform?: (typeof PLATFORMS)[number];
    dueDate?: string;
    agreedRateUsd?: number;
}
export declare class UpdateDeliverableDto {
    title?: string;
    description?: string;
    dueDate?: string;
    agreedRateUsd?: number;
}
export declare class SubmitDeliverableDto {
    contentUrl?: string;
    fileUrl?: string;
    note?: string;
}
export declare class ReviewDeliverableDto {
    outcome: 'APPROVED' | 'CHANGES_REQUESTED';
    feedback?: string;
}
export {};
