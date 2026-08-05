import { Logger } from '@nestjs/common';

/**
 * Fail-fast environment check run before the Nest app is created.
 *
 * Required vars abort the boot with an actionable message — far cheaper to
 * diagnose than a 500 on the first request in production. Optional vars only
 * warn: the platform is designed to degrade (mock AI, mock billing, uploads
 * disabled) rather than refuse to start.
 */

const REQUIRED = [
  { key: 'DATABASE_URL', hint: 'PostgreSQL connection string' },
  { key: 'JWT_ACCESS_SECRET', hint: 'secret used to sign access tokens' },
] as const;

const OPTIONAL = [
  { key: 'SUPABASE_URL', feature: 'file uploads' },
  { key: 'SUPABASE_SERVICE_KEY', feature: 'file uploads' },
  { key: 'OPENAI_API_KEY', feature: 'AI insights & fraud scoring (falls back to rule-based)' },
  { key: 'STRIPE_SECRET_KEY', feature: 'billing (falls back to mock mode)' },
  { key: 'SMTP_HOST', feature: 'transactional email (falls back to console logging)' },
] as const;

const WEAK_SECRET_MIN_LENGTH = 32;

export function validateEnv(): void {
  const logger = new Logger('EnvValidation');
  const isProd = process.env.NODE_ENV === 'production';

  const missing = REQUIRED.filter(({ key }) => !process.env[key]?.trim());
  if (missing.length > 0) {
    const lines = missing.map(({ key, hint }) => `  - ${key}  (${hint})`);
    logger.error(
      `Missing required environment variable(s):\n${lines.join('\n')}\n` +
        'Set them in backend/.env locally, or in your host dashboard in production.',
    );
    process.exit(1);
  }

  // A short secret in production is a real vulnerability, not a style issue.
  const secret = process.env.JWT_ACCESS_SECRET ?? '';
  if (secret.length < WEAK_SECRET_MIN_LENGTH) {
    const message =
      `JWT_ACCESS_SECRET is only ${secret.length} characters — use at least ` +
      `${WEAK_SECRET_MIN_LENGTH} (generate one with: openssl rand -base64 48).`;
    if (isProd) {
      logger.error(message);
      process.exit(1);
    }
    logger.warn(message);
  }

  // Without a dedicated key, stored API credentials are encrypted with a key
  // derived from JWT_ACCESS_SECRET — rotating that would strand them all.
  if (isProd && !process.env.SETTINGS_ENCRYPTION_KEY?.trim()) {
    logger.warn(
      'SETTINGS_ENCRYPTION_KEY not set — credentials saved in Admin → Settings ' +
        'will be encrypted with a key derived from JWT_ACCESS_SECRET. Set a dedicated key.',
    );
  }

  if (isProd && !process.env.ALLOWED_ORIGINS?.trim()) {
    logger.error(
      'ALLOWED_ORIGINS must be set in production — it controls which frontend origins may call this API.',
    );
    process.exit(1);
  }

  const disabled = OPTIONAL.filter(({ key }) => !process.env[key]?.trim());
  for (const { key, feature } of disabled) {
    logger.warn(`${key} not set — ${feature} unavailable`);
  }
}
