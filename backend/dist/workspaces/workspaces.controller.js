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
exports.WorkspacesController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const workspaces_service_1 = require("./workspaces.service");
const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER', 'VIEWER'];
class CreateWorkspaceDto {
    companyName;
    industry;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "companyName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "industry", void 0);
class InviteMemberDto {
    email;
    role;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ASSIGNABLE_ROLES),
    __metadata("design:type", Object)
], InviteMemberDto.prototype, "role", void 0);
class UpdateRoleDto {
    role;
}
__decorate([
    (0, class_validator_1.IsEnum)(ASSIGNABLE_ROLES),
    __metadata("design:type", Object)
], UpdateRoleDto.prototype, "role", void 0);
let WorkspacesController = class WorkspacesController {
    workspaces;
    constructor(workspaces) {
        this.workspaces = workspaces;
    }
    list(user) {
        return this.workspaces.listMine(user.id);
    }
    create(user, dto) {
        return this.workspaces.create(user.id, dto.companyName, dto.industry);
    }
    switch(user, id) {
        return this.workspaces.switchActive(user.id, id);
    }
    members(user, id) {
        return this.workspaces.listMembers(user.id, id);
    }
    invite(user, id, dto) {
        return this.workspaces.invite(user.id, id, dto.email, dto.role);
    }
    updateRole(user, id, memberId, dto) {
        return this.workspaces.updateRole(user.id, id, memberId, dto.role);
    }
    removeMember(user, id, memberId) {
        return this.workspaces.removeMember(user.id, id, memberId);
    }
};
exports.WorkspacesController = WorkspacesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateWorkspaceDto]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/switch'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "switch", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "members", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, InviteMemberDto]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "invite", null);
__decorate([
    (0, common_1.Patch)(':id/members/:memberId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('memberId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], WorkspacesController.prototype, "removeMember", null);
exports.WorkspacesController = WorkspacesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('workspaces'),
    __metadata("design:paramtypes", [workspaces_service_1.WorkspacesService])
], WorkspacesController);
//# sourceMappingURL=workspaces.controller.js.map