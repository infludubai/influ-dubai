import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    me(user: {
        id: string;
    }): Promise<{
        id: string;
        email: string;
        status: import("@prisma/client").$Enums.UserStatus;
        role: import("@prisma/client").$Enums.RoleName;
        profile: {
            displayName: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            country: string | null;
            city: string | null;
            languages: string[];
            categories: string[];
            avatarUrl: string | null;
            userId: string;
        } | null;
        createdAt: Date;
    }>;
    updateProfile(user: {
        id: string;
    }, dto: UpdateProfileDto): Promise<{
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        bio: string | null;
        country: string | null;
        city: string | null;
        languages: string[];
        categories: string[];
        avatarUrl: string | null;
        userId: string;
    }>;
}
