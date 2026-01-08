/**
 * Safely parse JSON input (string, object, or already parsed) with fallback
 */
export function safeJsonParse<T>(input: unknown, fallback: T): T {
  if (input === null || input === undefined) return fallback;
  if (typeof input === "object") return input as T;
  if (typeof input !== "string") return fallback;
  if (input.trim() === "") return fallback;

  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}
