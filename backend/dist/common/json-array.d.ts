export declare function toStringList(value: unknown): string[];
export declare function listHas(value: string): {
    array_contains: string;
};
export declare function listHasSomeOr(field: string, values: string[]): {
    [field]: {
        array_contains: string;
    };
}[] | undefined;
