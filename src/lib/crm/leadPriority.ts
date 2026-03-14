export type LeadPriorityLabel = "Serious Buyer" | "Evaluating" | "Early Stage";

const PRIORITY_CLASS_MAP: Record<LeadPriorityLabel, string> = {
  "Serious Buyer": "border-transparent bg-rose-600 text-white hover:bg-rose-600",
  "Evaluating":    "border-transparent bg-orange-500 text-white hover:bg-orange-500",
  "Early Stage":   "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export const getPriorityLabel = (value: string | null | undefined): LeadPriorityLabel => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  // New values
  if (normalized === "serious_buyer") return "Serious Buyer";
  if (normalized === "evaluating")    return "Evaluating";
  if (normalized === "early_stage")   return "Early Stage";

  // Legacy values — map to nearest equivalent
  if (normalized === "hot"  || normalized === "high"   || normalized === "p1" || normalized === "urgent") return "Serious Buyer";
  if (normalized === "warm" || normalized === "medium" || normalized === "p2") return "Evaluating";
  return "Early Stage";
};

export const getPriorityRank = (value: string | null | undefined): number => {
  const label = getPriorityLabel(value);
  if (label === "Serious Buyer") return 0;
  if (label === "Evaluating")    return 1;
  return 2;
};

export const getPriorityBadgeClassName = (value: string | null | undefined): string =>
  PRIORITY_CLASS_MAP[getPriorityLabel(value)];
