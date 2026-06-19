import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RoleName } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    role: RoleName;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: ConfigService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.RoleName;
    }>;
}
export {};
