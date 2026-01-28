import type { ReactNode } from "react";

interface DNACardProps {
  title: string;
  headline: string;
  subline: string;
  insight: string;
  children?: ReactNode;
  accent?: "amber" | "violet" | "green" | "blue";
  tone?: "amber" | "violet" | "green" | "blue";
}

const accentClasses: Record<NonNullable<DNACardProps["accent"]>, string> = {
  amber: "bg-amber-400",
  violet: "bg-violet-400",
  green: "bg-emerald-400",
  blue: "bg-blue-400",
};

const toneClasses: Record<NonNullable<DNACardProps["tone"]>, string> = {
  amber: "bg-amber-50/70",
  violet: "bg-violet-50/70",
  green: "bg-emerald-50/70",
  blue: "bg-blue-50/70",
};

export default function DNACard({
  title,
  headline,
  subline,
  insight,
  children,
  accent = "blue",
  tone = "blue",
}: DNACardProps) {
  const accentClass = accentClasses[accent];
  const toneClass = toneClasses[tone];

  return (
    <div className={`relative rounded-xl border border-slate-200 ${toneClass} p-5 shadow-sm`}>
      <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-xl ${accentClass}`} />
      <div className="pl-4 space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
          <h3 className="text-3xl font-semibold tracking-tight text-slate-900">
            {headline}
          </h3>
          <p className="text-sm text-slate-600">{subline}</p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
        {children ? (
          <div className="border-t border-slate-100 pt-4">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
