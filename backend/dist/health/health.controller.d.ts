import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
export declare class HealthController {
    private readonly prisma;
    private readonly settings;
    private readonly startedAt;
    constructor(prisma: PrismaService, settings: SettingsService);
    live(): {
        status: string;
        uptimeSeconds: number;
    };
    ready(): Promise<{
        status: string;
        checks: Record<string, {
            ok: boolean;
            detail?: string;
        }>;
    }>;
}
