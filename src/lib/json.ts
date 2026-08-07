/**
 * Safe JSON helpers for fields stored as TEXT for SQLite/Postgres portability.
 */
export function jparse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw === null || raw === undefined || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function jstring(value: unknown): string {
  if (value === null || value === undefined) return "null";
  return JSON.stringify(value);
}
