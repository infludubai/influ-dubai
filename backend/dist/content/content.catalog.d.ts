export type ContentType = 'text' | 'textarea' | 'number' | 'url' | 'list' | 'rows' | 'image';
export interface ContentField {
    key: string;
    label: string;
    page: string;
    section: string;
    type: ContentType;
    default: string;
    help?: string;
    columns?: string[];
}
export declare const CONTENT_PAGES: readonly [{
    readonly id: "global";
    readonly title: "Global";
    readonly description: "Brand name, contact details and the footer shown on every page.";
}, {
    readonly id: "home";
    readonly title: "Homepage";
    readonly description: "Hero, statistics, features, how-it-works steps and testimonials.";
}, {
    readonly id: "pricing";
    readonly title: "Pricing";
    readonly description: "Plan names, prices and what each plan includes.";
}, {
    readonly id: "about";
    readonly title: "About";
    readonly description: "Company story and values.";
}, {
    readonly id: "contact";
    readonly title: "Contact";
    readonly description: "Contact channels and response expectations.";
}, {
    readonly id: "emails";
    readonly title: "Emails";
    readonly description: "The emails the platform sends. {{name}}, {{link}} and {{brandName}} are filled in per message.";
}];
export declare const CONTENT_FIELDS: ContentField[];
export declare function getField(key: string): ContentField | undefined;
export declare function isKnownContentKey(key: string): boolean;
export declare function defaults(): Record<string, string>;
