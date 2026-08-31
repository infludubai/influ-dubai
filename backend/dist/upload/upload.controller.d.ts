import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploads;
    constructor(uploads: UploadService);
    upload(file: Express.Multer.File, bucket: string, user: {
        id: string;
        role: string;
    }): Promise<{
        url: string;
    }>;
}
