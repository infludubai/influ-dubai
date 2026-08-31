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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../admin/admin.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const settings_service_1 = require("./settings.service");
const settings_tester_1 = require("./settings.tester");
class UpdateSettingsDto {
    values;
}
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateSettingsDto.prototype, "values", void 0);
class TestConnectionDto {
    group;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestConnectionDto.prototype, "group", void 0);
let SettingsController = class SettingsController {
    settings;
    tester;
    constructor(settings, tester) {
        this.settings = settings;
        this.tester = tester;
    }
    list() {
        return this.settings.listForAdmin();
    }
    async update(dto, user) {
        await this.settings.setMany(dto.values, user.id);
        return this.settings.listForAdmin();
    }
    test(group, user) {
        return this.tester.test(group, user.id);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('test/:group'),
    __param(0, (0, common_1.Param)('group')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "test", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('admin/settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        settings_tester_1.SettingsTester])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map