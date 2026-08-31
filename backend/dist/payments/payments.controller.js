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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../admin/admin.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const payments_service_1 = require("./payments.service");
const payouts_service_1 = require("./payouts.service");
class FundCampaignDto {
    amountUsd;
    successUrl;
    cancelUrl;
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FundCampaignDto.prototype, "amountUsd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false, require_protocol: true }),
    __metadata("design:type", String)
], FundCampaignDto.prototype, "successUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false, require_protocol: true }),
    __metadata("design:type", String)
], FundCampaignDto.prototype, "cancelUrl", void 0);
class UpdatePayoutDto {
    status;
    reference;
    failureReason;
}
__decorate([
    (0, class_validator_1.IsEnum)(['PROCESSING', 'PAID', 'FAILED']),
    __metadata("design:type", String)
], UpdatePayoutDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(140),
    __metadata("design:type", String)
], UpdatePayoutDto.prototype, "reference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdatePayoutDto.prototype, "failureReason", void 0);
let PaymentsController = class PaymentsController {
    payments;
    payouts;
    constructor(payments, payouts) {
        this.payments = payments;
        this.payouts = payouts;
    }
    fund(user, campaignId, dto) {
        const base = process.env.FRONTEND_URL ?? 'https://www.infludubai.com';
        return this.payments.fundCampaign(user.id, campaignId, dto.amountUsd, {
            successUrl: dto.successUrl ?? `${base}/dashboard/brand/campaigns/${campaignId}?funded=1`,
            cancelUrl: dto.cancelUrl ?? `${base}/dashboard/brand/campaigns/${campaignId}`,
        });
    }
    listCampaignPayments(user, campaignId) {
        return this.payments.listForCampaign(user.id, campaignId);
    }
    spend(user) {
        return this.payments.spendSummary(user.id);
    }
    myEarnings(user) {
        return this.payouts.earningsFor(user.id);
    }
    adminList(status) {
        return this.payouts.listForAdmin(status);
    }
    adminUpdate(user, id, dto) {
        return this.payouts.updateStatus(user.id, id, dto.status, {
            reference: dto.reference,
            failureReason: dto.failureReason,
        });
    }
    adminRevenue() {
        return this.payments.platformRevenue();
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('campaigns/:campaignId/fund'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, FundCampaignDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "fund", null);
__decorate([
    (0, common_1.Get)('campaigns/:campaignId/payments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "listCampaignPayments", null);
__decorate([
    (0, common_1.Get)('payments/spend'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "spend", null);
__decorate([
    (0, common_1.Get)('payouts/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "myEarnings", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('admin/payouts'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "adminList", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Patch)('admin/payouts/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdatePayoutDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "adminUpdate", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('admin/revenue/platform'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "adminRevenue", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        payouts_service_1.PayoutsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map