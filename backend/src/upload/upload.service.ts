import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class UploadService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    bucket: 'avatars' | 'media-kits' | 'logos',
  ): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();
    const fileName = `${randomUUID()}${ext}`;

    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: this.mimeType(ext),
        upsert: false,
      });

    if (error) throw new InternalServerErrorException(error.message);

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  }

  private mimeType(ext: string): string {
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
    };
    return map[ext] ?? 'application/octet-stream';
  }
}
