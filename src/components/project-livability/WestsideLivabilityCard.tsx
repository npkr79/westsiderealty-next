import { Info } from "lucide-react";
import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";
import { computeWestsideLivabilityIndex } from "@/intelligence/westsideLivabilityIndex";
import LivabilityMetric from "./LivabilityMetric";
import LivabilityLegend from "./LivabilityLegend";

interface WestsideLivabilityCardProps {
  intelligence: ProjectIntelligenceResult;
}

export default function WestsideLivabilityCard({ intelligence }: WestsideLivabilityCardProps) {
  const index = computeWestsideLivabilityIndex(intelligence);
  const formatNumber = (v: number | null, d: number = 0) =>
    v === null ? null : Number(v.toFixed(d)).toLocaleString("en-IN");
  const unitsPerAcre = formatNumber(index.metrics.units_per_acre, 1);
  const unitsPerTower = formatNumber(index.metrics.units_per_tower, 0);
  const floorsPerTower = formatNumber(index.metrics.floors_per_tower, 1);
  const landPerUnit = formatNumber(index.metrics.land_per_unit_sqft, 0);

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="relative inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 group">
            <span>Westside Livability Index™</span>
            <span className="text-xs text-slate-400">ⓘ</span>
            <div className="absolute left-0 top-full z-10 mt-2 hidden w-80 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg group-hover:block">
              <p className="font-semibold text-slate-700">
                What is the Westside Livability Index™?
              </p>
              <p className="mt-1 leading-relaxed">
                The Westside Livability Index™ measures how shared, vertical, and
                infrastructure-dependent daily life is likely to feel in a residential project.
              </p>
              <p className="mt-2 leading-relaxed">
                It does not rate projects as good or bad.
              </p>
              <p className="mt-2 leading-relaxed">
                It classifies lifestyle types — from estate-style communities to dense vertical
                ecosystems — using verified regulatory data.
              </p>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            A lifestyle intelligence model by Westside Realty
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-bold tracking-tight text-slate-900">
              {index.index}
            </span>
            <span className="text-sm text-slate-600">/ 100</span>
          </div>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {index.band}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            This score reflects how intense shared living is likely to feel in this project — based
            on crowding, tower scale, vertical dependence, and land pressure.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Not good or bad — this describes the living environment, not quality.
          </p>
        </div>
        <div className="relative group">
          <Info className="h-4 w-4 text-slate-400" />
          <div className="hidden group-hover:block">
            <LivabilityLegend />
          </div>
        </div>
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        <LivabilityMetric
          label="Crowding"
          score={index.crowd_score}
          meaning={index.explanations.crowding}
          value={unitsPerAcre ? `~${unitsPerAcre} homes per acre` : undefined}
          tooltip={{
            title: "Crowding (Homes per Acre)",
            description:
              "Measures how many homes exist per acre of land. Lower values feel more open. Higher values feel more active and community-dense.",
          }}
        />
        <LivabilityMetric
          label="Tower Load"
          score={index.tower_score}
          meaning={index.explanations.tower_load}
          value={unitsPerTower ? `~${unitsPerTower} homes per tower` : undefined}
          tooltip={{
            title: "Tower Load (Homes per Tower)",
            description:
              "Measures how many homes share each tower. Lower values mean fewer families per lobby and lift. Higher values indicate heavier shared usage.",
          }}
        />
        <LivabilityMetric
          label="Vertical Stress"
          score={index.vertical_score}
          meaning={index.explanations.vertical}
          value={floorsPerTower ? `~${floorsPerTower} floors per tower` : undefined}
          tooltip={{
            title: "Vertical Stress (Tower Height)",
            description:
              "Measures how tall the towers are. Lower values feel closer to low-rise living. Higher values increase lift dependence and vertical circulation.",
          }}
        />
        <LivabilityMetric
          label="Open Space Pressure"
          score={index.land_stress_score}
          meaning={index.explanations.land_stress}
          value={landPerUnit ? `~${landPerUnit} sq.ft land per home` : undefined}
          tooltip={{
            title: "Open Space Pressure (Land per Home)",
            description:
              "Measures how much land supports each home. Lower pressure means more breathing space per family. Higher pressure means tighter land sharing.",
          }}
        />
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">How Westside calculates this</p>
        <p className="mt-1 leading-relaxed">
          The Westside Livability Index is derived from Telangana RERA data using four
          structural dimensions: social crowding, tower load, vertical dependence,
          and open space pressure. These are computed from land area, unit counts,
          tower distribution, and building height — to describe how a project will
          feel to live in.
        </p>
      </div>
    </div>
  );
}
