/**
 * Helper utilities to safely parse JSONB fields from Supabase.
 * 
 * Supabase can return JSONB columns in two formats:
 * 1. Proper JSONB (array/object) - when stored correctly
 * 2. Stringified JSON (string) - when stored as text that needs parsing
 * 
 * These helpers handle both cases gracefully.
 */

export const parseJsonb = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;

  // Supabase returns jsonb string scalars as JS strings
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
};

export const safeLower = (v: unknown): string =>
  (typeof v === "string" ? v : "").toLowerCase();

export const asArray = <T = unknown>(v: unknown): T[] =>
  Array.isArray(v) ? (v as T[]) : [];

export const asObject = <T extends Record<string, unknown> = Record<string, unknown>>(
  v: unknown
): T =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as T) : ({} as T);

/**
 * Safely capitalizes the first letter of a string.
 * Returns empty string if input is not a valid string.
 */
export const safeCapitalize = (v: unknown): string => {
  if (typeof v !== "string" || v.length === 0) return "";
  return (v.charAt(0)?.toUpperCase() || "") + (v.slice(1) || "");
};
