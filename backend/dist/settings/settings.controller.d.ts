import { SettingsService } from './settings.service';
import { SettingsTester } from './settings.tester';
declare class UpdateSettingsDto {
    values: Record<string, string>;
}
export declare class SettingsController {
    private readonly settings;
    private readonly tester;
    constructor(settings: SettingsService, tester: SettingsTester);
    list(): Promise<{
        groups: import("./settings.catalog").SettingGroup[];
        settings: import("./settings.service").MaskedSetting[];
    }>;
    update(dto: UpdateSettingsDto, user: {
        id: string;
    }): Promise<{
        groups: import("./settings.catalog").SettingGroup[];
        settings: import("./settings.service").MaskedSetting[];
    }>;
    test(group: string, user: {
        id: string;
    }): Promise<import("./settings.tester").TestResult>;
}
export {};
