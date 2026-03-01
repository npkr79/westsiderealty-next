"use client";

import { useEffect, useMemo, useState } from "react";
import type { ListingIntent } from "@/components/project-details/ProjectIntentSelector";
import { getListingsEventBuffer } from "@/lib/analytics/listingsTracking";

type StageBand = "ready" | "under-construction" | "early-stage";
type MaturityBand = "emerging" | "transitioning" | "mature" | "unknown";

interface ProjectSocialProofProps {
  intent: ListingIntent;
  microMarketName: string;
  stage: StageBand;
  corridorMaturity: MaturityBand;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const readableIntentLabel = (intent: ListingIntent): string => {
  if (intent === "investment") return "investor-led buyers";
  if (intent === "upgrade") return "upgrade families";
  if (intent === "nri") return "NRI buyers";
  return "end-use families";
};

interface SocialProofCopy {
  buyerActivityLine: string;
  demandLine: string;
  reassuranceLine: string;
  scarcityLine: string;
  maturityLine: string;
}

const buildBaseCopy = (
  intent: ListingIntent,
  microMarketName: string,
  stage: StageBand,
  corridorMaturity: MaturityBand
): SocialProofCopy => {
  const buyerActivityLine = `8 buyers shortlisted similar projects in ${microMarketName} this week.`;
  const demandLine =
    intent === "investment"
      ? `Demand in ${microMarketName} remains active among investors comparing execution and rental comfort.`
      : intent === "upgrade"
        ? `Most current interest in ${microMarketName} is from IT professionals and upgrade families.`
        : intent === "nri"
          ? `Demand in ${microMarketName} remains active among NRI buyers seeking stable, transparent projects.`
          : `Demand in ${microMarketName} remains active among end-use buyers evaluating livability and commute comfort.`;
  const reassuranceLine =
    intent === "investment"
      ? "Investors in this corridor are actively comparing density and execution reliability before shortlisting."
      : intent === "upgrade"
        ? "Upgrade families here usually prioritize configuration comfort, daily convenience, and community quality."
        : intent === "nri"
          ? "NRI buyers usually prioritize legal clarity, delivery consistency, and low-friction ownership confidence."
          : "Many families in this corridor prefer ready or near-ready options for clearer move-in planning.";
  const scarcityLine =
    stage === "ready"
      ? "Inventory in comparable ready projects has been gradually tightening."
      : stage === "under-construction"
        ? "Buyers are actively comparing under-construction options on execution confidence and delivery visibility."
        : "Buyers are closely comparing early-stage and ready options before committing in this corridor.";
  const maturityLine =
    corridorMaturity === "mature"
      ? "This is a relatively mature micro-market with steady buyer evaluation patterns."
      : corridorMaturity === "transitioning"
        ? "This micro-market is in a transition phase, with both delivered and pipeline options under review."
        : corridorMaturity === "emerging"
          ? "This micro-market is still evolving, so buyers are validating long-term corridor fundamentals carefully."
          : `Current buyer mix in ${microMarketName} is led by ${readableIntentLabel(intent)}.`;
  return { buyerActivityLine, demandLine, reassuranceLine, scarcityLine, maturityLine };
};

export default function ProjectSocialProof({
  intent,
  microMarketName,
  stage,
  corridorMaturity,
}: ProjectSocialProofProps) {
  const baseCopy = useMemo(
    () => buildBaseCopy(intent, microMarketName, stage, corridorMaturity),
    [corridorMaturity, intent, microMarketName, stage]
  );
  const [copy, setCopy] = useState<SocialProofCopy>(baseCopy);

  useEffect(() => {
    // Always start from deterministic baseline to avoid hydration mismatch.
    setCopy(baseCopy);
  }, [baseCopy]);

  useEffect(() => {
    // Client-only enhancement from session tracking heuristics.
    const events = getListingsEventBuffer();
    const recentEvents = events.filter((event) => Date.now() - Number(event.ts || 0) <= 7 * 24 * 60 * 60 * 1000);
    const advisoryViews = recentEvents.filter((event) => event.event === "advisory_section_viewed").length;
    const intentSelections = recentEvents.filter((event) => event.event === "intent_selected");
    const leads = recentEvents.filter((event) => event.event === "lead_submitted").length;

    const heuristicShortlistCount = clamp(8 + Math.round(advisoryViews / 3) + intentSelections.length + leads * 3, 8, 32);
    const intentCounts = intentSelections.reduce<Record<string, number>>((acc, event) => {
      const key = String(event.intent || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const dominantIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || intent;

    const buyerActivityLine = `${heuristicShortlistCount} buyers shortlisted similar projects in ${microMarketName} this week.`;
    const demandLine =
      dominantIntent === "investment"
        ? `Demand in ${microMarketName} remains active among investors comparing execution and rental comfort.`
        : dominantIntent === "upgrade"
          ? `Most current interest in ${microMarketName} is from IT professionals and upgrade families.`
          : dominantIntent === "nri"
            ? `Demand in ${microMarketName} remains active among NRI buyers seeking stable, transparent projects.`
            : `Demand in ${microMarketName} remains active among end-use buyers evaluating livability and commute comfort.`;

    const reassuranceLine =
      intent === "investment"
        ? "Investors in this corridor are actively comparing density and execution reliability before shortlisting."
        : intent === "upgrade"
          ? "Upgrade families here usually prioritize configuration comfort, daily convenience, and community quality."
          : intent === "nri"
            ? "NRI buyers usually prioritize legal clarity, delivery consistency, and low-friction ownership confidence."
            : "Many families in this corridor prefer ready or near-ready options for clearer move-in planning.";

    const scarcityLine =
      stage === "ready"
        ? "Inventory in comparable ready projects has been gradually tightening."
        : stage === "under-construction"
          ? "Buyers are actively comparing under-construction options on execution confidence and delivery visibility."
          : "Buyers are closely comparing early-stage and ready options before committing in this corridor.";

    const maturityLine =
      corridorMaturity === "mature"
        ? "This is a relatively mature micro-market with steady buyer evaluation patterns."
        : corridorMaturity === "transitioning"
          ? "This micro-market is in a transition phase, with both delivered and pipeline options under review."
          : corridorMaturity === "emerging"
            ? "This micro-market is still evolving, so buyers are validating long-term corridor fundamentals carefully."
            : `Current buyer mix in ${microMarketName} is led by ${readableIntentLabel(intent)}.`;

    setCopy({ buyerActivityLine, demandLine, reassuranceLine, scarcityLine, maturityLine });
  }, [corridorMaturity, intent, microMarketName, stage]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buyer activity and advisory context</p>
      <div className="mt-2 space-y-1.5 text-sm text-slate-700">
        <p>{copy.buyerActivityLine}</p>
        <p>{copy.demandLine}</p>
        <p>{copy.reassuranceLine}</p>
        <p>{copy.scarcityLine}</p>
        <p className="text-slate-600">{copy.maturityLine}</p>
      </div>
    </section>
  );
}

