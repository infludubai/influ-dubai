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
exports.CreatorsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const creators_service_1 = require("./creators.service");
const upsert_creator_profile_dto_1 = require("./dto/upsert-creator-profile.dto");
const upsert_social_account_dto_1 = require("./dto/upsert-social-account.dto");
const create_portfolio_item_dto_1 = require("./dto/create-portfolio-item.dto");
const uploadStorage = (dest) => (0, multer_1.diskStorage)({
    destination: (0, path_1.join)(process.cwd(), 'uploads', dest),
    filename: (_req, file, cb) => cb(null, `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`),
});
let CreatorsController = class CreatorsController {
    creators;
    constructor(creators) {
        this.creators = creators;
    }
    list(q, category, location, language, minFollowers, maxFollowers, minRate, maxRate, page, limit) {
        return this.creators.listPublicProfiles({
            q,
            category,
            location,
            language,
            minFollowers: minFollowers ? Number(minFollowers) : undefined,
            maxFollowers: maxFollowers ? Number(maxFollowers) : undefined,
            minRate: minRate ? Number(minRate) : undefined,
            maxRate: maxRate ? Number(maxRate) : undefined,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
    }
    getPublic(id) {
        return this.creators.getPublicProfile(id);
    }
    getMyProfile(user) {
        return this.creators.getMyProfile(user.id).then((profile) => ({
            profile,
            completionScore: this.creators.completionScore(profile),
        }));
    }
    upsertProfile(user, dto) {
        return this.creators.upsertProfile(user.id, dto);
    }
    uploadProfileImage(user, file) {
        const url = `/uploads/avatars/${file.filename}`;
        return this.creators.updateProfileImage(user.id, url);
    }
    uploadMediaKit(user, file) {
        const url = `/uploads/media-kits/${file.filename}`;
        return this.creators.updateMediaKit(user.id, url);
    }
    upsertSocialAccount(user, dto) {
        return this.creators.upsertSocialAccount(user.id, dto);
    }
    deleteSocialAccount(user, platform) {
        return this.creators.deleteSocialAccount(user.id, platform.toUpperCase());
    }
    createPortfolioItem(user, dto, file) {
        const mediaUrl = file ? `/uploads/portfolio/${file.filename}` : undefined;
        return this.creators.createPortfolioItem(user.id, dto, mediaUrl);
    }
    deletePortfolioItem(user, id) {
        return this.creators.deletePortfolioItem(user.id, id);
    }
};
exports.CreatorsController = CreatorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('location')),
    __param(3, (0, common_1.Query)('language')),
    __param(4, (0, common_1.Query)('minFollowers')),
    __param(5, (0, common_1.Query)('maxFollowers')),
    __param(6, (0, common_1.Query)('minRate')),
    __param(7, (0, common_1.Query)('maxRate')),
    __param(8, (0, common_1.Query)('page')),
    __param(9, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "getPublic", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me/profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me/profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upsert_creator_profile_dto_1.UpsertCreatorProfileDto]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "upsertProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/profile/image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: uploadStorage('avatars') })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "uploadProfileImage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/profile/media-kit'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: uploadStorage('media-kits') })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "uploadMediaKit", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/social-accounts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upsert_social_account_dto_1.UpsertSocialAccountDto]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "upsertSocialAccount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('me/social-accounts/:platform'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "deleteSocialAccount", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('me/portfolio'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: uploadStorage('portfolio') })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_portfolio_item_dto_1.CreatePortfolioItemDto, Object]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "createPortfolioItem", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('me/portfolio/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CreatorsController.prototype, "deletePortfolioItem", null);
exports.CreatorsController = CreatorsController = __decorate([
    (0, common_1.Controller)('creators'),
    __metadata("design:paramtypes", [creators_service_1.CreatorsService])
], CreatorsController);
//# sourceMappingURL=creators.controller.js.map