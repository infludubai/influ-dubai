import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

export type UploadBucket = 'avatars' | 'media-kits' | 'logos';

/**
 * Stores uploads on the application's own disk.
 *
 * GoDaddy keeps uploaded files across deploys — "re-uploading code or pulling
 * from GitHub never deletes them" — so there is no reason to depend on an
 * external object store for avatars, logos and media kits. Serving them from
 * the same origin as the site also means no CORS and no public bucket to
 * misconfigure.
 *
 * main.ts exposes this directory at /uploads.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly root = path.join(process.cwd(), 'uploads');

  /** Local disk is always available; kept so callers need no special-casing. */
  isConfigured(): boolean {
    return true;
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    bucket: UploadBucket,
  ): Promise<string> {
    // The name comes from the client, so only the extension is trusted — and
    // only after stripping any path it may be carrying.
    const ext = path.extname(path.basename(originalName)).toLowerCase();
    const fileName = `${randomUUID()}${ext}`;
    const dir = path.join(this.root, bucket);

    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, fileName), buffer);
    } catch (err) {
      this.logger.error(`Could not store upload: ${(err as Error).message}`);
      throw new InternalServerErrorException('Could not store the uploaded file.');
    }

    // Relative on purpose: the site and its API are one origin, so this URL is
    // correct on every domain the app is served from.
    return `/uploads/${bucket}/${fileName}`;
  }
}
