"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const common_1 = require("@nestjs/common");
const REQUIRED = [
    { key: 'DATABASE_URL', hint: 'MySQL connection string (composed from DB_* on GoDaddy)' },
    { key: 'JWT_ACCESS_SECRET', hint: 'secret used to sign access tokens' },
];
const OPTIONAL = [
    { key: 'OPENAI_API_KEY', feature: 'AI insights & fraud scoring (falls back to rule-based)' },
    { key: 'STRIPE_SECRET_KEY', feature: 'billing (falls back to mock mode)' },
    { key: 'SMTP_HOST', feature: 'transactional email (falls back to console logging)' },
];
const WEAK_SECRET_MIN_LENGTH = 32;
function validateEnv() {
    const logger = new common_1.Logger('EnvValidation');
    const isProd = process.env.NODE_ENV === 'production';
    const missing = REQUIRED.filter(({ key }) => !process.env[key]?.trim());
    if (missing.length > 0) {
        const lines = missing.map(({ key, hint }) => `  - ${key}  (${hint})`);
        logger.error(`Missing required environment variable(s):\n${lines.join('\n')}\n` +
            'Set them in backend/.env locally, or in your host dashboard in production.');
        process.exit(1);
    }
    const secret = process.env.JWT_ACCESS_SECRET ?? '';
    if (secret.length < WEAK_SECRET_MIN_LENGTH) {
        const message = `JWT_ACCESS_SECRET is only ${secret.length} characters — use at least ` +
            `${WEAK_SECRET_MIN_LENGTH} (generate one with: openssl rand -base64 48).`;
        if (isProd) {
            logger.error(message);
            process.exit(1);
        }
        logger.warn(message);
    }
    if (isProd && !process.env.SETTINGS_ENCRYPTION_KEY?.trim()) {
        logger.warn('SETTINGS_ENCRYPTION_KEY not set — credentials saved in Admin → Settings ' +
            'will be encrypted with a key derived from JWT_ACCESS_SECRET. Set a dedicated key.');
    }
    if (isProd && !process.env.ALLOWED_ORIGINS?.trim()) {
        logger.log('ALLOWED_ORIGINS not set — using the built-in production origins only.');
    }
    const disabled = OPTIONAL.filter(({ key }) => !process.env[key]?.trim());
    for (const { key, feature } of disabled) {
        logger.warn(`${key} not set — ${feature} unavailable`);
    }
}
//# sourceMappingURL=env.validation.js.map