const CRORE = 10000000;
const LAKH = 100000;

export const parseBudgetNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/,/g, "");
  if (!normalized) return null;
  const match = normalized.match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  if (normalized.includes("cr")) return base * CRORE;
  if (normalized.includes("lakh") || normalized.includes("lac") || /\bl\b/.test(normalized)) return base * LAKH;
  if (/\bk\b/.test(normalized)) return base * 1000;
  return base;
};

export const toBudgetNumber = (value: unknown): number | null => {
  const parsed = parseBudgetNumber(value);
  return parsed === null ? null : Math.round(parsed);
};

export const getLeadBudgetValue = (row: { budget_min?: unknown; budget_max?: unknown }): number => {
  const max = toBudgetNumber(row.budget_max);
  const min = toBudgetNumber(row.budget_min);
  return max ?? min ?? 0;
};

export const formatBudgetRange = (minValue: unknown, maxValue: unknown): string => {
  const min = toBudgetNumber(minValue);
  const max = toBudgetNumber(maxValue);
  if (min === null && max === null) return "-";
  const format = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  if (min !== null && max !== null) {
    if (min === max) return format(min);
    return `${format(min)} - ${format(max)}`;
  }
  const single = min ?? max;
  return single === null ? "-" : format(single);
};
