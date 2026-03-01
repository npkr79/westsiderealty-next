import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  trend?: "up" | "down" | "neutral" | null;
  className?: string;
}

export default function MetricCard({ label, value, trend, className = "" }: MetricCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
        ? "text-amber-600"
        : "text-foreground";

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-lg font-semibold leading-snug ${trendColor} md:text-xl`}>{value}</p>
    </div>
  );
}
