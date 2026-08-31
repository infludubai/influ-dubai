"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    async onModuleInit() {
        await this.$connect();
        await this.ensureReferenceData();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async ensureReferenceData() {
        try {
            for (const name of Object.values(client_1.RoleName)) {
                await this.role.upsert({
                    where: { name },
                    create: { name, description: `${name} role` },
                    update: {},
                });
            }
            const activated = await this.user.updateMany({
                where: { status: 'PENDING_VERIFICATION' },
                data: { status: 'ACTIVE' },
            });
            if (activated.count > 0) {
                this.logger.log(`Auto-activated ${activated.count} pending account(s)`);
            }
            await this.bootstrapAdmin();
        }
        catch (err) {
            this.logger.error(`Could not ensure role reference data: ${err.message}`);
        }
    }
    async bootstrapAdmin() {
        const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
        if (!email)
            return;
        const adminCount = await this.user.count({ where: { role: { name: 'ADMIN' } } });
        if (adminCount > 0)
            return;
        const user = await this.user.findUnique({ where: { email } });
        if (!user) {
            this.logger.log(`BOOTSTRAP_ADMIN_EMAIL is set to ${email} but no such account exists yet — ` +
                'register with that address and it will be made an admin.');
            return;
        }
        const adminRole = await this.role.findUnique({ where: { name: client_1.RoleName.ADMIN } });
        if (!adminRole)
            return;
        await this.user.update({
            where: { id: user.id },
            data: { roleId: adminRole.id, status: 'ACTIVE' },
        });
        this.logger.warn(`Promoted ${email} to ADMIN via BOOTSTRAP_ADMIN_EMAIL.`);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map