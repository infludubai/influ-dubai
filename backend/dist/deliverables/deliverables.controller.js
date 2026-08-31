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
exports.DeliverablesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const deliverables_service_1 = require("./deliverables.service");
const deliverable_dto_1 = require("./dto/deliverable.dto");
let DeliverablesController = class DeliverablesController {
    deliverables;
    constructor(deliverables) {
        this.deliverables = deliverables;
    }
    create(user, campaignId, dto) {
        return this.deliverables.create(user.id, campaignId, dto);
    }
    listForCampaign(user, campaignId) {
        return this.deliverables.listForCampaign(user.id, campaignId);
    }
    summary(user, campaignId) {
        return this.deliverables.summaryForCampaign(user.id, campaignId);
    }
    pendingReview(user) {
        return this.deliverables.listPendingReview(user.id);
    }
    update(user, id, dto) {
        return this.deliverables.update(user.id, id, dto);
    }
    review(user, id, dto) {
        return this.deliverables.review(user.id, id, dto);
    }
    cancel(user, id) {
        return this.deliverables.cancel(user.id, id);
    }
    listMine(user) {
        return this.deliverables.listMine(user.id);
    }
    submit(user, id, dto) {
        return this.deliverables.submit(user.id, id, dto);
    }
};
exports.DeliverablesController = DeliverablesController;
__decorate([
    (0, common_1.Post)('campaigns/:campaignId/deliverables'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, deliverable_dto_1.CreateDeliverableDto]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('campaigns/:campaignId/deliverables'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "listForCampaign", null);
__decorate([
    (0, common_1.Get)('campaigns/:campaignId/deliverables/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('deliverables/pending-review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "pendingReview", null);
__decorate([
    (0, common_1.Patch)('deliverables/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, deliverable_dto_1.UpdateDeliverableDto]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('deliverables/:id/review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, deliverable_dto_1.ReviewDeliverableDto]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "review", null);
__decorate([
    (0, common_1.Delete)('deliverables/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('deliverables/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "listMine", null);
__decorate([
    (0, common_1.Post)('deliverables/:id/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, deliverable_dto_1.SubmitDeliverableDto]),
    __metadata("design:returntype", void 0)
], DeliverablesController.prototype, "submit", null);
exports.DeliverablesController = DeliverablesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [deliverables_service_1.DeliverablesService])
], DeliverablesController);
//# sourceMappingURL=deliverables.controller.js.map