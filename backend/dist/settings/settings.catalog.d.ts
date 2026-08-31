export interface SettingDefinition {
    key: string;
    label: string;
    group: SettingGroupId;
    isSecret: boolean;
    placeholder?: string;
    help?: string;
    numeric?: boolean;
}
export type SettingGroupId = 'openai' | 'stripe' | 'smtp' | 'platform';
export interface SettingGroup {
    id: SettingGroupId;
    title: string;
    description: string;
    docsUrl?: string;
    testable: boolean;
}
export declare const SETTING_GROUPS: SettingGroup[];
export declare const SETTING_DEFINITIONS: SettingDefinition[];
export declare function getDefinition(key: string): SettingDefinition | undefined;
export declare function isKnownSetting(key: string): boolean;
