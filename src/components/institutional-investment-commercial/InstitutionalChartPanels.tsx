"use client";

import dynamic from "next/dynamic";

export const InflowGrowthChart = dynamic(
  () =>
    import("@/components/institutional-investment-commercial/InstitutionalCharts").then(
      (mod) => mod.InflowGrowthChart
    ),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-800/70" /> }
);

export const YieldArbitrageChart = dynamic(
  () =>
    import("@/components/institutional-investment-commercial/InstitutionalCharts").then(
      (mod) => mod.YieldArbitrageChart
    ),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-800/70" /> }
);

export const GCCShareChart = dynamic(
  () =>
    import("@/components/institutional-investment-commercial/InstitutionalCharts").then(
      (mod) => mod.GCCShareChart
    ),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-800/70" /> }
);

export const NetAbsorptionChart = dynamic(
  () =>
    import("@/components/institutional-investment-commercial/InstitutionalCharts").then(
      (mod) => mod.NetAbsorptionChart
    ),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-800/70" /> }
);
