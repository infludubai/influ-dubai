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
exports.AdminContentController = exports.PublicContentController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../admin/admin.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const content_service_1 = require("./content.service");
class UpdateContentDto {
    values;
}
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateContentDto.prototype, "values", void 0);
let PublicContentController = class PublicContentController {
    content;
    constructor(content) {
        this.content = content;
    }
    get() {
        return this.content.getPublic();
    }
};
exports.PublicContentController = PublicContentController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicContentController.prototype, "get", null);
exports.PublicContentController = PublicContentController = __decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Controller)('content'),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], PublicContentController);
let AdminContentController = class AdminContentController {
    content;
    constructor(content) {
        this.content = content;
    }
    list() {
        return this.content.listForAdmin();
    }
    update(dto, user) {
        return this.content.setMany(dto.values, user.id);
    }
    resetPage(page, user) {
        return this.content.resetPage(page, user.id);
    }
};
exports.AdminContentController = AdminContentController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminContentController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateContentDto, Object]),
    __metadata("design:returntype", void 0)
], AdminContentController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('reset/:page'),
    __param(0, (0, common_1.Param)('page')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminContentController.prototype, "resetPage", null);
exports.AdminContentController = AdminContentController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Controller)('admin/content'),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], AdminContentController);
//# sourceMappingURL=content.controller.js.map