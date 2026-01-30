import type { ReactNode } from "react";
import {
  getDnaColors,
  getStressColor,
  getStressLabel,
  type DnaType,
} from "@/intelligence/visualSystem";

interface DNACardProps {
  title: string;
  headline: string;
  subline: string;
  insight: string;
  children?: ReactNode;
  dnaType: DnaType;
  severityScore?: number | null;
}

export default function DNACard({
  title,
  headline,
  subline,
  insight,
  children,
  dnaType,
  severityScore = null,
}: DNACardProps) {
  const dnaColors = getDnaColors(dnaType);
  const severityLabel =
    severityScore === null ? "Not structurally applicable" : getStressLabel(severityScore);
  const severityTone = getStressColor(severityScore ?? 0);

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border ${dnaColors.border} bg-gradient-to-br ${dnaColors.gradient} p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]`}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-xl ${dnaColors.rail}`} />
      <div className="pl-4 space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {title}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-4xl font-semibold tracking-tight text-slate-900">
              {headline}
            </h3>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${severityTone.badge} ${severityTone.border}`}
            >
              {severityLabel}
            </span>
          </div>
          <p className="text-sm text-slate-600">{subline}</p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
        {children ? (
          <div className="rounded-lg border border-white/70 bg-white/80 p-3 shadow-sm">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
