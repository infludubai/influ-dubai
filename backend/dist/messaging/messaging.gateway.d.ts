import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';
export declare class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly messaging;
    private readonly jwt;
    server: Server;
    private userSockets;
    constructor(messaging: MessagingService, jwt: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    joinConversation(client: Socket, conversationId: string): {
        event: string;
        data: string;
    };
    handleMessage(client: Socket, payload: {
        conversationId: string;
        content: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        readAt: Date | null;
        senderId: string;
        content: string;
        conversationId: string;
    }>;
    emitToUser(userId: string, event: string, data: unknown): void;
}
