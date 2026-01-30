import type { VillaIntelligenceProfile } from "@/types/villaIntelligenceProfile";
import { PLATFORM_LAYERS } from "@/constants/intelligenceLanguage";
import {
  Chip,
  renderCompactnessBand,
  renderDensityClass,
  renderLandStrengthClass,
  renderScaleClass,
} from "./visuals";

interface IntelligenceHeaderProps {
  profile: VillaIntelligenceProfile;
  microMarket?: string | null;
  reraStatus?: string | null;
}

export default function IntelligenceHeader({
  profile,
  microMarket,
  reraStatus,
}: IntelligenceHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 text-white shadow-[0_24px_60px_rgba(15,23,42,0.3)]">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/30 to-amber-400/20 blur-3xl" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-300">
        {PLATFORM_LAYERS.villaFile}
      </p>
      <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">
        {profile.project.name}
      </h1>
      <div className="mt-3 text-sm text-slate-200">
        {PLATFORM_LAYERS.city}
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
        {microMarket ?? profile.project.city ?? "Unknown city"} · Telangana RERA ·{" "}
        {reraStatus ?? "Under RERA Review"}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {profile.density_class ? (
          <Chip tone="density">{renderDensityClass(profile.density_class)}</Chip>
        ) : null}
        {profile.land_strength_class ? (
          <Chip tone="land">{renderLandStrengthClass(profile.land_strength_class)}</Chip>
        ) : null}
        {profile.scale_class ? (
          <Chip tone="scale">{renderScaleClass(profile.scale_class)}</Chip>
        ) : null}
        {profile.compactness_band ? (
          <Chip tone="compactness">{renderCompactnessBand(profile.compactness_band)}</Chip>
        ) : null}
      </div>
    </section>
  );
}
