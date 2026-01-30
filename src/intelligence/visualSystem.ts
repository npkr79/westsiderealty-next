export type StressBand = "LIGHT" | "BALANCED" | "MODERATE" | "HIGH" | "EXTREME";

type StressColorSet = {
  label: StressBand;
  badge: string;
  text: string;
  bar: string;
  dot: string;
  track: string;
  fill: string;
  gradient: string;
  border: string;
};

const STRESS_BANDS: Array<{ min: number; max: number; colors: StressColorSet }> = [
  {
    min: 0,
    max: 20,
    colors: {
      label: "LIGHT",
      badge: "bg-slate-100 text-slate-700",
      text: "text-slate-700",
      bar: "bg-slate-400",
      dot: "bg-slate-400",
      track: "bg-slate-100",
      fill: "bg-slate-400",
      gradient: "from-slate-50 via-white to-white",
      border: "border-slate-200",
    },
  },
  {
    min: 21,
    max: 40,
    colors: {
      label: "BALANCED",
      badge: "bg-teal-100 text-teal-700",
      text: "text-teal-700",
      bar: "bg-teal-500",
      dot: "bg-teal-500",
      track: "bg-teal-50",
      fill: "bg-teal-500",
      gradient: "from-teal-50 via-white to-white",
      border: "border-teal-200",
    },
  },
  {
    min: 41,
    max: 60,
    colors: {
      label: "MODERATE",
      badge: "bg-indigo-100 text-indigo-700",
      text: "text-indigo-700",
      bar: "bg-indigo-500",
      dot: "bg-indigo-500",
      track: "bg-indigo-50",
      fill: "bg-indigo-500",
      gradient: "from-indigo-50 via-white to-white",
      border: "border-indigo-200",
    },
  },
  {
    min: 61,
    max: 80,
    colors: {
      label: "HIGH",
      badge: "bg-amber-100 text-amber-700",
      text: "text-amber-700",
      bar: "bg-amber-500",
      dot: "bg-amber-500",
      track: "bg-amber-50",
      fill: "bg-amber-500",
      gradient: "from-amber-50 via-white to-white",
      border: "border-amber-200",
    },
  },
  {
    min: 81,
    max: 100,
    colors: {
      label: "EXTREME",
      badge: "bg-red-100 text-red-700",
      text: "text-red-700",
      bar: "bg-red-500",
      dot: "bg-red-500",
      track: "bg-red-50",
      fill: "bg-red-500",
      gradient: "from-red-50 via-white to-white",
      border: "border-red-200",
    },
  },
];

const resolveStressBand = (score: number): StressColorSet =>
  STRESS_BANDS.find((band) => score >= band.min && score <= band.max)?.colors ??
  STRESS_BANDS[0].colors;

export const getStressLabel = (score: number | null): StressBand =>
  resolveStressBand(score ?? 0).label;

export const getStressColor = (score: number | null): StressColorSet =>
  resolveStressBand(score ?? 0);

export const getStressGradient = (score: number | null): string =>
  resolveStressBand(score ?? 0).gradient;

export type DnaType = "density" | "vertical" | "land" | "scale";

export const getDnaColors = (type: DnaType) => {
  switch (type) {
    case "density":
      return {
        rail: "bg-amber-400",
        gradient: "from-amber-50 via-white to-white",
        border: "border-amber-200",
      };
    case "vertical":
      return {
        rail: "bg-violet-400",
        gradient: "from-violet-50 via-white to-white",
        border: "border-violet-200",
      };
    case "land":
      return {
        rail: "bg-emerald-400",
        gradient: "from-emerald-50 via-white to-white",
        border: "border-emerald-200",
      };
    case "scale":
    default:
      return {
        rail: "bg-blue-400",
        gradient: "from-blue-50 via-white to-white",
        border: "border-blue-200",
      };
  }
};

const densityLabelScores: Record<string, number> = {
  Estate: 15,
  Low: 30,
  Medium: 55,
  High: 80,
  Extreme: 100,
};

const verticalLabelScores: Record<string, number> = {
  "Low Rise": 20,
  "Mid Rise": 40,
  "High Rise": 70,
  "Super High Rise": 95,
};

const landLabelScores: Record<string, number> = {
  "Ultra Abundant": 10,
  Abundant: 25,
  Balanced: 50,
  Stressed: 75,
  "Severely Stressed": 95,
};

const scaleLabelScores: Record<string, number> = {
  "Boutique Enclave": 20,
  "Gated Community": 45,
  "Villa Township": 70,
  "Mega Ecosystem": 95,
};

export const getSeverityScoreForClassification = (
  type: DnaType,
  label: string | null
): number | null => {
  if (!label) return null;
  const normalized = label
    .split(/[-\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .filter(Boolean)
    .join(" ");
  const map =
    type === "density"
      ? densityLabelScores
      : type === "vertical"
      ? verticalLabelScores
      : type === "land"
      ? landLabelScores
      : scaleLabelScores;
  return map[normalized] ?? null;
};
