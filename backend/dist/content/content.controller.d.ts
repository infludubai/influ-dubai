import { ContentService } from './content.service';
declare class UpdateContentDto {
    values: Record<string, string>;
}
export declare class PublicContentController {
    private readonly content;
    constructor(content: ContentService);
    get(): Record<string, string>;
}
export declare class AdminContentController {
    private readonly content;
    constructor(content: ContentService);
    list(): Promise<{
        pages: readonly [{
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
        fields: {
            key: string;
            label: string;
            page: string;
            section: string;
            type: import("./content.catalog").ContentType;
            help: string | undefined;
            columns: string[] | undefined;
            value: string;
            defaultValue: string;
            customised: boolean;
            updatedAt: string | null;
        }[];
    }>;
    update(dto: UpdateContentDto, user: {
        id: string;
    }): Promise<{
        pages: readonly [{
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
        fields: {
            key: string;
            label: string;
            page: string;
            section: string;
            type: import("./content.catalog").ContentType;
            help: string | undefined;
            columns: string[] | undefined;
            value: string;
            defaultValue: string;
            customised: boolean;
            updatedAt: string | null;
        }[];
    }>;
    resetPage(page: string, user: {
        id: string;
    }): Promise<{
        pages: readonly [{
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
        fields: {
            key: string;
            label: string;
            page: string;
            section: string;
            type: import("./content.catalog").ContentType;
            help: string | undefined;
            columns: string[] | undefined;
            value: string;
            defaultValue: string;
            customised: boolean;
            updatedAt: string | null;
        }[];
    }>;
}
export {};
