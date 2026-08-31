import { RoleName } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    displayName: string;
    role: RoleName;
}
