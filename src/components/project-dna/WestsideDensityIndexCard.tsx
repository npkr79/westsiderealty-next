import type { WestsideDensityIndex } from "@/intelligence/westsideDensityIndex";
import {
  getStressColor,
  getStressGradient,
  getStressLabel,
} from "@/intelligence/visualSystem";
import { INTELLIGENCE_LABELS } from "@/constants/intelligenceLanguage";

interface WestsideDensityIndexCardProps {
  index: WestsideDensityIndex;
}

const formatScore = (value: number | null) =>
  value === null ? "Not structurally applicable" : `${Math.round(value)}`;

const ContributorRow = ({
  name,
  description,
  why,
  score,
  weight,
}: {
  name: string;
  description: string;
  why: string;
  score: number | null;
  weight: number;
}) => {
  const tone = getStressColor(score ?? 0);
  const severity = score === null ? "Not structurally applicable" : getStressLabel(score);
  return (
    <div className="space-y-2 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
          <span className="text-sm font-semibold text-slate-800">{name}</span>
          <span className="relative inline-flex items-center text-[11px] text-slate-400 group">
            ⓘ
            <span className="absolute left-0 top-full z-10 mt-2 hidden w-56 rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-600 shadow-lg group-hover:block">
              {why}
            </span>
          </span>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {Math.round(weight * 100)}% weight
          </p>
          <p className="text-xs font-semibold text-slate-700">{severity}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
      <div className={`h-2 w-full rounded-full ${tone.track}`}>
        <div
          className={`h-2 rounded-full ${tone.fill}`}
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{score === null ? "Not structurally applicable" : `${score} / 100`}</span>
        <span>{score === null ? "Not applicable" : `${severity} contributor`}</span>
      </div>
    </div>
  );
};

export default function WestsideDensityIndexCard({
  index,
}: WestsideDensityIndexCardProps) {
  const hasContributors = [
    index.crowding_score,
    index.tower_load_score,
    index.vertical_score,
    index.land_stress_score,
  ].some((value) => value !== null);
  const tone = getStressColor(index.score);
  const gradient = getStressGradient(index.score);
  const severityLabel = hasContributors
    ? index.grade
    : "Not disclosed in Telangana RERA structural disclosures.";
  const scoreDisplay = hasContributors ? formatScore(index.score) : "Not structurally applicable";
  const scoreSuffix = hasContributors ? " / 100" : "";
  const contributors = [
    {
      key: "crowding",
      name: "Crowding",
      description: "Population concentration pressure",
      why: "How tightly homes are packed into the available land.",
      weight: 0.35,
      score: index.crowding_score,
    },
    {
      key: "tower_load",
      name: "Tower load",
      description: "Homes per vertical core",
      why: "How much residential load each tower structurally carries.",
      weight: 0.25,
      score: index.tower_load_score,
    },
    {
      key: "vertical_stress",
      name: "Vertical stress",
      description: "Vertical dependence stress",
      why: "How tall the living system is and how dependent daily life is on lifts and stacking.",
      weight: 0.2,
      score: index.vertical_score,
    },
    {
      key: "land_stress",
      name: "Land stress",
      description: "Land consumption pressure",
      why: "How much physical land supports each home.",
      weight: 0.2,
      score: index.land_stress_score,
    },
  ];
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br ${gradient} p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)]`}
    >
      <div className={`absolute left-0 top-0 h-full w-2 ${tone.bar}`} />
      <div
        className={`absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br ${gradient} opacity-50 blur-3xl`}
      />
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/40 blur-3xl" />
      <div className="space-y-4 pl-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          {INTELLIGENCE_LABELS.wdi}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs text-slate-500">{INTELLIGENCE_LABELS.disclosure}</p>
            <div className="relative">
              <div className="absolute -left-8 -top-6 h-24 w-24 rounded-full bg-white/60 blur-2xl" />
              <p className="relative text-6xl font-semibold tracking-tight text-slate-900 md:text-7xl lg:text-8xl">
                {scoreDisplay}
                {scoreSuffix ? (
                  <span className="text-lg text-slate-500">{scoreSuffix}</span>
                ) : null}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${tone.badge} ${tone.border}`}
          >
            {severityLabel}
          </span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{index.explanation}</p>
        <p className="text-xs text-slate-500">{index.meaning}</p>
      </div>

      <div className="mt-6 grid gap-4">
        {contributors.map(({ key, ...props }) => (
          <ContributorRow key={key} {...props} />
        ))}
      </div>

      <div className="mt-5 text-xs text-slate-500">
        LIGHT · BALANCED · MODERATELY STRESSED · HIGH STRESS · EXTREME STRESS
      </div>
    </div>
  );
}
