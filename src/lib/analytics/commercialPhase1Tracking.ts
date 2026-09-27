"use client";

type CommercialPageType = "commercial_hyderabad_hub" | "commercial_office_sale" | "managed_office";
type CommercialIntent = "commercial_hub" | "office_purchase" | "managed_office" | "commercial_lease" | "commercial_investment";

const MEASUREMENT_ID = "G-GYG41B6D00";

const PAGE_TYPES = new Set<CommercialPageType>(["commercial_hyderabad_hub", "commercial_office_sale", "managed_office"]);
const COMMERCIAL_INTENTS = new Set<CommercialIntent>(["commercial_hub", "office_purchase", "managed_office", "commercial_lease", "commercial_investment"]);
const CTA_LOCATIONS = new Set(["hero", "pathway_card", "inline", "form", "final_cta"]);
const LOCATION_SELECTIONS = new Set([
  "hyderabad",
  "financial_district_gachibowli",
  "hitec_city_madhapur",
  "gachibowli",
  "financial_district",
  "hitec_city",
  "madhapur",
  "raidurg",
  "kondapur",
  "kokapet_neopolis",
  "other_flexible",
]);
const AREA_BANDS = new Set(["under_2500", "2500_5000", "5000_10000", "10000_25000", "25000_50000", "50000_plus"]);
const SEAT_BANDS = new Set(["20_50", "51_100", "101_250", "251_500", "501_1000", "1000_plus"]);
const PURCHASE_PURPOSES = new Set(["own_use", "investment", "either"]);
const OFFICE_TYPES = new Set(["managed", "furnished", "plug_and_play", "flexible_not_sure"]);
const REQUIREMENT_TYPES = new Set(["hub_router", "office_purchase", "managed_office"]);

type EventParameters = {
  commercial_phase1_primary_cta: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    cta_location: string;
    location_scope?: string;
  };
  commercial_phase1_form_start: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    location_scope?: string;
  };
  commercial_phase1_form_submit_success: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    location_scope?: string;
    requirement_type: string;
  };
  commercial_phase1_service_selected: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    cta_location?: string;
  };
  commercial_phase1_location_selected: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    location_selection: string;
  };
  commercial_phase1_area_selected: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    area_band: string;
  };
  commercial_phase1_seat_band_selected: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    seat_band: string;
  };
  commercial_phase1_purchase_intent_selected: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    purchase_purpose: string;
  };
  commercial_phase1_office_type_selected: {
    page_type: CommercialPageType;
    commercial_intent: CommercialIntent;
    office_type: string;
  };
};

type EventName = keyof EventParameters;
type GoogleWindow = Window & { gtag?: (command: "event", name: string, parameters: Record<string, string>) => void };
type PendingEvent = { name: EventName; parameters: Record<string, string>; expiresAt: number };

const pending: PendingEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
const MAX_PENDING = 50;
const MAX_WAIT_MS = 10_000;

function normalize(set: Set<string>, value: unknown): string | undefined {
  return typeof value === "string" && set.has(value) ? value : undefined;
}

function flush() {
  timer = undefined;
  try {
    const gtag = (window as GoogleWindow).gtag;
    while (pending.length) {
      const event = pending[0];
      if (event.expiresAt <= Date.now()) {
        pending.shift();
        continue;
      }
      if (typeof gtag !== "function") break;
      pending.shift();
      try {
        gtag("event", event.name, event.parameters);
      } catch {
        // Analytics is best-effort and must never affect conversion UI.
      }
    }
    if (pending.length) timer = setTimeout(flush, 250);
  } catch {
    pending.length = 0;
  }
}

function baseParams(pageType: unknown, commercialIntent: unknown): Record<string, string> | null {
  const safePageType = normalize(PAGE_TYPES, pageType);
  const safeIntent = normalize(COMMERCIAL_INTENTS, commercialIntent);
  if (!safePageType || !safeIntent) return null;
  return {
    send_to: MEASUREMENT_ID,
    page_type: safePageType,
    commercial_intent: safeIntent,
    page_referrer: "",
  };
}

export function trackCommercialPhase1Event<E extends EventName>(name: E, parameters: EventParameters[E]): void {
  try {
    if (typeof window === "undefined") return;
    const safe = baseParams(parameters.page_type, parameters.commercial_intent);
    if (!safe) return;

    switch (name) {
      case "commercial_phase1_primary_cta": {
        const params = parameters as EventParameters["commercial_phase1_primary_cta"];
        const cta = normalize(CTA_LOCATIONS, params.cta_location);
        if (!cta) return;
        safe.cta_location = cta;
        const locationScope = normalize(LOCATION_SELECTIONS, params.location_scope);
        if (locationScope) safe.location_scope = locationScope;
        break;
      }
      case "commercial_phase1_form_start": {
        const params = parameters as EventParameters["commercial_phase1_form_start"];
        const locationScope = normalize(LOCATION_SELECTIONS, params.location_scope);
        if (locationScope) safe.location_scope = locationScope;
        break;
      }
      case "commercial_phase1_form_submit_success": {
        const params = parameters as EventParameters["commercial_phase1_form_submit_success"];
        const requirementType = normalize(REQUIREMENT_TYPES, params.requirement_type);
        if (!requirementType) return;
        safe.requirement_type = requirementType;
        const locationScope = normalize(LOCATION_SELECTIONS, params.location_scope);
        if (locationScope) safe.location_scope = locationScope;
        break;
      }
      case "commercial_phase1_service_selected": {
        const params = parameters as EventParameters["commercial_phase1_service_selected"];
        const cta = normalize(CTA_LOCATIONS, params.cta_location);
        if (cta) safe.cta_location = cta;
        break;
      }
      case "commercial_phase1_location_selected": {
        const params = parameters as EventParameters["commercial_phase1_location_selected"];
        const value = normalize(LOCATION_SELECTIONS, params.location_selection);
        if (!value) return;
        safe.location_selection = value;
        break;
      }
      case "commercial_phase1_area_selected": {
        const params = parameters as EventParameters["commercial_phase1_area_selected"];
        const value = normalize(AREA_BANDS, params.area_band);
        if (!value) return;
        safe.area_band = value;
        break;
      }
      case "commercial_phase1_seat_band_selected": {
        const params = parameters as EventParameters["commercial_phase1_seat_band_selected"];
        const value = normalize(SEAT_BANDS, params.seat_band);
        if (!value) return;
        safe.seat_band = value;
        break;
      }
      case "commercial_phase1_purchase_intent_selected": {
        const params = parameters as EventParameters["commercial_phase1_purchase_intent_selected"];
        const value = normalize(PURCHASE_PURPOSES, params.purchase_purpose);
        if (!value) return;
        safe.purchase_purpose = value;
        break;
      }
      case "commercial_phase1_office_type_selected": {
        const params = parameters as EventParameters["commercial_phase1_office_type_selected"];
        const value = normalize(OFFICE_TYPES, params.office_type);
        if (!value) return;
        safe.office_type = value;
        break;
      }
      default:
        return;
    }

    if (pending.length >= MAX_PENDING) return;
    pending.push({ name, parameters: safe, expiresAt: Date.now() + MAX_WAIT_MS });
    if (timer === undefined) timer = setTimeout(flush, 0);
  } catch {
    // Includes unavailable globals, bad input and timer failures.
  }
}
