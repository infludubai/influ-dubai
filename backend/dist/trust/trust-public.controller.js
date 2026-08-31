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
exports.TrustPublicController = void 0;
const common_1 = require("@nestjs/common");
const reviews_service_1 = require("./reviews.service");
let TrustPublicController = class TrustPublicController {
    reviews;
    constructor(reviews) {
        this.reviews = reviews;
    }
    creatorReviews(id) {
        return this.reviews.listForCreator(id);
    }
    brandReviews(id) {
        return this.reviews.listForBrand(id);
    }
};
exports.TrustPublicController = TrustPublicController;
__decorate([
    (0, common_1.Get)('creators/:creatorProfileId/reviews'),
    __param(0, (0, common_1.Param)('creatorProfileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrustPublicController.prototype, "creatorReviews", null);
__decorate([
    (0, common_1.Get)('brands/:brandProfileId/reviews'),
    __param(0, (0, common_1.Param)('brandProfileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrustPublicController.prototype, "brandReviews", null);
exports.TrustPublicController = TrustPublicController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], TrustPublicController);
//# sourceMappingURL=trust-public.controller.js.map