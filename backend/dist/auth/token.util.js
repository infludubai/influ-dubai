"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpaqueToken = generateOpaqueToken;
exports.hashToken = hashToken;
const crypto_1 = require("crypto");
function generateOpaqueToken() {
    const raw = (0, crypto_1.randomBytes)(32).toString('hex');
    return { raw, hash: hashToken(raw) };
}
function hashToken(raw) {
    return (0, crypto_1.createHash)('sha256').update(raw).digest('hex');
}
//# sourceMappingURL=token.util.js.map