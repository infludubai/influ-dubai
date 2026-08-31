"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const creators_module_1 = require("./creators/creators.module");
const brands_module_1 = require("./brands/brands.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const notifications_module_1 = require("./notifications/notifications.module");
const invitations_module_1 = require("./invitations/invitations.module");
const proposals_module_1 = require("./proposals/proposals.module");
const messaging_module_1 = require("./messaging/messaging.module");
const analytics_module_1 = require("./analytics/analytics.module");
const ai_module_1 = require("./ai/ai.module");
const billing_module_1 = require("./billing/billing.module");
const admin_module_1 = require("./admin/admin.module");
const audit_module_1 = require("./audit/audit.module");
const fraud_module_1 = require("./fraud/fraud.module");
const upload_module_1 = require("./upload/upload.module");
const settings_module_1 = require("./settings/settings.module");
const deliverables_module_1 = require("./deliverables/deliverables.module");
const payments_module_1 = require("./payments/payments.module");
const trust_module_1 = require("./trust/trust.module");
const workspaces_module_1 = require("./workspaces/workspaces.module");
const contact_module_1 = require("./contact/contact.module");
const health_module_1 = require("./health/health.module");
const content_module_1 = require("./content/content.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            audit_module_1.AuditModule,
            settings_module_1.SettingsModule,
            content_module_1.ContentModule,
            workspaces_module_1.WorkspacesModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            creators_module_1.CreatorsModule,
            brands_module_1.BrandsModule,
            campaigns_module_1.CampaignsModule,
            notifications_module_1.NotificationsModule,
            invitations_module_1.InvitationsModule,
            proposals_module_1.ProposalsModule,
            deliverables_module_1.DeliverablesModule,
            payments_module_1.PaymentsModule,
            trust_module_1.TrustModule,
            contact_module_1.ContactModule,
            messaging_module_1.MessagingModule,
            analytics_module_1.AnalyticsModule,
            ai_module_1.AiModule,
            billing_module_1.BillingModule,
            admin_module_1.AdminModule,
            fraud_module_1.FraudModule,
            upload_module_1.UploadModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map