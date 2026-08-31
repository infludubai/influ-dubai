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
exports.TrustController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../admin/admin.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const verification_service_1 = require("./verification.service");
const reviews_service_1 = require("./reviews.service");
const shortlists_service_1 = require("./shortlists.service");
class RequestVerificationDto {
    evidenceUrl;
    note;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_protocol: true }),
    __metadata("design:type", String)
], RequestVerificationDto.prototype, "evidenceUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], RequestVerificationDto.prototype, "note", void 0);
class DecideVerificationDto {
    decision;
    reason;
}
__decorate([
    (0, class_validator_1.IsEnum)(['VERIFIED', 'REJECTED']),
    __metadata("design:type", String)
], DecideVerificationDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], DecideVerificationDto.prototype, "reason", void 0);
class CreateReviewDto {
    rating;
    comment;
    creatorProfileId;
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "comment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "creatorProfileId", void 0);
class AddShortlistDto {
    creatorProfileId;
    listName;
    note;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddShortlistDto.prototype, "creatorProfileId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], AddShortlistDto.prototype, "listName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AddShortlistDto.prototype, "note", void 0);
let TrustController = class TrustController {
    verification;
    reviews;
    shortlists;
    constructor(verification, reviews, shortlists) {
        this.verification = verification;
        this.reviews = reviews;
        this.shortlists = shortlists;
    }
    requestVerification(user, dto) {
        return this.verification.request(user.id, dto.evidenceUrl, dto.note);
    }
    myVerification(user) {
        return this.verification.myStatus(user.id);
    }
    listVerification(status = 'PENDING') {
        return this.verification.listForAdmin(status);
    }
    verificationStats() {
        return this.verification.queueStats();
    }
    decideVerification(user, id, dto) {
        return this.verification.decide(user.id, id, dto.decision, dto.reason);
    }
    reviewCreator(user, campaignId, dto) {
        return this.reviews.createFromBrand(user.id, campaignId, dto.creatorProfileId, dto.rating, dto.comment);
    }
    reviewBrand(user, campaignId, dto) {
        return this.reviews.createFromCreator(user.id, campaignId, dto.rating, dto.comment);
    }
    pendingReviews(user) {
        return this.reviews.pendingForBrand(user.id);
    }
    listShortlist(user) {
        return this.shortlists.list(user.id);
    }
    shortlistIds(user) {
        return this.shortlists.savedIds(user.id);
    }
    addShortlist(user, dto) {
        return this.shortlists.add(user.id, dto.creatorProfileId, dto.listName, dto.note);
    }
    removeShortlist(user, id) {
        return this.shortlists.remove(user.id, id);
    }
};
exports.TrustController = TrustController;
__decorate([
    (0, common_1.Post)('verification/request'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RequestVerificationDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "requestVerification", null);
__decorate([
    (0, common_1.Get)('verification/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "myVerification", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('admin/verification'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "listVerification", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Get)('admin/verification/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "verificationStats", null);
__decorate([
    (0, common_1.UseGuards)(admin_guard_1.AdminGuard),
    (0, common_1.Patch)('admin/verification/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, DecideVerificationDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "decideVerification", null);
__decorate([
    (0, common_1.Post)('campaigns/:campaignId/reviews/creator'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CreateReviewDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "reviewCreator", null);
__decorate([
    (0, common_1.Post)('campaigns/:campaignId/reviews/brand'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, CreateReviewDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "reviewBrand", null);
__decorate([
    (0, common_1.Get)('reviews/pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "pendingReviews", null);
__decorate([
    (0, common_1.Get)('shortlists'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "listShortlist", null);
__decorate([
    (0, common_1.Get)('shortlists/ids'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "shortlistIds", null);
__decorate([
    (0, common_1.Post)('shortlists'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AddShortlistDto]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "addShortlist", null);
__decorate([
    (0, common_1.Delete)('shortlists/:creatorProfileId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('creatorProfileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TrustController.prototype, "removeShortlist", null);
exports.TrustController = TrustController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [verification_service_1.VerificationService,
        reviews_service_1.ReviewsService,
        shortlists_service_1.ShortlistsService])
], TrustController);
//# sourceMappingURL=trust.controller.js.map