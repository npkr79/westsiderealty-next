export const PLATFORM_LAYERS = {
  platform: "Westside Residential Intelligence",
  city: "Hyderabad Residential Intelligence",
  apartment: "Apartment Intelligence",
  villa: "Villa Intelligence",
  apartmentFile: "Apartment Intelligence File",
  villaFile: "Villa Intelligence File",
  residentialFile: "Residential Intelligence File",
};

export const CLASS_VOCAB = {
  density: ["Estate", "Low", "Medium", "High", "Extreme"] as const,
  landStrength: [
    "Ultra-abundant",
    "Abundant",
    "Balanced",
    "Stressed",
    "Severely stressed",
  ] as const,
  scale: [
    "Boutique enclave",
    "Gated community",
    "Villa township",
    "Mega ecosystem",
  ] as const,
  compactness: [
    "Estate-spread",
    "Low compact",
    "Balanced",
    "Compact",
    "Hyper-compact",
  ] as const,
};

export const INTELLIGENCE_LABELS = {
  wdi: "Westside Density Index (WDI)",
  hii: "Horizontal Intensity Index (HII)",
  disclosure: "Derived from Telangana RERA structural disclosures.",
  disclosureMissing: "Not disclosed in Telangana RERA structural disclosures.",
  wvieClassification: "WVIE-driven system classification.",
};

export const SECTION_NAMING = {
  intelligenceSnapshot: {
    eyebrow: "Intelligence Snapshot",
    title: "Structural footprint snapshot",
    subtitle: INTELLIGENCE_LABELS.disclosure,
  },
  structuralProfile: {
    eyebrow: "Structural Profile",
    title: "Structural footprint",
    subtitle: INTELLIGENCE_LABELS.disclosure,
  },
  intelligenceProfiles: {
    eyebrow: "Intelligence Profile",
    title: "Structural intelligence profiles",
    subtitle: "WVIE-driven system classification.",
  },
  villaSystemProfile: {
    eyebrow: "System Intelligence Profile",
    title: "Spatial system profile",
    subtitle: "WVIE-driven system classification.",
  },
  planningModel: {
    eyebrow: "Planning & Land Architecture",
    title: "Spatial planning model",
    subtitle: INTELLIGENCE_LABELS.disclosure,
  },
  positioningProfile: {
    eyebrow: "Intelligence Positioning Profile",
    title: "Relative structural positioning",
    subtitle: INTELLIGENCE_LABELS.disclosure,
  },
  riskSignals: {
    eyebrow: "Structural Risk Signals",
    title: "Forward-looking structural signals",
    subtitle: "WVIE-driven system classification.",
  },
  ecosystemStructure: {
    eyebrow: "Ecosystem Structure",
    title: "Ecosystem intelligence profile",
    subtitle: INTELLIGENCE_LABELS.wvieClassification,
  },
  editorialBrief: {
    eyebrow: "Editorial Brief",
    title: "System interpretation brief",
    subtitle: INTELLIGENCE_LABELS.wvieClassification,
  },
};

const normalize = (value: string) => value.trim().toLowerCase();

export const normalizeDensityClass = (value: string | null): string | null => {
  if (!value) return null;
  const label = normalize(value);
  if (label.includes("estate")) return "Estate";
  if (label.includes("low") || label.includes("light")) return "Low";
  if (label.includes("balanced") || label.includes("medium") || label.includes("dense"))
    return "Medium";
  if (label.includes("high")) return "High";
  if (label.includes("extreme")) return "Extreme";
  return null;
};

export const normalizeLandStrength = (value: string | null): string | null => {
  if (!value) return null;
  const label = normalize(value);
  if (label.includes("ultra")) return "Ultra-abundant";
  if (label.includes("abundant") || label.includes("land-rich") || label.includes("strong"))
    return "Abundant";
  if (label.includes("balanced")) return "Balanced";
  if (label.includes("severe")) return "Severely stressed";
  if (label.includes("stressed") || label.includes("tight")) return "Stressed";
  return null;
};

export const normalizeScaleClass = (value: string | null): string | null => {
  if (!value) return null;
  const label = normalize(value);
  if (label.includes("boutique")) return "Boutique enclave";
  if (label.includes("gated") || label.includes("community")) return "Gated community";
  if (label.includes("township")) return "Villa township";
  if (label.includes("mega")) return "Mega ecosystem";
  return null;
};

export const normalizeCompactness = (value: string | null): string | null => {
  if (!value) return null;
  const label = normalize(value);
  if (label.includes("estate")) return "Estate-spread";
  if (label.includes("low")) return "Low compact";
  if (label.includes("balanced")) return "Balanced";
  if (label.includes("hyper")) return "Hyper-compact";
  if (label.includes("compact")) return "Compact";
  return null;
};

export const disclosureValue = (value: string | null, fallback?: string) =>
  value && value.trim().length > 0 ? value : fallback ?? INTELLIGENCE_LABELS.disclosureMissing;
