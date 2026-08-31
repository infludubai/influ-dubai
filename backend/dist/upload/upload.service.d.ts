export type UploadBucket = 'avatars' | 'media-kits' | 'logos' | 'content';
export declare class UploadService {
    private readonly logger;
    private readonly root;
    isConfigured(): boolean;
    uploadFile(buffer: Buffer, originalName: string, bucket: UploadBucket): Promise<string>;
}
