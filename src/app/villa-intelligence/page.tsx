import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Villa Intelligence | Hyderabad Villa Market Insights | Westside Realty",
  description: "Explore villa price trends, appreciation data and investment insights in Kokapet, Gandipet and West Hyderabad. Expert villa market intelligence by Westside Realty.",
};

import Link from "next/link";
import VillaIntelligenceHero from "@/components/villa-intelligence/Hero";
import CityLandDensityOverview from "@/components/villa-intelligence/CityLandDensityOverview";
import EcosystemTypologies from "@/components/villa-intelligence/EcosystemTypologies";
import LandSpatialFootprint from "@/components/villa-intelligence/LandSpatialFootprint";
import LandStressSignals from "@/components/villa-intelligence/LandStressSignals";
import IntelligenceIndex from "@/components/villa-intelligence/IntelligenceIndex";
import InterpretationFooter from "@/components/villa-intelligence/InterpretationFooter";
import { JsonLd } from "@/components/common/SEO";
import {
  normalizeDensityClass,
  normalizeLandStrength,
  normalizeScaleClass,
} from "@/constants/intelligenceLanguage";
import { intelligenceDashboardService } from "@/services/intelligenceDashboardService";

const toPercent = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

const formatNumber = (value: number | null, decimals = 1) => {
  if (value === null || Number.isNaN(value)) return "Not disclosed";
  return Number(value.toFixed(decimals)).toLocaleString("en-IN");
};

export default async function VillaIntelligencePage() {
  const villaProjects = await intelligenceDashboardService.getVillaProjects("hyderabad");
  const totalProjects = villaProjects.length;
  const villasPerAcreValues = villaProjects
    .map((project) => project.villasPerAcre)
    .filter((value): value is number => value !== null);
  const averageVillasPerAcre = villasPerAcreValues.length
    ? formatNumber(
        villasPerAcreValues.reduce((sum, value) => sum + value, 0) /
          villasPerAcreValues.length
      )
    : "Not disclosed";

  const landStrengthCounts = villaProjects.reduce<Record<string, number>>(
    (acc, project) => {
      const normalized = normalizeLandStrength(project.landStrengthClass);
      if (!normalized) return acc;
      acc[normalized] = (acc[normalized] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const dominantLandPosture =
    Object.entries(landStrengthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Balanced";

  const scaleCounts = villaProjects.reduce<Record<string, number>>((acc, project) => {
    const normalized = normalizeScaleClass(project.scaleClass);
    if (!normalized) return acc;
    acc[normalized] = (acc[normalized] ?? 0) + 1;
    return acc;
  }, {});
  const dominantScaleClass =
    Object.entries(scaleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Gated community";

  const densityDistribution = ["Estate", "Low", "Medium", "High", "Extreme"].map((label) => {
    const count = villaProjects.filter(
      (project) => normalizeDensityClass(project.densityClass) === label
    ).length;
    return {
      label,
      count,
      percent: toPercent(count, totalProjects),
    };
  });

  const landDistribution = ["Ultra-abundant", "Abundant", "Balanced", "Stressed", "Severely stressed"].map((label) => {
    const count = villaProjects.filter(
      (project) => normalizeLandStrength(project.landStrengthClass) === label
    ).length;
    return {
      label,
      count,
      percent: toPercent(count, totalProjects),
    };
  });

  const posture = `${dominantLandPosture} land posture with ${dominantScaleClass} dominance`;

  const typologyImplications: Record<string, string> = {
    "Boutique land estates":
      "Low-density estates prioritizing space, privacy, and land-backed living.",
    "Gated villa communities":
      "Balanced systems with moderate density and shared community reliance.",
    "Villa townships":
      "Large-scale ecosystems with layered amenities and coordinated land planning.",
    "Mega horizontal ecosystems":
      "City-scale villa systems where land compression and infrastructure orchestration converge.",
  };

  const typologies = [
    {
      title: "Boutique land estates",
      scale: "Boutique enclave",
      density: "Low",
      land: "Abundant",
    },
    {
      title: "Gated villa communities",
      scale: "Gated community",
      density: "Medium",
      land: "Balanced",
    },
    {
      title: "Villa townships",
      scale: "Villa township",
      density: "Medium",
      land: "Balanced",
    },
    {
      title: "Mega horizontal ecosystems",
      scale: "Mega ecosystem",
      density: "High",
      land: "Stressed",
    },
  ].map((typology) => {
    const projects = villaProjects.filter(
      (project) => normalizeScaleClass(project.scaleClass) === typology.scale
    );
    const densityBand =
      projects.length > 0
        ? projects
            .reduce<Record<string, number>>((acc, project) => {
              const normalized = normalizeDensityClass(project.densityClass);
              if (!normalized) return acc;
              acc[normalized] = (acc[normalized] ?? 0) + 1;
              return acc;
            }, {})
        : null;
    const dominantDensity =
      densityBand && Object.entries(densityBand).sort((a, b) => b[1] - a[1])[0]?.[0];
    const landBand =
      projects.length > 0
        ? projects
            .reduce<Record<string, number>>((acc, project) => {
              const normalized = normalizeLandStrength(project.landStrengthClass);
              if (!normalized) return acc;
              acc[normalized] = (acc[normalized] ?? 0) + 1;
              return acc;
            }, {})
        : null;
    const dominantLand =
      landBand && Object.entries(landBand).sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      title: typology.title,
      count: projects.length,
      typicalDensity: dominantDensity ?? typology.density,
      typicalLandPosture: dominantLand ?? typology.land,
      implication: typologyImplications[typology.title],
    };
  });

  const landPerVillaDistribution = [
    { label: "< 4,500 sq.ft", min: 0, max: 4499 },
    { label: "4,500–5,500 sq.ft", min: 4500, max: 5500 },
    { label: "5,500–6,500 sq.ft", min: 5501, max: 6500 },
    { label: "6,500+ sq.ft", min: 6501, max: 10000 },
  ].map((range) => {
    const count = villaProjects.filter(
      (project) =>
        project.landPerVillaSqft !== null &&
        project.landPerVillaSqft >= range.min &&
        project.landPerVillaSqft <= range.max
    ).length;
    return {
      label: range.label,
      count,
      percent: toPercent(count, totalProjects),
    };
  });

  const villasPerAcreDistribution = [
    { label: "< 6 villas/acre", min: 0, max: 5.9 },
    { label: "6–8 villas/acre", min: 6, max: 8 },
    { label: "8–10 villas/acre", min: 8.1, max: 10 },
    { label: "10+ villas/acre", min: 10.1, max: 30 },
  ].map((range) => {
    const count = villaProjects.filter(
      (project) =>
        project.villasPerAcre !== null &&
        project.villasPerAcre >= range.min &&
        project.villasPerAcre <= range.max
    ).length;
    return {
      label: range.label,
      count,
      percent: toPercent(count, totalProjects),
    };
  });

  const landScaleDistribution = [
    { label: "< 20 acres", min: 0, max: 19.9 },
    { label: "20–40 acres", min: 20, max: 40 },
    { label: "40–70 acres", min: 40.1, max: 70 },
    { label: "70+ acres", min: 70.1, max: 200 },
  ].map((range) => {
    const count = villaProjects.filter(
      (project) =>
        project.totalLandAcres !== null &&
        project.totalLandAcres >= range.min &&
        project.totalLandAcres <= range.max
    ).length;
    return {
      label: range.label,
      count,
      percent: toPercent(count, totalProjects),
    };
  });

  const landStressedShare = toPercent(
    villaProjects.filter((project) =>
      ["Stressed", "Severely stressed"].includes(
        normalizeLandStrength(project.landStrengthClass) ?? ""
      )
    ).length,
    totalProjects
  );
  const mediumHighDensityShare = toPercent(
    villaProjects.filter((project) => project.villasPerAcre !== null && project.villasPerAcre >= 8)
      .length,
    totalProjects
  );
  const townshipShare = toPercent(
    villaProjects.filter((project) => normalizeScaleClass(project.scaleClass) === "Villa township")
      .length,
    totalProjects
  );
  const townshipShift = townshipShare >= 40 ? "Accelerating" : "Moderate";

  const compactingTrends =
    mediumHighDensityShare >= 45
      ? "Density is compressing, with a rising share of medium to high intensity systems."
      : "Compression remains moderate with balanced land distribution.";
  const townshipDominance =
    townshipShare >= 40
      ? "Townships now anchor the market scale, overtaking boutique systems."
      : "Township presence is growing but not yet dominant.";
  const estateDisappearance =
    landStressedShare >= 35
      ? "Land-abundant estates are thinning as land strength tightens."
      : "Land-abundant estates remain visible across key corridors.";

  const groupedProjects = {
    "Land-abundant ecosystems": [] as typeof villaProjects,
    "Balanced townships": [] as typeof villaProjects,
    "Compact villa systems": [] as typeof villaProjects,
    "Mega horizontal developments": [] as typeof villaProjects,
  };

  villaProjects.forEach((project) => {
    const normalizedScale = normalizeScaleClass(project.scaleClass);
    const normalizedLand = normalizeLandStrength(project.landStrengthClass);
    if (normalizedScale === "Mega ecosystem") {
      groupedProjects["Mega horizontal developments"].push(project);
    } else if (normalizedLand === "Abundant" || normalizedLand === "Ultra-abundant") {
      groupedProjects["Land-abundant ecosystems"].push(project);
    } else if (normalizedScale === "Villa township") {
      groupedProjects["Balanced townships"].push(project);
    } else {
      groupedProjects["Compact villa systems"].push(project);
    }
  });

  const groups = [
    {
      title: "Land-abundant ecosystems",
      description: "Highest land support with low density posture.",
      projects: groupedProjects["Land-abundant ecosystems"],
    },
    {
      title: "Balanced townships",
      description: "Township-scale systems with stable land posture.",
      projects: groupedProjects["Balanced townships"],
    },
    {
      title: "Compact villa systems",
      description: "Rising density with tighter land support.",
      projects: groupedProjects["Compact villa systems"],
    },
    {
      title: "Mega horizontal developments",
      description: "Largest land systems with coordinated infrastructure.",
      projects: groupedProjects["Mega horizontal developments"],
    },
  ];

  return (
    <main className="bg-slate-50 text-slate-900">
      <JsonLd jsonLd={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
          { "@type": "ListItem", position: 2, name: "Villa Intelligence", item: "https://www.westsiderealty.in/villa-intelligence" },
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
      <VillaIntelligenceHero
        totalProjects={totalProjects}
        averageVillasPerAcre={averageVillasPerAcre}
        dominantLandPosture={dominantLandPosture}
        dominantScaleClass={dominantScaleClass}
      />
      <CityLandDensityOverview
        densityDistribution={densityDistribution}
        landDistribution={landDistribution}
        posture={posture}
      />
      <EcosystemTypologies typologies={typologies} />
      <LandSpatialFootprint
        landPerVilla={landPerVillaDistribution}
        villasPerAcre={villasPerAcreDistribution}
        landScale={landScaleDistribution}
        compactingTrends={compactingTrends}
        townshipDominance={townshipDominance}
        estateDisappearance={estateDisappearance}
      />
      <LandStressSignals
        landStressedShare={landStressedShare}
        mediumHighDensityShare={mediumHighDensityShare}
        townshipShift={townshipShift}
      />
      <IntelligenceIndex groups={groups} />
      <InterpretationFooter />
    </main>
  );
}
