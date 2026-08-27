/**
 * String-list helpers for MySQL.
 *
 * MySQL has no array column type, so the fields that were Postgres `String[]`
 * (creator categories/languages, campaign targets, fraud flags) are stored as
 * JSON arrays. Prisma types those as `JsonValue`, which is wider than what the
 * rest of the app expects — these helpers keep `string[]` at every boundary so
 * services, DTOs and the frontend are unaffected by the storage change.
 */

/** Narrows a stored JSON value to the string list the app expects. */
export function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/**
 * `where` clause for "this JSON array contains `value`" — the MySQL equivalent
 * of Postgres' `{ has: value }`.
 */
export function listHas(value: string) {
  return { array_contains: value };
}

/**
 * `where` clause for "this JSON array contains any of `values`" — the MySQL
 * equivalent of Postgres' `{ hasSome: values }`.
 *
 * MySQL's JSON_CONTAINS tests one candidate at a time, so this expands to an
 * OR. Returns undefined for an empty list, which callers treat as "no filter"
 * (matching hasSome's behaviour on an empty array would exclude everything).
 */
export function listHasSomeOr(field: string, values: string[]) {
  if (values.length === 0) return undefined;
  return values.map((v) => ({ [field]: listHas(v) }));
}
