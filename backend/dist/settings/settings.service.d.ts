import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingGroupId } from './settings.catalog';
export interface MaskedSetting {
    key: string;
    label: string;
    group: SettingGroupId;
    isSecret: boolean;
    placeholder?: string;
    help?: string;
    numeric?: boolean;
    value: string;
    configured: boolean;
    source: 'database' | 'environment' | 'unset';
    updatedAt: string | null;
}
export declare class SettingsService implements OnModuleInit {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    private cache;
    private loaded;
    constructor(prisma: PrismaService, audit: AuditService);
    onModuleInit(): Promise<void>;
    refresh(): Promise<void>;
    get(key: string): string | undefined;
    getNumber(key: string, fallback: number): number;
    has(key: string): boolean;
    isOn(key: string): boolean;
    private sourceOf;
    listForAdmin(): Promise<{
        groups: import("./settings.catalog").SettingGroup[];
        settings: MaskedSetting[];
    }>;
    set(key: string, rawValue: string, actorId?: string): Promise<void>;
    setMany(values: Record<string, string>, actorId?: string): Promise<void>;
}
