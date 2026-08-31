"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toStringList = toStringList;
exports.listHas = listHas;
exports.listHasSomeOr = listHasSomeOr;
function toStringList(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((v) => typeof v === 'string');
}
function listHas(value) {
    return { array_contains: value };
}
function listHasSomeOr(field, values) {
    if (values.length === 0)
        return undefined;
    return values.map((v) => ({ [field]: listHas(v) }));
}
//# sourceMappingURL=json-array.js.map