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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            country: string | null;
            displayName: string;
            bio: string | null;
            city: string | null;
            languages: import("@prisma/client/runtime/library").JsonValue;
            categories: import("@prisma/client/runtime/library").JsonValue;
            avatarUrl: string | null;
        } | null;
        createdAt: Date;
    }>;
    updateProfile(user: {
        id: string;
    }, dto: UpdateProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        country: string | null;
        displayName: string;
        bio: string | null;
        city: string | null;
        languages: import("@prisma/client/runtime/library").JsonValue;
        categories: import("@prisma/client/runtime/library").JsonValue;
        avatarUrl: string | null;
    }>;
    exportData(user: {
        id: string;
    }): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            country: string | null;
            displayName: string;
            bio: string | null;
            city: string | null;
            languages: import("@prisma/client/runtime/library").JsonValue;
            categories: import("@prisma/client/runtime/library").JsonValue;
            avatarUrl: string | null;
        } | null;
        creatorProfile: ({
            socialAccounts: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                platform: import("@prisma/client").$Enums.SocialPlatform;
                creatorId: string;
                handle: string;
                followersCount: number | null;
                engagementRate: number | null;
                profileUrl: string | null;
            }[];
            portfolioItems: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                title: string;
                creatorId: string;
                mediaUrl: string | null;
                linkUrl: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            ratingAvg: number | null;
            ratingCount: number;
            bio: string | null;
            languages: import("@prisma/client/runtime/library").JsonValue;
            categories: import("@prisma/client/runtime/library").JsonValue;
            location: string | null;
            minRateUsd: number | null;
            maxRateUsd: number | null;
            totalAudienceSize: number | null;
            mediaKitUrl: string | null;
            profileImageUrl: string | null;
            verificationStatus: import("@prisma/client").$Enums.VerificationStatus;
            fraudRiskScore: number | null;
            fraudRiskLevel: string | null;
            fraudFlags: import("@prisma/client/runtime/library").JsonValue;
            fraudAnalyzedAt: Date | null;
        }) | null;
        brandProfiles: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            companyName: string;
            industry: string | null;
            website: string | null;
            logoUrl: string | null;
            country: string | null;
            ratingAvg: number | null;
            ratingCount: number;
        }[];
        id: string;
        status: import("@prisma/client").$Enums.UserStatus;
        email: string;
        activeBrandProfileId: string | null;
        featureOverrides: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        roleId: string;
    }>;
    deleteAccount(user: {
        id: string;
    }): Promise<{
        deleted: boolean;
    }>;
}
