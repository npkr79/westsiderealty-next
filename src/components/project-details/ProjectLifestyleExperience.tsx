import type { ProjectInsights } from "@/services/projectInsightsService";
import type { ListingIntent } from "@/components/project-details/ProjectIntentSelector";

interface ProjectLifestyleExperienceProps {
  insights: ProjectInsights;
  intent: ListingIntent;
}

const communityType = (
  density: "low" | "balanced" | "high",
  intent: ListingIntent
): string => {
  if (density === "low") return "Calm and family-oriented";
  if (density === "high") return intent === "investment" ? "Active and opportunity-driven" : "Active and social";
  return intent === "nri" ? "Balanced and curated" : "Balanced and community-friendly";
};

const lifestyleRhythm = (
  density: "low" | "balanced" | "high",
  maturity: "emerging" | "transitioning" | "mature" | "unknown"
): string => {
  if (density === "low" && maturity === "mature") return "Predictable and settled daily rhythm";
  if (density === "high" && maturity === "emerging") return "Fast-moving and young neighborhood rhythm";
  if (maturity === "transitioning") return "Evolving rhythm with improving convenience depth";
  return "Steady urban rhythm with practical day-to-day balance";
};

const privacyActivityLine = (density: "low" | "balanced" | "high"): string => {
  if (density === "low") return "Privacy usually feels stronger, with calmer shared spaces.";
  if (density === "high") return "Social activity is stronger, with livelier shared zones and higher movement.";
  return "Privacy and social activity are generally balanced for most households.";
};

const familyComfortLine = (
  livabilityBand: "low" | "medium" | "high",
  intent: ListingIntent
): string => {
  if (intent === "upgrade") {
    return livabilityBand === "high"
      ? "Upgrade families usually find stronger long-term comfort in this setup."
      : "Upgrade comfort can be good, with final confidence coming from layout and amenity fit.";
  }
  if (intent === "nri") {
    return "For remote decision-makers, this profile is typically easier to validate for stable family use.";
  }
  return livabilityBand === "high"
    ? "Family comfort signals are generally supportive for long-hold end use."
    : "Family comfort is moderate and best validated against your daily priorities.";
};

export default function ProjectLifestyleExperience({
  insights,
  intent,
}: ProjectLifestyleExperienceProps) {
  const community = communityType(insights.densityCategory, intent);
  const rhythm = lifestyleRhythm(insights.densityCategory, insights.marketBaseline.corridorMaturityLevel);
  const privacyActivity = privacyActivityLine(insights.densityCategory);
  const comfort = familyComfortLine(insights.livability.band, intent);
  const socialEnvironment =
    insights.marketBaseline.corridorMaturityLevel === "emerging"
      ? "Social environment is still forming, often led by younger buyer cohorts."
      : insights.marketBaseline.corridorMaturityLevel === "mature"
        ? "Social environment is relatively settled with clearer resident expectations."
        : "Social environment is evolving with a mix of early and established resident profiles.";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lifestyle experience</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900">How everyday life here is likely to feel</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Community type</p>
          <p className="mt-1 text-sm text-slate-700">{community}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Lifestyle rhythm</p>
          <p className="mt-1 text-sm text-slate-700">{rhythm}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Privacy vs activity</p>
          <p className="mt-1 text-sm text-slate-700">{privacyActivity}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Family comfort</p>
          <p className="mt-1 text-sm text-slate-700">{comfort}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{socialEnvironment}</p>
    </section>
  );
}

