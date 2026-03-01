export interface LeadAttributionInput {
  sourcePage?: string | null;
  details?: Record<string, unknown> | null;
  sourceType?: string | null;
  sourceName?: string | null;
}

export interface LeadAttribution {
  source_type: string;
  source_name: string;
  campaign_name: string | null;
  campaign_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  landing_page_url: string | null;
  micro_market: string | null;
  attribution_metadata: Record<string, unknown>;
}

const getString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickString = (obj: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = getString(obj[key]);
    if (value) return value;
  }
  return null;
};

const inferMicroMarket = (sourcePage: string | null): string | null => {
  if (!sourcePage) return null;
  const path = sourcePage.split("?")[0];
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const blocked = new Set(["admin", "crm", "dashboard", "projects", "developers", "buy", "homes"]);
  const candidate = parts[1]?.toLowerCase() || "";
  if (!candidate || blocked.has(candidate)) return null;
  return candidate;
};

const inferDefaultSourceType = (details: Record<string, unknown>, sourcePage: string | null): string => {
  const gclid = pickString(details, ["gclid"]);
  const fbclid = pickString(details, ["fbclid"]);
  const explicitPlatform = pickString(details, ["platform", "ad_platform", "traffic_source"]);
  if (explicitPlatform) return explicitPlatform.toLowerCase().replace(/\s+/g, "_");
  if (gclid) return "google_ads";
  if (fbclid) return "meta_ads";
  if (sourcePage?.includes("/landing/")) return "landing_page";
  return "website";
};

const inferDefaultSourceName = (details: Record<string, unknown>, sourcePage: string | null): string => {
  const explicit = pickString(details, ["source", "source_name", "lead_source"]);
  if (explicit) return explicit;
  if (sourcePage?.includes("/landing/")) return "landing_page";
  return "website_form";
};

export function extractLeadAttribution(input: LeadAttributionInput): LeadAttribution {
  const details = (input.details || {}) as Record<string, unknown>;
  const sourcePage = getString(input.sourcePage) || null;

  const sourceType = getString(input.sourceType) || pickString(details, ["source_type", "channel_type", "channel"]) || inferDefaultSourceType(details, sourcePage);
  const sourceName = getString(input.sourceName) || pickString(details, ["source_name", "source", "lead_source"]) || inferDefaultSourceName(details, sourcePage);

  const campaignName = pickString(details, ["campaign_name", "campaign", "campaign_title"]);
  const campaignId = pickString(details, ["campaign_id", "meta_campaign_id", "google_campaign_id"]);

  const utmSource = pickString(details, ["utm_source"]);
  const utmMedium = pickString(details, ["utm_medium"]);
  const utmCampaign = pickString(details, ["utm_campaign"]);
  const utmTerm = pickString(details, ["utm_term"]);
  const utmContent = pickString(details, ["utm_content"]);
  const gclid = pickString(details, ["gclid"]);
  const fbclid = pickString(details, ["fbclid"]);
  const landingUrl = pickString(details, ["landing_page_url", "landing_url", "page_url"]) || sourcePage;
  const microMarket = pickString(details, ["micro_market", "micromarket"]) || inferMicroMarket(sourcePage);

  return {
    source_type: sourceType,
    source_name: sourceName,
    campaign_name: campaignName,
    campaign_id: campaignId,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_term: utmTerm,
    utm_content: utmContent,
    gclid,
    fbclid,
    landing_page_url: landingUrl,
    micro_market: microMarket,
    attribution_metadata: {
      source_page: sourcePage,
      platform_hint: pickString(details, ["platform", "ad_platform", "traffic_source"]),
      import_source: pickString(details, ["import_source", "upload_source"]),
      raw_campaign: pickString(details, ["campaign", "campaign_name", "campaign_id"]),
    },
  };
}
