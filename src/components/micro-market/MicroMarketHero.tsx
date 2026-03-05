"use client";

import type { HeroSnapshot } from "@/services/microMarketViewModel";

interface MicroMarketHeroProps {
  hero: HeroSnapshot;
  cityName: string;
  mapEmbedUrl?: string | null;
}

function formatPrice(min: number | null, max: number | null): string {
  if (min != null && max != null) return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}/sqft`;
  if (min != null) return `₹${min.toLocaleString("en-IN")}/sqft+`;
  if (max != null) return `Up to ₹${max.toLocaleString("en-IN")}/sqft`;
  return "Price on request";
}

function formatPct(min: number | null, max: number | null, suffix = ""): string {
  if (min != null && max != null) return `${min}% – ${max}%${suffix}`;
  if (min != null) return `${min}%+${suffix}`;
  if (max != null) return `Up to ${max}%${suffix}`;
  return "—";
}

const signalBadges: Array<{ key: keyof HeroSnapshot["keySignals"]; label: string }> = [
  { key: "cycleStage", label: "Cycle stage" },
  { key: "entryPhase", label: "Entry phase" },
  { key: "institutionalConfidence", label: "Institutional confidence" },
  { key: "capitalMomentum", label: "Capital momentum" },
];

export default function MicroMarketHero({ hero, cityName, mapEmbedUrl }: MicroMarketHeroProps) {
  const priceStr = formatPrice(hero.priceRange.min, hero.priceRange.max);
  const growthStr = formatPct(hero.growth.min, hero.growth.max, " YoY");
  const rentalStr = formatPct(hero.rental.min, hero.rental.max, " yield");

  const badgesWithValues = signalBadges
    .map(({ key, label }) => {
      const value = hero.keySignals[key];
      return value ? { label, value } : null;
    })
    .filter((b): b is { label: string; value: string } => Boolean(b));

  return (
    <section className="relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-8 text-slate-100 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.06)_0%,rgba(15,23,42,0)_45%,rgba(99,102,241,0.1)_100%)]" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:38px_38px] sm:block" />
      </div>

      <div className="relative space-y-6">
        <div>
          <div className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
            Investment corridor
          </div>
          <h1 className="mt-3 block text-[2.15rem] font-semibold leading-[1.04] tracking-[-0.015em] text-white sm:text-4xl lg:text-[2.9rem]">
            {hero.name}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-300 sm:text-base">{cityName}</p>
        </div>

        {hero.hook && (
          <p className="max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">{hero.hook}</p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Price range", value: priceStr },
            { label: "Growth", value: growthStr },
            { label: "Rental yield", value: rentalStr },
          ].map((metric) => (
            <div
              key={metric.label}
              className="group min-w-0 rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 shadow-[0_8px_24px_rgba(2,6,23,0.3)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-300">
                {metric.label}
              </p>
              <p className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug text-white sm:text-xl">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {badgesWithValues.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
              Key signals
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {badgesWithValues.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2.5"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    {badge.label}
                  </span>
                  <span className="text-sm font-semibold text-white">{badge.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mapEmbedUrl && (
          <div className="rounded-xl border border-white/15 bg-white/5 overflow-hidden">
            <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
              Location
            </p>
            <div className="relative aspect-video w-full">
              <iframe
                src={mapEmbedUrl}
                title={`${hero.name} location map`}
                loading="lazy"
                className="h-full w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
