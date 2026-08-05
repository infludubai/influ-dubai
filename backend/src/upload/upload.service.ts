import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { SettingsService } from '../settings/settings.service';

export type UploadBucket = 'avatars' | 'media-kits' | 'logos';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private client: SupabaseClient | null = null;
  private clientKey = '';

  constructor(private readonly settings: SettingsService) {}

  isConfigured(): boolean {
    const { url, key } = this.credentials();
    return Boolean(url && key);
  }

  private credentials() {
    return {
      url: this.settings.get('SUPABASE_URL') ?? '',
      key: this.settings.get('SUPABASE_SERVICE_KEY') ?? '',
    };
  }

  /**
   * Built on first use rather than at construction, so the app still boots
   * without storage credentials — only the upload endpoints degrade. The
   * cached client is rebuilt if the credentials change at runtime.
   */
  private supabase(): SupabaseClient {
    const { url, key } = this.credentials();
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'File storage is not configured. Add Supabase credentials in Admin → Settings → Integrations.',
      );
    }
    const fingerprint = `${url}:${key}`;
    if (!this.client || this.clientKey !== fingerprint) {
      this.client = createClient(url, key);
      this.clientKey = fingerprint;
    }
    return this.client;
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    bucket: UploadBucket,
  ): Promise<string> {
    const client = this.supabase();
    const ext = path.extname(originalName).toLowerCase();
    const fileName = `${randomUUID()}${ext}`;

    const { error } = await client.storage.from(bucket).upload(fileName, buffer, {
      contentType: this.mimeType(ext),
      upsert: false,
    });

    if (error) throw new InternalServerErrorException(error.message);

    const { data } = client.storage.from(bucket).getPublicUrl(fileName);
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
