"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const prisma_service_1 = require("../prisma/prisma.service");
const settings_service_1 = require("../settings/settings.service");
let HealthController = class HealthController {
    prisma;
    settings;
    startedAt = Date.now();
    constructor(prisma, settings) {
        this.prisma = prisma;
        this.settings = settings;
    }
    live() {
        return {
            status: 'ok',
            uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
        };
    }
    async ready() {
        const checks = {};
        const dbStart = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            checks.database = { ok: true, detail: `${Date.now() - dbStart}ms` };
        }
        catch (err) {
            checks.database = { ok: false, detail: err.message };
        }
        checks.storage = { ok: true };
        checks.ai = { ok: this.settings.has('OPENAI_API_KEY') };
        checks.billing = { ok: this.settings.has('STRIPE_SECRET_KEY') };
        checks.email = { ok: this.settings.has('SMTP_HOST') };
        return {
            status: checks.database.ok ? 'ok' : 'degraded',
            checks,
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
exports.HealthController = HealthController = __decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], HealthController);
//# sourceMappingURL=health.controller.js.map