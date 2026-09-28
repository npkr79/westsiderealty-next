"use client";

const PAGE_PATH = "/commercial/hyderabad/office-space-for-lease";
const MEASUREMENT_ID = "G-GYG41B6D00";
const AREA_BANDS = {
  "Under 10,000 sq ft": "under_10000",
  "10,000-25,000 sq ft": "10000_25000",
  "25,000-50,000 sq ft": "25000_50000",
  "50,000-100,000 sq ft": "50000_100000",
  "100,000-250,000 sq ft": "100000_250000",
  "250,000+ sq ft": "250000_plus",
} as const;
const LOCATIONS = {
  "Financial District": "financial_district",
  Gachibowli: "gachibowli",
  "HITEC City": "hitec_city",
  Raidurg: "raidurg",
  "Kokapet / Neopolis": "kokapet_neopolis",
  "Other / Flexible": "other_flexible",
  gachibowli_financial_district: "gachibowli_financial_district",
  hitec_city_madhapur: "hitec_city_madhapur",
} as const;

type CorporateLeasingContext = {
  page_path?: string;
  page_type?: "office_leasing_corridor";
  commercial_intent?: "office_lease";
  location_scope?: "gachibowli_financial_district" | "hitec_city_madhapur";
};

type EventParameters = {
  corporate_leasing_primary_cta: { cta_location: "hero" } & CorporateLeasingContext;
  corporate_leasing_form_start: CorporateLeasingContext;
  corporate_leasing_form_submit_success: CorporateLeasingContext;
  corporate_leasing_area_selected: { area_band: string } & CorporateLeasingContext;
  corporate_leasing_location_selected: { location_selection: string } & CorporateLeasingContext;
};
type EventName = keyof EventParameters;
type PendingEvent = { name: EventName; parameters: Record<string, string>; expiresAt: number };
type GoogleWindow = Window & { gtag?: (command: "event", name: string, parameters: Record<string, string>) => void };

const pending: PendingEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
const MAX_PENDING = 50;
const MAX_WAIT_MS = 10_000;

function normalized(options: Record<string, string>, value: unknown): string | undefined {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(options, value)
    ? options[value]
    : undefined;
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
      // Remove before sending: a throwing sink must never replay the same event.
      pending.shift();
      try {
        gtag("event", event.name, event.parameters);
      } catch {
        // Analytics is best-effort and cannot affect application behavior.
      }
    }
    if (pending.length) timer = setTimeout(flush, 250);
  } catch {
    pending.length = 0;
  }
}

/** Corporate-only allowlist. Never accepts/spreads a form or shared listings payload. */
export function trackCorporateLeasingEvent<E extends EventName>(name: E, parameters: EventParameters[E]): void {
  try {
    if (typeof window === "undefined") return;
    const contextualPagePath = typeof parameters.page_path === "string" && parameters.page_path.startsWith("/commercial/hyderabad/office-space-for-lease")
      ? parameters.page_path
      : PAGE_PATH;
    const safe: Record<string, string> = {
      send_to: MEASUREMENT_ID,
      page_path: contextualPagePath,
      // Override automatic URL context for these custom events only; no query/PII leakage.
      page_location: `https://www.westsiderealty.in${contextualPagePath}`,
      page_referrer: "",
    };
    if (parameters.page_type === "office_leasing_corridor") safe.page_type = "office_leasing_corridor";
    if (parameters.commercial_intent === "office_lease") safe.commercial_intent = "office_lease";
    if (parameters.location_scope === "gachibowli_financial_district" || parameters.location_scope === "hitec_city_madhapur") {
      safe.location_scope = parameters.location_scope;
    }
    switch (name) {
      case "corporate_leasing_primary_cta":
        if (!("cta_location" in parameters) || parameters.cta_location !== "hero") return;
        safe.cta_location = "hero";
        break;
      case "corporate_leasing_area_selected": {
        const value = normalized(AREA_BANDS, "area_band" in parameters ? parameters.area_band : undefined);
        if (!value) return;
        safe.area_band = value;
        break;
      }
      case "corporate_leasing_location_selected": {
        const value = normalized(LOCATIONS, "location_selection" in parameters ? parameters.location_selection : undefined);
        if (!value) return;
        safe.location_selection = value;
        break;
      }
      case "corporate_leasing_form_start":
      case "corporate_leasing_form_submit_success":
        break;
      default:
        return;
    }
    if (pending.length >= MAX_PENDING) return;
    pending.push({ name, parameters: safe, expiresAt: Date.now() + MAX_WAIT_MS });
    // Always deferred: even a slow or throwing sink cannot delay success UI.
    if (timer === undefined) timer = setTimeout(flush, 0);
  } catch {
    // Includes malformed input, getters, unavailable globals, and timer failures.
  }
}
