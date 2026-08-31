"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustModule = void 0;
const common_1 = require("@nestjs/common");
const trust_controller_1 = require("./trust.controller");
const trust_public_controller_1 = require("./trust-public.controller");
const verification_service_1 = require("./verification.service");
const reviews_service_1 = require("./reviews.service");
const shortlists_service_1 = require("./shortlists.service");
const notifications_module_1 = require("../notifications/notifications.module");
let TrustModule = class TrustModule {
};
exports.TrustModule = TrustModule;
exports.TrustModule = TrustModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [trust_public_controller_1.TrustPublicController, trust_controller_1.TrustController],
        providers: [verification_service_1.VerificationService, reviews_service_1.ReviewsService, shortlists_service_1.ShortlistsService],
        exports: [verification_service_1.VerificationService, reviews_service_1.ReviewsService, shortlists_service_1.ShortlistsService],
    })
], TrustModule);
//# sourceMappingURL=trust.module.js.map