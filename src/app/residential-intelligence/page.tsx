import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Residential Intelligence | Hyderabad Property Market Data | Westside Realty",
  description: "Comprehensive residential property intelligence for Hyderabad — prices, trends, project comparisons and neighbourhood insights to guide your investment.",
};

import CommandAccess from "@/components/residential-intelligence-dashboard/CommandAccess";
import CityPressureIndicators from "@/components/residential-intelligence-dashboard/CityPressureIndicators";
import DensityLandMatrix from "@/components/residential-intelligence-dashboard/DensityLandMatrix";
import FeaturedIntelligenceFiles from "@/components/residential-intelligence-dashboard/FeaturedIntelligenceFiles";
import ResidentialIntelligenceHero from "@/components/residential-intelligence-dashboard/Hero";
import InterpretationFooter from "@/components/residential-intelligence-dashboard/InterpretationFooter";
import StructuralComposition from "@/components/residential-intelligence-dashboard/StructuralComposition";
import SystemTypologies from "@/components/residential-intelligence-dashboard/SystemTypologies";
import { JsonLd } from "@/components/common/SEO";
import { normalizeLandStrength, normalizeScaleClass } from "@/constants/intelligenceLanguage";
import { intelligenceDashboardService } from "@/services/intelligenceDashboardService";

const toPercent = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;

const formatNumber = (value: number | null, decimals = 1) => {
  if (value === null || Number.isNaN(value)) return "Not disclosed";
  return Number(value.toFixed(decimals)).toLocaleString("en-IN");
};

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

const landStrengthScore = (value: string) => {
  if (value === "Ultra-abundant") return 10;
  if (value === "Abundant") return 25;
  if (value === "Balanced") return 50;
  if (value === "Stressed") return 75;
  return 95;
};

export default async function ResidentialIntelligenceDashboard() {
  const [apartmentProjects, villaProjects] = await Promise.all([
    intelligenceDashboardService.getApartmentProjects("hyderabad"),
    intelligenceDashboardService.getVillaProjects("hyderabad"),
  ]);

  const totalEcosystems = apartmentProjects.length + villaProjects.length;
  const verticalShare = toPercent(apartmentProjects.length, totalEcosystems);

  const apartmentUnits = apartmentProjects.reduce(
    (sum, project) => sum + (project.totalUnits ?? 0),
    0
  );
  const apartmentFloors = apartmentProjects
    .map((project) => project.floors)
    .filter((value): value is number => value !== null);
  const apartmentAvgFloors = apartmentFloors.length
    ? Math.round(apartmentFloors.reduce((sum, value) => sum + value, 0) / apartmentFloors.length)
    : 0;
  const apartmentWdiScores = apartmentProjects
    .map((project) => project.wdiScore)
    .filter((value): value is number => value !== null);
  const apartmentAvgWdi = apartmentWdiScores.length
    ? Math.round(apartmentWdiScores.reduce((sum, value) => sum + value, 0) / apartmentWdiScores.length)
    : 0;
  const verticalStressPosture = `${wdiGradeForScore(apartmentAvgWdi)} vertical posture`;

  const villaTotal = villaProjects.reduce((sum, project) => sum + (project.totalVillas ?? 0), 0);
  const villaPerAcreValues = villaProjects
    .map((project) => project.villasPerAcre)
    .filter((value): value is number => value !== null);
  const villaAvgPerAcre = villaPerAcreValues.length
    ? formatNumber(
        villaPerAcreValues.reduce((sum, value) => sum + value, 0) / villaPerAcreValues.length
      )
    : "Not disclosed";
  const villaWvieScores = villaProjects
    .map((project) => normalizeLandStrength(project.landStrengthClass))
    .filter((value): value is string => Boolean(value))
    .map((value) => landStrengthScore(value));
  const villaWvie = villaWvieScores.length
    ? Math.round(villaWvieScores.reduce((sum, value) => sum + value, 0) / villaWvieScores.length)
    : 0;
  const landPostureCounts = villaProjects.reduce<Record<string, number>>((acc, project) => {
    const normalized = normalizeLandStrength(project.landStrengthClass);
    if (!normalized) return acc;
    acc[normalized] = (acc[normalized] ?? 0) + 1;
    return acc;
  }, {});
  const dominantLandPosture =
    Object.entries(landPostureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Balanced";

  const dominantLivingPosture =
    apartmentAvgWdi >= 75 && ["Stressed", "Severely stressed"].includes(dominantLandPosture)
      ? "High stress convergence"
      : apartmentAvgWdi >= 70
      ? "Vertical intensity dominance"
      : "Balanced vertical-horizontal posture";

  const landStressedShare = toPercent(
    villaProjects.filter((project) =>
      ["Stressed", "Severely stressed"].includes(
        normalizeLandStrength(project.landStrengthClass) ?? ""
      )
    ).length,
    villaProjects.length
  );
  const verticalHighStressShare = toPercent(
    apartmentProjects.filter((project) => project.wdiScore !== null && project.wdiScore >= 80).length,
    apartmentProjects.length
  );
  const townshipShare = toPercent(
    villaProjects.filter((project) => normalizeScaleClass(project.scaleClass) === "Villa township")
      .length,
    villaProjects.length
  );

  const trajectory =
    verticalHighStressShare >= 40 && landStressedShare >= 35
      ? "Compression with rising vertical dependency"
      : verticalHighStressShare >= 40
      ? "Vertical intensification"
      : landStressedShare >= 35
      ? "Land tightening in villa corridors"
      : "Stable with selective stress pockets";

  const matrixPoints = [
    ...apartmentProjects.map((project) => ({
      id: `apt-${project.slug}`,
      label: project.name,
      type: "vertical" as const,
      density:
        project.unitsPerAcre !== null
          ? Math.min(100, Math.round((project.unitsPerAcre / 140) * 100))
          : 0,
      landStrength:
        project.landPerUnitSqft !== null
          ? Math.min(100, Math.round(100 - project.landPerUnitSqft / 90))
          : 0,
    })),
    ...villaProjects.map((project) => ({
      id: `villa-${project.slug}`,
      label: project.name,
      type: "horizontal" as const,
      density:
        project.villasPerAcre !== null
          ? Math.min(100, Math.round((project.villasPerAcre / 14) * 100))
          : 0,
      landStrength:
        project.landPerVillaSqft !== null
          ? Math.min(100, Math.round(100 - project.landPerVillaSqft / 110))
          : 0,
    })),
  ];

  const verticalTypologies = [
    {
      title: "High-rise dense systems",
      supplyShare: toPercent(
        apartmentProjects.filter(
          (project) => heightBandForFloors(project.floors) === "high-rise"
        ).length,
        apartmentProjects.length
      ),
      livingImplication: "Vertical reliance with shared-system dependency.",
      assetImplication: "Stability driven by infrastructure performance.",
    },
    {
      title: "Super-high-rise ecosystems",
      supplyShare: toPercent(
        apartmentProjects.filter(
          (project) => heightBandForFloors(project.floors) === "super-high-rise"
        ).length,
        apartmentProjects.length
      ),
      livingImplication: "High-density towers with intense vertical circulation.",
      assetImplication: "Sensitivity to governance and lift performance.",
    },
  ];

  const horizontalTypologies = [
    {
      title: "Land-abundant estates",
      supplyShare: toPercent(
        villaProjects.filter((project) => {
          const normalized = normalizeLandStrength(project.landStrengthClass);
          return normalized === "Abundant" || normalized === "Ultra-abundant";
        }).length,
        villaProjects.length
      ),
      livingImplication: "Open horizontal living with strong land buffers.",
      assetImplication: "Land-backed stability and long-term livability.",
    },
    {
      title: "Compact townships",
      supplyShare: toPercent(
        villaProjects.filter(
          (project) => normalizeScaleClass(project.scaleClass) === "Villa township"
        ).length,
        villaProjects.length
      ),
      livingImplication: "Shared amenities with rising density posture.",
      assetImplication: "Scale-driven value with tighter land ratios.",
    },
  ];

  const pressureIndicators = [
    {
      label: "Land compression",
      value: `${landStressedShare}%`,
      detail: "Villa ecosystems in tight or stressed land posture.",
    },
    {
      label: "Vertical dependency",
      value: `${verticalHighStressShare}%`,
      detail: "Apartment systems in high or extreme stress bands.",
    },
    {
      label: "Township compactness",
      value: `${townshipShare}%`,
      detail: "Township share of villa ecosystems.",
    },
    {
      label: "Stress migration",
      value: verticalHighStressShare >= landStressedShare ? "Vertical leading" : "Land leading",
      detail: "Where structural pressure is accumulating first.",
    },
  ];

  const gateways = [
    {
      label: "Apartment Intelligence",
      href: "/apartment-intelligence",
      summary: "Vertical residential command center",
      stats: [
        `${apartmentProjects.length} systems`,
        `City WDI ${apartmentAvgWdi}`,
        `${apartmentAvgFloors} avg floors`,
        `${verticalHighStressShare}% high stress`,
      ],
    },
    {
      label: "Villa Intelligence",
      href: "/villa-intelligence",
      summary: "Horizontal residential command center",
      stats: [
        `${villaProjects.length} ecosystems`,
        `${villaAvgPerAcre} villas/acre`,
        `${dominantLandPosture} land posture`,
        `${townshipShare}% townships`,
      ],
    },
  ];

  const apartmentsWithWdi = apartmentProjects.filter((project) => project.wdiScore !== null);
  const topApartment = apartmentsWithWdi.sort((a, b) => (b.wdiScore ?? 0) - (a.wdiScore ?? 0))[0];
  const medianApartment =
    apartmentsWithWdi.length > 0
      ? apartmentsWithWdi.sort((a, b) => (a.wdiScore ?? 0) - (b.wdiScore ?? 0))[
          Math.floor(apartmentsWithWdi.length / 2)
        ]
      : null;

  const villasWithDensity = villaProjects.filter(
    (project) => project.villasPerAcre !== null && project.landPerVillaSqft !== null
  );
  const denseVilla = villasWithDensity.sort(
    (a, b) => (b.villasPerAcre ?? 0) - (a.villasPerAcre ?? 0)
  )[0];
  const landAbundantVilla = villasWithDensity.sort(
    (a, b) => (b.landPerVillaSqft ?? 0) - (a.landPerVillaSqft ?? 0)
  )[0];

  const featuredFiles = ([
    topApartment
      ? {
          name: topApartment.name,
          slug: topApartment.slug,
          microMarket: topApartment.microMarket ?? "Hyderabad",
          rationale: "Highest structural load within the vertical system set.",
          metrics: [
            `WDI ${topApartment.wdiScore}`,
            topApartment.floors ? `${topApartment.floors} floors` : "Floors not disclosed",
            topApartment.unitsPerAcre
              ? `${topApartment.unitsPerAcre} units/acre`
              : "Units/acre not disclosed",
          ],
        }
      : null,
    medianApartment
      ? {
          name: medianApartment.name,
          slug: medianApartment.slug,
          microMarket: medianApartment.microMarket ?? "Hyderabad",
          rationale: "Median vertical system benchmark for balance reference.",
          metrics: [
            `WDI ${medianApartment.wdiScore}`,
            medianApartment.floors ? `${medianApartment.floors} floors` : "Floors not disclosed",
            medianApartment.unitsPerAcre
              ? `${medianApartment.unitsPerAcre} units/acre`
              : "Units/acre not disclosed",
          ],
        }
      : null,
    denseVilla
      ? {
          name: denseVilla.name,
          slug: denseVilla.slug,
          microMarket: denseVilla.microMarket ?? "Hyderabad",
          rationale: "Highest horizontal density benchmark.",
          metrics: [
            denseVilla.villasPerAcre
              ? `${formatNumber(denseVilla.villasPerAcre)} villas/acre`
              : "Villas/acre not disclosed",
            denseVilla.landPerVillaSqft
              ? `${formatNumber(denseVilla.landPerVillaSqft, 0)} sq.ft land/villa`
              : "Land/villa not disclosed",
            denseVilla.scaleClass ?? "Scale class not disclosed",
          ],
        }
      : null,
    landAbundantVilla
      ? {
          name: landAbundantVilla.name,
          slug: landAbundantVilla.slug,
          microMarket: landAbundantVilla.microMarket ?? "Hyderabad",
          rationale: "Land-abundant horizontal benchmark.",
          metrics: [
            landAbundantVilla.villasPerAcre
              ? `${formatNumber(landAbundantVilla.villasPerAcre)} villas/acre`
              : "Villas/acre not disclosed",
            landAbundantVilla.landPerVillaSqft
              ? `${formatNumber(landAbundantVilla.landPerVillaSqft, 0)} sq.ft land/villa`
              : "Land/villa not disclosed",
            landAbundantVilla.landStrengthClass ?? "Land class not disclosed",
          ],
        }
      : null,
  ].filter(Boolean) as Array<{
    name: string;
    slug: string;
    microMarket: string;
    rationale: string;
    metrics: string[];
  }>);

  return (
    <main className="bg-slate-50 text-slate-900">
      <JsonLd jsonLd={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
          { "@type": "ListItem", position: 2, name: "Residential Intelligence", item: "https://www.westsiderealty.in/residential-intelligence" },
        ],
      }} />
      <ResidentialIntelligenceHero
        ecosystemsAnalyzed={totalEcosystems}
        verticalShare={verticalShare}
        dominantPosture={dominantLivingPosture}
        trajectory={trajectory}
      />
      <StructuralComposition
        vertical={{
          totalProjects: apartmentProjects.length,
          totalUnits: apartmentUnits,
          avgFloors: apartmentAvgFloors,
          cityWdi: apartmentAvgWdi,
          stressPosture: verticalStressPosture,
        }}
        horizontal={{
          totalEcosystems: villaProjects.length,
          totalVillas: villaTotal,
          avgVillasPerAcre: Number(villaAvgPerAcre === "Not disclosed" ? 0 : villaAvgPerAcre),
          cityWvie: villaWvie,
          landPosture: dominantLandPosture,
        }}
        balanceModel={`Hyderabad currently leans ${verticalShare}% vertical and ${
          100 - verticalShare
        }% horizontal by ecosystem count, creating a dual-structured residential core.`}
      />
      <DensityLandMatrix points={matrixPoints} />
      <SystemTypologies vertical={verticalTypologies} horizontal={horizontalTypologies} />
      <CityPressureIndicators indicators={pressureIndicators} />
      <CommandAccess gateways={gateways} />
      <FeaturedIntelligenceFiles files={featuredFiles} />
      <InterpretationFooter />
    </main>
  );
}
