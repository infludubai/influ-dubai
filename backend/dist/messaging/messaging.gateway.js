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
exports.MessagingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const messaging_service_1 = require("./messaging.service");
let MessagingGateway = class MessagingGateway {
    messaging;
    jwt;
    server;
    userSockets = new Map();
    constructor(messaging, jwt) {
        this.messaging = messaging;
        this.jwt = jwt;
    }
    handleConnection(client) {
        try {
            const token = client.handshake.auth?.token;
            const payload = this.jwt.verify(token);
            client.data.userId = payload.id;
            this.userSockets.set(payload.id, client.id);
            client.join(`user:${payload.id}`);
        }
        catch {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data.userId)
            this.userSockets.delete(client.data.userId);
    }
    joinConversation(client, conversationId) {
        client.join(`conv:${conversationId}`);
        return { event: 'joined', data: conversationId };
    }
    async handleMessage(client, payload) {
        const userId = client.data.userId;
        const msg = await this.messaging.sendMessage(userId, payload.conversationId, payload.content);
        this.server.to(`conv:${payload.conversationId}`).emit('new_message', msg);
        return msg;
    }
    emitToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
};
exports.MessagingGateway = MessagingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], MessagingGateway.prototype, "joinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], MessagingGateway.prototype, "handleMessage", null);
exports.MessagingGateway = MessagingGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' }, namespace: '/messaging' }),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService,
        jwt_1.JwtService])
], MessagingGateway);
//# sourceMappingURL=messaging.gateway.js.map