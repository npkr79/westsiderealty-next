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

/**
 * Compute a human-readable project status from RERA dates + AI enrichment.
 * Priority: AI signals > date logic > raw DB status.
 */
export function computeProjectStatus(
  current_status: string | null | undefined,
  proposed_completion_date: string | null | undefined,
  approved_date: string | null | undefined,
  ai_key_updates?: string | null,
): string {
  // Priority 1: AI enrichment signals (from project_live_intelligence)
  if (ai_key_updates) {
    const text = ai_key_updates.toLowerCase();
    if (
      text.includes("oc received") ||
      text.includes("occupancy certificate") ||
      text.includes("handed over") ||
      text.includes("possession started") ||
      text.includes("fully completed")
    ) {
      return "Completed";
    }
  }

  // Priority 2: Date-based logic
  if (proposed_completion_date) {
    const today = new Date();
    const completion = new Date(proposed_completion_date);
    const monthsDiff =
      (completion.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const reraAgeDays = approved_date
      ? (today.getTime() - new Date(approved_date).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (monthsDiff < 0) return "Completed";
    if (reraAgeDays <= 240 && monthsDiff > 0) return "New Launch";
    if (monthsDiff <= 12) return "Near Completion";
    return "Under Construction";
  }

  return current_status || "Unknown";
}

/**
 * Convert a raw RERA saleable_area value to sqft.
 * RERA data is mixed — some projects store sqm, others sqft.
 * Heuristic: values < 400 are sqm (smallest realistic flat ~400 sqft / ~37 sqm).
 */
export function toSqft(value: number): number {
  if (value >= 1000) return Math.round(value);
  return Math.round(value * 10.764);
}
