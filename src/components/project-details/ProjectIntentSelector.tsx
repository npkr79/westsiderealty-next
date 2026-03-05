"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdvisoryTrackingContext, setAdvisoryTrackingContext, trackListingsEvent } from "@/lib/analytics/listingsTracking";

export type ListingIntent = "investment" | "end-use" | "upgrade" | "nri";

interface ProjectIntentSelectorProps {
  initialIntent: ListingIntent;
  variant?: "default" | "compact-dark";
}

const INTENT_OPTIONS: Array<{ id: ListingIntent; label: string }> = [
  { id: "investment", label: "Investment" },
  { id: "end-use", label: "End use" },
  { id: "upgrade", label: "Upgrade" },
  { id: "nri", label: "NRI purchase" },
];

export default function ProjectIntentSelector({ initialIntent, variant = "default" }: ProjectIntentSelectorProps) {
  const router = useRouter();
  const [intent, setIntent] = useState<ListingIntent>(initialIntent);

  const helper = useMemo(() => {
    if (intent === "investment") return "We will prioritize liquidity, execution confidence, and rental demand cues.";
    if (intent === "upgrade") return "We will prioritize lifestyle upgrades, sizing, and comfort-led fit.";
    if (intent === "nri") return "We will prioritize stability, developer reliability, and low-friction decision clarity.";
    return "We will prioritize livability, commute practicality, and family comfort factors.";
  }, [intent]);

  const handleIntent = (value: ListingIntent) => {
    setIntent(value);
    const context = getAdvisoryTrackingContext();
    setAdvisoryTrackingContext({ intent: value });
    trackListingsEvent("intent_selected", {
      intent: value,
      projectId: context.projectId || null,
      microMarket: context.microMarket || null,
      sessionId: context.sessionId,
    });
    if (typeof window !== "undefined") {
      document.cookie = `listing_intent=${value}; path=/; max-age=2592000; SameSite=Lax`;
      window.sessionStorage.setItem("listing_intent", value);
    }
    router.refresh();
  };

  return (
    <section
      className={
        variant === "compact-dark"
          ? "rounded-lg border border-white/20 bg-white/5 p-3"
          : "rounded-xl border border-slate-200 bg-white p-4"
      }
    >
      <p
        className={
          variant === "compact-dark"
            ? "text-[11px] font-semibold uppercase tracking-wide text-slate-300"
            : "text-xs font-semibold uppercase tracking-wide text-slate-500"
        }
      >
        Personalize your advisory view
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {INTENT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleIntent(option.id)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              intent === option.id
                ? variant === "compact-dark"
                  ? "border-white/40 bg-white/20 text-white"
                  : "border-slate-800 bg-slate-900 text-white"
                : variant === "compact-dark"
                  ? "border-white/25 bg-transparent text-slate-200 hover:bg-white/10"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className={variant === "compact-dark" ? "mt-2 text-[11px] text-slate-300/90" : "mt-3 text-xs text-slate-600"}>
        {helper}
      </p>
    </section>
  );
}

