import { Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';

/**
 * AES-256-GCM encryption for secrets held in the database.
 *
 * API keys stored in `platform_settings` must never be readable from a
 * database dump alone — the key material lives only in the process
 * environment. GCM is used rather than CBC so tampering is detected on
 * decrypt via the auth tag instead of silently yielding garbage.
 *
 * Stored format: v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>
 */

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const IV_LENGTH = 12; // 96-bit nonce, the GCM-recommended size
const KEY_LENGTH = 32;
const SCRYPT_SALT = 'infludubai.platform-settings.v1';

const logger = new Logger('SettingsCrypto');
let cachedKey: Buffer | null = null;

function derivedKey(): Buffer {
  if (cachedKey) return cachedKey;

  const explicit = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  const fallback = process.env.JWT_ACCESS_SECRET?.trim();

  if (!explicit) {
    if (!fallback) {
      throw new Error(
        'Cannot encrypt settings: set SETTINGS_ENCRYPTION_KEY (generate with: openssl rand -base64 32).',
      );
    }
    // Usable locally, but rotating the JWT secret would strand every stored
    // secret — loud enough that it gets set properly before production.
    logger.warn(
      'SETTINGS_ENCRYPTION_KEY not set — deriving from JWT_ACCESS_SECRET. ' +
        'Set a dedicated key in production; changing JWT_ACCESS_SECRET would make stored API keys unreadable.',
    );
  }

  cachedKey = scryptSync(explicit ?? fallback!, SCRYPT_SALT, KEY_LENGTH);
  return cachedKey;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, derivedKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString('hex'),
    authTag.toString('hex'),
    ciphertext.toString('hex'),
  ].join(':');
}

export function decryptSecret(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Stored secret is not in the expected encrypted format');
  }
  const [, ivHex, authTagHex, ciphertextHex] = parts;
  const decipher = createDecipheriv(
    ALGORITHM,
    derivedKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(`${VERSION}:`);
}

/**
 * Shows enough of a key to confirm which one is configured, without
 * revealing anything usable. `sk_live_51H...9xQz` → `sk_live_5…9xQz`
 */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 8) return '••••••••';
  return `${plaintext.slice(0, 8)}…${plaintext.slice(-4)}`;
}

/** Constant-time comparison, for webhook signatures and similar checks. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
