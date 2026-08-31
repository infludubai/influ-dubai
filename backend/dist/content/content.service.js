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
var ContentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const content_catalog_1 = require("./content.catalog");
let ContentService = ContentService_1 = class ContentService {
    prisma;
    audit;
    logger = new common_1.Logger(ContentService_1.name);
    cache = (0, content_catalog_1.defaults)();
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async onModuleInit() {
        await this.refresh();
    }
    async refresh() {
        const merged = (0, content_catalog_1.defaults)();
        try {
            const rows = await this.prisma.siteContent.findMany();
            for (const row of rows) {
                if (row.key in merged)
                    merged[row.key] = row.value;
            }
        }
        catch (err) {
            this.logger.warn(`Could not load site content (${err.message}) — serving built-in defaults.`);
        }
        this.cache = merged;
    }
    getPublic() {
        return this.cache;
    }
    async listForAdmin() {
        const rows = await this.prisma.siteContent
            .findMany({ select: { key: true, updatedAt: true } })
            .catch(() => []);
        const updatedAt = new Map(rows.map((r) => [r.key, r.updatedAt]));
        return {
            pages: content_catalog_1.CONTENT_PAGES,
            fields: content_catalog_1.CONTENT_FIELDS.map((f) => ({
                key: f.key,
                label: f.label,
                page: f.page,
                section: f.section,
                type: f.type,
                help: f.help,
                columns: f.columns,
                value: this.cache[f.key] ?? f.default,
                defaultValue: f.default,
                customised: this.cache[f.key] !== f.default,
                updatedAt: updatedAt.get(f.key)?.toISOString() ?? null,
            })),
        };
    }
    async set(key, rawValue, actorId) {
        const field = (0, content_catalog_1.getField)(key);
        if (!field)
            throw new common_1.BadRequestException(`Unknown content key: ${key}`);
        const value = (rawValue ?? '').trim();
        if (field.type === 'number' && value && !Number.isFinite(Number(value))) {
            throw new common_1.BadRequestException(`${field.label} must be a number.`);
        }
        if (field.type === 'rows' && value) {
            const expected = field.columns?.length ?? 2;
            const bad = value
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
                .findIndex((line) => line.split('|').length !== expected);
            if (bad !== -1) {
                throw new common_1.BadRequestException(`${field.label}: line ${bad + 1} must have ${expected} values separated by "|" (${field.columns?.join(', ')}).`);
            }
        }
        if (!value || value === field.default) {
            await this.prisma.siteContent.deleteMany({ where: { key } });
            this.cache[key] = field.default;
        }
        else {
            await this.prisma.siteContent.upsert({
                where: { key },
                create: { key, value, updatedById: actorId },
                update: { value, updatedById: actorId },
            });
            this.cache[key] = value;
        }
        this.audit.log({
            userId: actorId,
            action: value ? 'content.update' : 'content.reset',
            resource: 'site_content',
            resourceId: key,
            meta: { page: field.page, section: field.section },
        });
    }
    async setMany(values, actorId) {
        for (const [key, value] of Object.entries(values)) {
            await this.set(key, value, actorId);
        }
        return this.listForAdmin();
    }
    async resetPage(page, actorId) {
        const keys = content_catalog_1.CONTENT_FIELDS.filter((f) => f.page === page).map((f) => f.key);
        if (keys.length === 0)
            throw new common_1.BadRequestException(`Unknown page: ${page}`);
        await this.prisma.siteContent.deleteMany({ where: { key: { in: keys } } });
        for (const key of keys)
            this.cache[key] = (0, content_catalog_1.getField)(key).default;
        this.audit.log({
            userId: actorId,
            action: 'content.reset_page',
            resource: 'site_content',
            resourceId: page,
        });
        return this.listForAdmin();
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = ContentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ContentService);
//# sourceMappingURL=content.service.js.map