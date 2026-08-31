import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UploadService } from './upload.service';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_PDF   = ['application/pdf'];

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploads: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('bucket') bucket: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    if (!file) throw new BadRequestException('No file provided');

    // 'content' holds images embedded in the public website, so only admins
    // may write to it — anything there is effectively published.
    if (bucket === 'content' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can upload website content images.');
    }

    const validBuckets = ['avatars', 'media-kits', 'logos', 'content'];
    if (!validBuckets.includes(bucket)) {
      throw new BadRequestException(`bucket must be one of: ${validBuckets.join(', ')}`);
    }

    const allowed = bucket === 'media-kits' ? [...ALLOWED_IMAGE, ...ALLOWED_PDF] : ALLOWED_IMAGE;
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(`File type not allowed: ${file.mimetype}`);
    }

    const url = await this.uploads.uploadFile(
      file.buffer,
      file.originalname,
      bucket as 'avatars' | 'media-kits' | 'logos' | 'content',
    );

    return { url };
  }
}
