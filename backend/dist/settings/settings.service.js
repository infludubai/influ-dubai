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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const settings_crypto_1 = require("./settings.crypto");
const settings_catalog_1 = require("./settings.catalog");
const MASK_LIKE = /[…�]|\.\.\./;
let SettingsService = SettingsService_1 = class SettingsService {
    prisma;
    audit;
    logger = new common_1.Logger(SettingsService_1.name);
    cache = new Map();
    loaded = false;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async onModuleInit() {
        await this.refresh();
    }
    async refresh() {
        try {
            const rows = await this.prisma.platformSetting.findMany();
            const next = new Map();
            for (const row of rows) {
                if (!(0, settings_catalog_1.isKnownSetting)(row.key))
                    continue;
                try {
                    next.set(row.key, row.isSecret ? (0, settings_crypto_1.decryptSecret)(row.value) : row.value);
                }
                catch {
                    this.logger.error(`Could not decrypt setting "${row.key}" — it must be re-entered in Admin → Settings.`);
                }
            }
            this.cache = next;
            this.loaded = true;
        }
        catch (err) {
            this.logger.warn(`Could not load platform settings (${err.message}) — falling back to environment variables.`);
            this.loaded = true;
        }
    }
    get(key) {
        const stored = this.cache.get(key);
        if (stored?.trim())
            return stored.trim();
        const fromEnv = process.env[key];
        return fromEnv?.trim() ? fromEnv.trim() : undefined;
    }
    getNumber(key, fallback) {
        const raw = this.get(key);
        if (raw === undefined)
            return fallback;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    isOn(key) {
        const raw = this.get(key)?.trim().toLowerCase();
        return raw === 'on' || raw === 'true' || raw === 'yes' || raw === '1';
    }
    sourceOf(key) {
        if (this.cache.get(key)?.trim())
            return 'database';
        if (process.env[key]?.trim())
            return 'environment';
        return 'unset';
    }
    async listForAdmin() {
        if (!this.loaded)
            await this.refresh();
        const rows = await this.prisma.platformSetting
            .findMany({ select: { key: true, updatedAt: true } })
            .catch(() => []);
        const updatedAtByKey = new Map(rows.map((r) => [r.key, r.updatedAt]));
        const settings = settings_catalog_1.SETTING_DEFINITIONS.map((def) => {
            const effective = this.get(def.key);
            const source = this.sourceOf(def.key);
            return {
                key: def.key,
                label: def.label,
                group: def.group,
                isSecret: def.isSecret,
                placeholder: def.placeholder,
                help: def.help,
                numeric: def.numeric,
                value: effective
                    ? def.isSecret
                        ? (0, settings_crypto_1.maskSecret)(effective)
                        : effective
                    : '',
                configured: Boolean(effective),
                source,
                updatedAt: updatedAtByKey.get(def.key)?.toISOString() ?? null,
            };
        });
        return { groups: settings_catalog_1.SETTING_GROUPS, settings };
    }
    async set(key, rawValue, actorId) {
        const def = (0, settings_catalog_1.getDefinition)(key);
        if (!def)
            throw new common_1.BadRequestException(`Unknown setting: ${key}`);
        const value = rawValue?.trim() ?? '';
        if (value && def.numeric && !Number.isFinite(Number(value))) {
            throw new common_1.BadRequestException(`${def.label} must be a number`);
        }
        if (def.isSecret && value) {
            const current = this.cache.get(key);
            if (current && value === (0, settings_crypto_1.maskSecret)(current))
                return;
            if (MASK_LIKE.test(value)) {
                throw new common_1.BadRequestException(`${def.label} looks like the masked placeholder rather than a real value. Clear the field and paste the full key.`);
            }
        }
        if (!value) {
            await this.prisma.platformSetting
                .delete({ where: { key } })
                .catch(() => undefined);
            this.cache.delete(key);
        }
        else {
            const stored = def.isSecret ? (0, settings_crypto_1.encryptSecret)(value) : value;
            await this.prisma.platformSetting.upsert({
                where: { key },
                create: { key, value: stored, isSecret: def.isSecret, updatedById: actorId },
                update: { value: stored, isSecret: def.isSecret, updatedById: actorId },
            });
            this.cache.set(key, value);
        }
        this.audit.log({
            userId: actorId,
            action: value ? 'settings.update' : 'settings.clear',
            resource: 'platform_setting',
            resourceId: key,
            meta: { group: def.group, isSecret: def.isSecret },
        });
    }
    async setMany(values, actorId) {
        for (const [key, value] of Object.entries(values)) {
            await this.set(key, value, actorId);
        }
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map