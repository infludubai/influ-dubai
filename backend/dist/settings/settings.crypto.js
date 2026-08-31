"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
exports.isEncrypted = isEncrypted;
exports.maskSecret = maskSecret;
exports.safeEqual = safeEqual;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SCRYPT_SALT = 'infludubai.platform-settings.v1';
const logger = new common_1.Logger('SettingsCrypto');
let cachedKey = null;
function derivedKey() {
    if (cachedKey)
        return cachedKey;
    const explicit = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
    const fallback = process.env.JWT_ACCESS_SECRET?.trim();
    if (!explicit) {
        if (!fallback) {
            throw new Error('Cannot encrypt settings: set SETTINGS_ENCRYPTION_KEY (generate with: openssl rand -base64 32).');
        }
        logger.warn('SETTINGS_ENCRYPTION_KEY not set — deriving from JWT_ACCESS_SECRET. ' +
            'Set a dedicated key in production; changing JWT_ACCESS_SECRET would make stored API keys unreadable.');
    }
    cachedKey = (0, crypto_1.scryptSync)(explicit ?? fallback, SCRYPT_SALT, KEY_LENGTH);
    return cachedKey;
}
function encryptSecret(plaintext) {
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, derivedKey(), iv);
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
function decryptSecret(stored) {
    const parts = stored.split(':');
    if (parts.length !== 4 || parts[0] !== VERSION) {
        throw new Error('Stored secret is not in the expected encrypted format');
    }
    const [, ivHex, authTagHex, ciphertextHex] = parts;
    const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, derivedKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return Buffer.concat([
        decipher.update(Buffer.from(ciphertextHex, 'hex')),
        decipher.final(),
    ]).toString('utf8');
}
function isEncrypted(value) {
    return value.startsWith(`${VERSION}:`);
}
function maskSecret(plaintext) {
    if (plaintext.length <= 8)
        return '••••••••';
    return `${plaintext.slice(0, 8)}…${plaintext.slice(-4)}`;
}
function safeEqual(a, b) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(bufA, bufB);
}
//# sourceMappingURL=settings.crypto.js.map