import type { ProjectInsights } from "@/services/projectInsightsService";
import type { ListingIntent } from "@/components/project-details/ProjectIntentSelector";

interface ProjectCorridorStoryProps {
  insights: ProjectInsights;
  intent: ListingIntent;
  microMarketName: string;
}

export default function ProjectCorridorStory({
  insights,
  intent,
  microMarketName,
}: ProjectCorridorStoryProps) {
  const maturity = insights.marketBaseline.corridorMaturityLevel;
  const stage = insights.stageOfDevelopment;
  const positioning = insights.marketPositioning.label;
  const stageLine =
    stage === "ready"
      ? "Ready or near-ready supply often supports clearer decision confidence for both end-use and long-hold buyers."
      : stage === "under-construction"
        ? "Under-construction inventory in this corridor is typically evaluated through delivery discipline and execution visibility."
        : "Early-stage supply here is usually assessed with corridor conviction and developer reliability in mind.";
  const maturityLine =
    maturity === "mature"
      ? `${microMarketName} has a relatively mature base, where employment access and social infrastructure already support sustained demand.`
      : maturity === "transitioning"
        ? `${microMarketName} is in a transition phase, with improving infrastructure and expanding buyer confidence.`
        : maturity === "emerging"
          ? `${microMarketName} is still emerging, and long-term conviction is usually built around connectivity momentum and future livability depth.`
          : `${microMarketName} continues to attract practical buyer attention where connectivity and delivery confidence remain central.`;
  const demandLine =
    intent === "investment"
      ? "For investors, this corridor story is about dependable occupancy demand and disciplined entry selection."
      : intent === "nri"
        ? "For NRI buyers, corridor clarity usually comes from stable execution ecosystems and predictable end-user demand."
        : "For family buyers, corridor value usually compounds through access, schooling ecosystems, and neighborhood maturity.";
  const marketSignalLine = `Current corridor signal: ${insights.relativeComparison.stageVsMarket.summary}`;
  const wealthLine =
    positioning.includes("Premium")
      ? "Long-term wealth creation here is generally tied to sustained quality preference and trusted delivery ecosystems."
      : "Long-term wealth creation here is usually linked to steady end-use demand and corridor-wide livability improvements.";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Corridor wealth story</p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900">Why this corridor can matter over the next decade</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p>{maturityLine}</p>
        <p>{stageLine}</p>
        <p>{demandLine}</p>
        <p>{marketSignalLine}</p>
        <p>{wealthLine}</p>
      </div>
    </section>
  );
}

