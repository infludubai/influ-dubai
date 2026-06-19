import { randomBytes, createHash } from 'crypto';

/**
 * Generates a random opaque token (sent to the user via link/header) and
 * its SHA-256 hash (what we persist). We never store the raw token —
 * mirrors how password reset/verification tokens should be handled so a
 * DB read alone can't be used to impersonate a user.
 */
export function generateOpaqueToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
