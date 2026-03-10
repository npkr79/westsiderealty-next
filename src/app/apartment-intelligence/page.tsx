import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apartment Intelligence | Hyderabad Apartment Market Insights | Westside Realty",
  description: "Track Hyderabad apartment prices, trends and investment insights across Gachibowli, Kokapet, Kondapur and HITEC City. Data-driven intelligence by Westside Realty.",
};

import Link from "next/link";
import ApartmentIntelligenceHero from "@/components/apartment-intelligence/Hero";
import CityVerticalLoadOverview from "@/components/apartment-intelligence/CityVerticalLoadOverview";
import SystemTypologies from "@/components/apartment-intelligence/SystemTypologies";
import VerticalIntensityLandscape from "@/components/apartment-intelligence/VerticalIntensityLandscape";
import StressSignals from "@/components/apartment-intelligence/StressSignals";
import IntelligenceIndex from "@/components/apartment-intelligence/IntelligenceIndex";
import InterpretationFooter from "@/components/apartment-intelligence/InterpretationFooter";
import { intelligenceDashboardService } from "@/services/intelligenceDashboardService";
import { JsonLd } from "@/components/common/SEO";

const heightBandLabel = (band: string) => {
  if (band === "unknown") return "Undisclosed";
  if (band === "low-rise") return "Low-rise";
  if (band === "mid-rise") return "Mid-rise";
  if (band === "high-rise") return "High-rise";
  return "Super-high-rise";
};

const toPercent = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

const heightBandForFloors = (floors: number | null) => {
  if (!floors) return "unknown";
  if (floors <= 5) return "low-rise";
  if (floors <= 12) return "mid-rise";
  if (floors <= 25) return "high-rise";
  return "super-high-rise";
};

const wdiGradeForScore = (score: number | null) => {
  if (score === null || Number.isNaN(score)) return "Not disclosed";
  if (score <= 20) return "Light";
  if (score <= 40) return "Balanced";
  if (score <= 60) return "Moderately Stressed";
  if (score <= 80) return "High Stress";
  return "Extreme Stress";
};

export default async function ApartmentIntelligencePage() {
  const apartmentProjects = await intelligenceDashboardService.getApartmentProjects("hyderabad");
  const totalProjects = apartmentProjects.length;
  const scoredProjects = apartmentProjects.filter((project) => project.wdiScore !== null);
  const averageWdi = scoredProjects.length
    ? Math.round(
        scoredProjects.reduce((sum, project) => sum + (project.wdiScore ?? 0), 0) /
          scoredProjects.length
      )
    : 0;
  const highStressCount = scoredProjects.filter(
    (project) => ["High Stress", "Extreme Stress"].includes(wdiGradeForScore(project.wdiScore))
  ).length;
  const highStressShare = toPercent(highStressCount, totalProjects);

  const heightBands = apartmentProjects.reduce<Record<string, number>>((acc, project) => {
    const band = heightBandForFloors(project.floors);
    acc[band] = (acc[band] ?? 0) + 1;
    return acc;
  }, {});

  const dominantHeightBand =
    Object.entries(heightBands).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "high-rise";

  const wdiGrades = ["Light", "Balanced", "Moderately Stressed", "High Stress", "Extreme Stress"];
  const distribution = wdiGrades.map((grade) => {
    const count = apartmentProjects.filter(
      (project) => wdiGradeForScore(project.wdiScore) === grade
    ).length;
    return {
      label: grade,
      count,
      percent: toPercent(count, totalProjects),
    };
  });

  const posture = `${wdiGradeForScore(averageWdi)} posture`;
  const interpretation =
    highStressShare >= 50
      ? "High-stress vertical load dominates, signaling intense shared-system dependence."
      : highStressShare >= 30
      ? "The city is balanced with rising tower load in key micro-markets."
      : "The city remains moderate with isolated pockets of vertical stress.";

  const typologyImplications: Record<string, string> = {
    "low-rise": "Walkable, lower vertical dependence with lighter shared-system load.",
    "mid-rise": "Moderate vertical reliance with consistent shared infrastructure demand.",
    "high-rise": "Elevated vertical dependence where lift and podium systems are central.",
    "super-high-rise":
      "High-intensity vertical dependency requiring orchestration of multiple shared systems.",
  };

  const typologies = ["low-rise", "mid-rise", "high-rise", "super-high-rise"].map((band) => {
    const projects = apartmentProjects.filter(
      (project) => heightBandForFloors(project.floors) === band
    );
    const avgBandWdi =
      projects.length > 0
        ? Math.round(
            projects.reduce((sum, project) => sum + (project.wdiScore ?? 0), 0) /
              projects.length
          )
        : 0;
    return {
      title: `${heightBandLabel(band)} systems`,
      count: projects.length,
      typicalBand: projects.length ? wdiGradeForScore(avgBandWdi) : "Data pending",
      implication: typologyImplications[band],
    };
  });

  const heightDistribution = ["low-rise", "mid-rise", "high-rise", "super-high-rise"].map(
    (band) => ({
      label: heightBandLabel(band),
      count: heightBands[band] ?? 0,
      percent: toPercent(heightBands[band] ?? 0, totalProjects),
    })
  );

  const unitsDistribution = [
    { label: "< 70 units/acre", min: 0, max: 69 },
    { label: "70–90 units/acre", min: 70, max: 90 },
    { label: "90–110 units/acre", min: 91, max: 110 },
    { label: "110+ units/acre", min: 111, max: 1000 },
  ].map((range) => {
    const count = apartmentProjects.filter(
      (project) =>
        project.unitsPerAcre !== null &&
        project.unitsPerAcre >= range.min &&
        project.unitsPerAcre <= range.max
    ).length;
    return {
      label: range.label,
      count,
      percent: toPercent(count, totalProjects),
    };
  });

  const towerDistribution = [
    { label: "1–3 towers", min: 1, max: 3 },
    { label: "4–6 towers", min: 4, max: 6 },
    { label: "7–10 towers", min: 7, max: 10 },
    { label: "11+ towers", min: 11, max: 100 },
  ].map((range) => {
    const count = apartmentProjects.filter(
      (project) =>
        project.towers !== null &&
        project.towers >= range.min &&
        project.towers <= range.max
    ).length;
    return {
      label: range.label,
      count,
      percent: toPercent(count, totalProjects),
    };
  });

  const superHighRiseClusters = Array.from(
    new Set(
      apartmentProjects
        .filter((project) => project.floors !== null && project.floors >= 30)
        .map((project) => project.microMarket)
        .filter((value): value is string => Boolean(value))
    )
  );
  const hyperDensePockets = Array.from(
    new Set(
      apartmentProjects
        .filter((project) => project.unitsPerAcre !== null && project.unitsPerAcre >= 115)
        .map((project) => project.microMarket)
        .filter((value): value is string => Boolean(value))
    )
  );

  const extremeCrowdingShare = toPercent(
    apartmentProjects.filter(
      (project) => project.unitsPerAcre !== null && project.unitsPerAcre >= 120
    ).length,
    totalProjects
  );
  const extremeTowerLoadShare = toPercent(
    apartmentProjects.filter(
      (project) => project.unitsPerTower !== null && project.unitsPerTower >= 260
    ).length,
    totalProjects
  );
  const stressZones = Array.from(
    new Set(
      apartmentProjects
        .filter(
          (project) =>
            project.wdiScore !== null &&
            project.wdiScore >= 80 &&
            project.floors !== null &&
            project.floors >= 30
        )
        .map((project) => project.microMarket)
        .filter((value): value is string => Boolean(value))
    )
  );

  const groupedProjects = {
    "Extreme structural load systems": [] as typeof apartmentProjects,
    "Super-high-rise ecosystems": [] as typeof apartmentProjects,
    "Balanced apartment communities": [] as typeof apartmentProjects,
    "Land-stressed vertical projects": [] as typeof apartmentProjects,
  };

  apartmentProjects.forEach((project) => {
    if (project.wdiScore !== null && project.wdiScore >= 85) {
      groupedProjects["Extreme structural load systems"].push(project);
    } else if (project.floors !== null && project.floors >= 30) {
      groupedProjects["Super-high-rise ecosystems"].push(project);
    } else if (project.landPerUnitSqft !== null && project.landPerUnitSqft < 550) {
      groupedProjects["Land-stressed vertical projects"].push(project);
    } else {
      groupedProjects["Balanced apartment communities"].push(project);
    }
  });

  const groups = [
    {
      title: "Extreme structural load systems",
      description: "Highest WDI scores with compounding density and tower load.",
      projects: groupedProjects["Extreme structural load systems"],
    },
    {
      title: "Super-high-rise ecosystems",
      description: "Tallest vertical systems with elevated infrastructure reliance.",
      projects: groupedProjects["Super-high-rise ecosystems"],
    },
    {
      title: "Balanced apartment communities",
      description: "Mid-band systems with manageable shared load and stability.",
      projects: groupedProjects["Balanced apartment communities"],
    },
    {
      title: "Land-stressed vertical projects",
      description: "Tight land support with elevated density pressure.",
      projects: groupedProjects["Land-stressed vertical projects"],
    },
  ];

  return (
    <main className="bg-slate-50 text-slate-900">
      <JsonLd jsonLd={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
          { "@type": "ListItem", position: 2, name: "Apartment Intelligence", item: "https://www.westsiderealty.in/apartment-intelligence" },
        ],
      }} />
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <Link
          href="/residential-intelligence"
          className="text-xs uppercase tracking-[0.24em] text-slate-500 transition hover:text-slate-800"
        >
          ← Back to Hyderabad Residential Intelligence
        </Link>
      </div>
      <ApartmentIntelligenceHero
        totalProjects={totalProjects}
        averageWdi={averageWdi}
        highStressShare={highStressShare}
        dominantHeightBand={heightBandLabel(dominantHeightBand)}
      />
      <CityVerticalLoadOverview
        distribution={distribution}
        posture={posture}
        interpretation={interpretation}
      />
      <SystemTypologies typologies={typologies} />
      <VerticalIntensityLandscape
        heightDistribution={heightDistribution}
        unitsDistribution={unitsDistribution}
        towerDistribution={towerDistribution}
        superHighRiseClusters={superHighRiseClusters}
        hyperDensePockets={hyperDensePockets}
      />
      <StressSignals
        extremeCrowdingShare={extremeCrowdingShare}
        extremeTowerLoadShare={extremeTowerLoadShare}
        stressZones={stressZones}
      />
      <IntelligenceIndex
        groups={groups}
        systemClassForProject={(project) => heightBandLabel(heightBandForFloors(project.floors))}
        wdiGradeForProject={(project) => wdiGradeForScore(project.wdiScore)}
      />
      <InterpretationFooter />
    </main>
  );
}
