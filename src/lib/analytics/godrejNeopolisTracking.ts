"use client";

const MEASUREMENT_ID = "G-GYG41B6D00";

const EVENTS = new Set([
  "godrej_neopolis_primary_cta",
  "godrej_neopolis_form_start",
  "godrej_neopolis_form_submit_success",
  "godrej_neopolis_intent_selected",
  "godrej_neopolis_configuration_selected",
  "godrej_neopolis_budget_selected",
]);
const CTA_INTENTS = new Set(["general_prelaunch", "price", "eoi", "3bhk", "4bhk", "floor_plan"]);
const CTA_LOCATIONS = new Set(["hero", "notice", "price", "configuration", "eoi", "floor_plan", "sticky", "form", "faq"]);
const CONFIGURATIONS = new Set(["3bhk_1950", "3bhk_2250", "3bhk_2400", "3bhk_2700", "4bhk_3250", "flexible"]);
const BUDGETS = new Set(["2_5_3_cr", "3_3_5_cr", "3_5_4_cr", "4_5_cr", "5_cr_plus", "flexible"]);
const PURPOSES = new Set(["self_use", "investment"]);
const STAGES = new Set(["ready_eoi", "evaluating", "comparing"]);

type EventName =
  | "godrej_neopolis_primary_cta"
  | "godrej_neopolis_form_start"
  | "godrej_neopolis_form_submit_success"
  | "godrej_neopolis_intent_selected"
  | "godrej_neopolis_configuration_selected"
  | "godrej_neopolis_budget_selected";

type Params = {
  cta_intent?: string;
  cta_location?: string;
  configuration?: string;
  budget_band?: string;
  purchase_purpose?: string;
  buying_stage?: string;
};

type GoogleWindow = Window & { gtag?: (command: "event", name: string, params: Record<string, string>) => void };

type PendingEvent = { name: EventName; parameters: Record<string, string>; expiresAt: number };
const pending: PendingEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;

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
      gtag("event", event.name, event.parameters);
    }
    if (pending.length) timer = setTimeout(flush, 250);
  } catch {
    pending.length = 0;
  }
}

export function trackGodrejNeopolisEvent(name: EventName, params: Params = {}) {
  try {
    if (typeof window === "undefined" || !EVENTS.has(name)) return;

    const safe: Record<string, string> = {
      send_to: MEASUREMENT_ID,
      page_type: "residential_prelaunch_project",
      project_name: "godrej_neopolis",
      location_scope: "neopolis_kokapet",
      page_referrer: "",
    };

    const ctaIntent = normalize(CTA_INTENTS, params.cta_intent);
    const ctaLocation = normalize(CTA_LOCATIONS, params.cta_location);
    const configuration = normalize(CONFIGURATIONS, params.configuration);
    const budgetBand = normalize(BUDGETS, params.budget_band);
    const purpose = normalize(PURPOSES, params.purchase_purpose);
    const stage = normalize(STAGES, params.buying_stage);

    if (params.cta_intent && !ctaIntent) return;
    if (params.cta_location && !ctaLocation) return;
    if (params.configuration && !configuration) return;
    if (params.budget_band && !budgetBand) return;
    if (params.purchase_purpose && !purpose) return;
    if (params.buying_stage && !stage) return;

    if (ctaIntent) safe.cta_intent = ctaIntent;
    if (ctaLocation) safe.cta_location = ctaLocation;
    if (configuration) safe.configuration = configuration;
    if (budgetBand) safe.budget_band = budgetBand;
    if (purpose) safe.purchase_purpose = purpose;
    if (stage) safe.buying_stage = stage;

    pending.push({ name, parameters: safe, expiresAt: Date.now() + 10_000 });
    if (!timer) timer = setTimeout(flush, 0);
  } catch {
    // Analytics must never affect lead capture.
  }
}
