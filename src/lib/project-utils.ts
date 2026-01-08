/**
 * Helper function to safely parse JSON fields from database
 */
export function safeJsonParse<T>(value: string | null | undefined | any, fallback: T): T {
  if (!value) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}
