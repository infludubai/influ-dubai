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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewDeliverableDto = exports.SubmitDeliverableDto = exports.UpdateDeliverableDto = exports.CreateDeliverableDto = void 0;
const class_validator_1 = require("class-validator");
const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'X'];
class CreateDeliverableDto {
    creatorProfileId;
    title;
    description;
    platform;
    dueDate;
    agreedRateUsd;
}
exports.CreateDeliverableDto = CreateDeliverableDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "creatorProfileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(140),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PLATFORMS),
    __metadata("design:type", Object)
], CreateDeliverableDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDeliverableDto.prototype, "agreedRateUsd", void 0);
class UpdateDeliverableDto {
    title;
    description;
    dueDate;
    agreedRateUsd;
}
exports.UpdateDeliverableDto = UpdateDeliverableDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(140),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDeliverableDto.prototype, "agreedRateUsd", void 0);
class SubmitDeliverableDto {
    contentUrl;
    fileUrl;
    note;
}
exports.SubmitDeliverableDto = SubmitDeliverableDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_protocol: true }),
    __metadata("design:type", String)
], SubmitDeliverableDto.prototype, "contentUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_protocol: true }),
    __metadata("design:type", String)
], SubmitDeliverableDto.prototype, "fileUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], SubmitDeliverableDto.prototype, "note", void 0);
class ReviewDeliverableDto {
    outcome;
    feedback;
}
exports.ReviewDeliverableDto = ReviewDeliverableDto;
__decorate([
    (0, class_validator_1.IsEnum)(['APPROVED', 'CHANGES_REQUESTED']),
    __metadata("design:type", String)
], ReviewDeliverableDto.prototype, "outcome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ReviewDeliverableDto.prototype, "feedback", void 0);
//# sourceMappingURL=deliverable.dto.js.map