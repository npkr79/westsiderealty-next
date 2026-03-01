export type LeadPriorityLabel = "HOT" | "WARM" | "COLD";

const PRIORITY_CLASS_MAP: Record<LeadPriorityLabel, string> = {
  HOT: "border-transparent bg-rose-600 text-white hover:bg-rose-600",
  WARM: "border-transparent bg-orange-500 text-white hover:bg-orange-500",
  COLD: "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export const getPriorityLabel = (value: string | null | undefined): LeadPriorityLabel => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "hot" || normalized === "high" || normalized === "p1" || normalized === "urgent") return "HOT";
  if (normalized === "warm" || normalized === "medium" || normalized === "p2") return "WARM";
  return "COLD";
};

export const getPriorityRank = (value: string | null | undefined): number => {
  const label = getPriorityLabel(value);
  if (label === "HOT") return 0;
  if (label === "WARM") return 1;
  return 2;
};

export const getPriorityBadgeClassName = (value: string | null | undefined): string =>
  PRIORITY_CLASS_MAP[getPriorityLabel(value)];

