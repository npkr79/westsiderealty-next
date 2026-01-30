import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  INTELLIGENCE_LABELS,
  normalizeCompactness,
  normalizeDensityClass,
  normalizeLandStrength,
  normalizeScaleClass,
} from "@/constants/intelligenceLanguage";

export const FALLBACK_DISCLOSURE = INTELLIGENCE_LABELS.disclosureMissing;

export const renderValue = (value: string | null, fallback: string = FALLBACK_DISCLOSURE) =>
  value && value.trim().length > 0 ? value : fallback;

export const renderDensityClass = (value: string | null) =>
  normalizeDensityClass(value) ?? FALLBACK_DISCLOSURE;

export const renderLandStrengthClass = (value: string | null) =>
  normalizeLandStrength(value) ?? FALLBACK_DISCLOSURE;

export const renderScaleClass = (value: string | null) =>
  normalizeScaleClass(value) ?? FALLBACK_DISCLOSURE;

export const renderCompactnessBand = (value: string | null) =>
  normalizeCompactness(value) ?? FALLBACK_DISCLOSURE;

type ChipTone = "density" | "land" | "scale" | "risk" | "compactness" | "neutral";

const palette = {
  density: {
    estate: "#1E2A78",
    low: "#3B4CC0",
    balanced: "#6D5EF5",
    high: "#F59E0B",
    extreme: "#DC2626",
  },
  land: {
    severe: "#92400E",
    stressed: "#CA8A04",
    balanced: "#16A34A",
    abundant: "#10B981",
    ultra: "#2DD4BF",
  },
  risk: {
    strong: "#16A34A",
    stable: "#2563EB",
    watch: "#F59E0B",
    elevated: "#DC2626",
    structural: "#7F1D1D",
  },
  scale: {
    boutique: "#334155",
    gated: "#1E40AF",
    township: "#3730A3",
    mega: "#4F46E5",
    urban: "#7C3AED",
  },
  surface: {
    background: "#F8FAFC",
    card: "#FFFFFF",
    secondary: "#F1F5F9",
    deep: "#0F172A",
    divider: "#E2E8F0",
  },
};

const densityGradient =
  "linear-gradient(90deg,#1E2A78,#3B4CC0,#6D5EF5,#F59E0B,#DC2626)";

const resolveDensityColor = (label: string) => {
  const value = label.toLowerCase();
  if (value.includes("estate") || value.includes("very low") || value.includes("low")) {
    return value.includes("balanced") ? palette.density.balanced : palette.density.low;
  }
  if (value.includes("balanced")) return palette.density.balanced;
  if (value.includes("high")) return palette.density.high;
  if (value.includes("extreme") || value.includes("hyper")) return palette.density.extreme;
  return palette.density.balanced;
};

const resolveLandColor = (label: string) => {
  const value = label.toLowerCase();
  if (value.includes("severe")) return palette.land.severe;
  if (value.includes("stressed")) return palette.land.stressed;
  if (value.includes("balanced")) return palette.land.balanced;
  if (value.includes("ultra")) return palette.land.ultra;
  if (value.includes("abundant") || value.includes("strong")) return palette.land.abundant;
  return palette.land.balanced;
};

const resolveScaleColor = (label: string) => {
  const value = label.toLowerCase();
  if (value.includes("urban")) return palette.scale.urban;
  if (value.includes("mega")) return palette.scale.mega;
  if (value.includes("township")) return palette.scale.township;
  if (value.includes("gated")) return palette.scale.gated;
  return palette.scale.boutique;
};

const resolveCompactnessColor = (label: string) => {
  const value = label.toLowerCase();
  if (value.includes("estate")) return palette.density.estate;
  if (value.includes("low")) return palette.density.low;
  if (value.includes("balanced")) return palette.density.balanced;
  if (value.includes("hyper")) return palette.density.extreme;
  return palette.density.high;
};

export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="space-y-2">
    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
      {eyebrow}
    </p>
    <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">{title}</h2>
    {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
  </div>
);

export const Metric = ({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: ChipTone;
}) => (
  <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
    <div
      className="absolute -right-16 -top-20 h-40 w-40 rounded-full blur-2xl"
      style={{
        background:
          tone === "land"
            ? "radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)"
            : tone === "density"
            ? "radial-gradient(circle, rgba(109,94,245,0.22), transparent 70%)"
            : tone === "scale"
            ? "radial-gradient(circle, rgba(79,70,229,0.18), transparent 70%)"
            : "radial-gradient(circle, rgba(148,163,184,0.2), transparent 70%)",
      }}
    />
    <p className="relative text-xs text-slate-500">{label}</p>
    <p className="relative mt-2 text-4xl font-semibold text-slate-900">{value}</p>
    {hint ? <p className="relative text-xs text-slate-500">{hint}</p> : null}
  </div>
);

export const Chip = ({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: ChipTone;
}) => {
  const label = String(children ?? "");
  const borderColor =
    tone === "density"
      ? resolveDensityColor(label)
      : tone === "land"
      ? resolveLandColor(label)
      : tone === "scale"
      ? resolveScaleColor(label)
      : tone === "compactness"
      ? resolveCompactnessColor(label)
      : palette.surface.divider;
  return (
    <span
      className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{
        borderColor,
        background:
          tone === "density"
            ? "linear-gradient(90deg, rgba(59,76,192,0.15), rgba(245,158,11,0.12))"
            : tone === "land"
            ? "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(45,212,191,0.12))"
            : tone === "scale"
            ? "linear-gradient(90deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))"
            : tone === "compactness"
            ? "linear-gradient(90deg, rgba(30,42,120,0.18), rgba(245,158,11,0.12))"
            : "rgba(148,163,184,0.15)",
        color: tone === "neutral" ? "#0F172A" : "#F8FAFC",
      }}
    >
      {children}
    </span>
  );
};

export const ProgressBar = ({
  value,
  label,
  tone = "density",
}: {
  value: number | null;
  label?: string;
  tone?: ChipTone;
}) => {
  const safe = value === null ? 0 : Math.min(100, Math.max(0, value));
  const fillStyle =
    tone === "density"
      ? { backgroundImage: densityGradient }
      : tone === "land"
      ? { backgroundImage: "linear-gradient(90deg,#16A34A,#2DD4BF)" }
      : tone === "scale"
      ? { backgroundImage: "linear-gradient(90deg,#3730A3,#7C3AED)" }
      : { backgroundImage: "linear-gradient(90deg,#2563EB,#F59E0B)" };
  return (
    <div className="rounded-[24px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label ?? "Index"}</span>
        <span>
          {value === null ? INTELLIGENCE_LABELS.disclosureMissing : `${Math.round(value)} / 100`}
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full"
          style={{ width: `${safe}%`, ...fillStyle }}
        />
      </div>
    </div>
  );
};

export const SpectrumBar = ({
  bands,
  active,
}: {
  bands: string[];
  active: string | null;
}) => (
  <div className="rounded-[24px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] space-y-3">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
      Compactness spectrum
    </p>
    <div className="flex gap-1">
      {bands.map((band) => (
        <div
          key={band}
          className={cn(
            "h-2 flex-1 rounded-full",
            band === active ? "opacity-100" : "opacity-35"
          )}
          style={{
            backgroundColor: resolveCompactnessColor(band),
          }}
        />
      ))}
    </div>
    <div className="flex justify-between text-[11px] text-slate-500">
      {bands.map((band) => (
        <span key={band}>{band}</span>
      ))}
    </div>
  </div>
);

export const PercentileBar = ({
  label,
  value,
  statement,
  tone = "scale",
}: {
  label: string;
  value: number | null;
  statement: string;
  tone?: ChipTone;
}) => {
  const pct = value === null ? 0 : Math.round(value * 100);
  const toneClass =
    tone === "density"
      ? "from-violet-600 to-amber-400"
      : tone === "land"
      ? "from-emerald-500 to-teal-400"
      : "from-indigo-600 to-blue-400";
  return (
    <div className="rounded-[24px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-700">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-slate-500">
          {value === null ? INTELLIGENCE_LABELS.disclosureMissing : `${pct}%`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className={cn("h-2 rounded-full bg-gradient-to-r", toneClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{statement}</p>
    </div>
  );
};

export const RiskChip = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => {
  const normalized = value?.toLowerCase() ?? "";
  const displayValue =
    normalized.includes("high") || normalized.includes("structural")
      ? "Structural"
      : normalized.includes("moderate")
      ? "Moderate"
      : normalized.includes("low")
      ? "Low"
      : "Elevated";
  const tone =
    displayValue === "Structural"
      ? { backgroundColor: "#7F1D1D", color: "#F8FAFC" }
      : displayValue === "Elevated"
      ? { backgroundColor: "#DC2626", color: "#FEF2F2" }
      : displayValue === "Moderate"
      ? { backgroundColor: "#F59E0B", color: "#1F2937" }
      : { backgroundColor: "#16A34A", color: "#F0FDF4" };
  const dotTone =
    displayValue === "Structural"
      ? "#7F1D1D"
      : displayValue === "Elevated"
      ? "#DC2626"
      : displayValue === "Moderate"
      ? "#F59E0B"
      : "#16A34A";
  return (
    <div className="rounded-[24px] border border-white/60 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <p className="text-xs text-slate-500">{label}</p>
      <div
        className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
        style={tone}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotTone }} />
        {displayValue}
      </div>
    </div>
  );
};
