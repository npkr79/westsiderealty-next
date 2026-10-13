"use client";

import type { SubmitLeadData, SubmitLeadResponse } from "@/app/actions/submit-lead";

const GA4_ID = "G-GYG41B6D00";
const HOST = "https://www.westsiderealty.in";
const seen = new Set<string>();
type GoogleWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

// These fields come from page context, never from name/email/phone/message inputs.
const slug = (value: unknown): string | undefined =>
  typeof value === "string" && /^[a-z][a-z0-9_-]{0,99}$/i.test(value) && !/\d{7}/.test(value)
    ? value.toLowerCase() : undefined;

export function safeSourcePage(value: string): string {
  try {
    const url = new URL(value, HOST);
    if (!["www.westsiderealty.in", "westsiderealty.in"].includes(url.hostname)) return "/";
    // Brochure URLs contain recipient-specific tokens; never send them.
    if (url.pathname.startsWith("/brochure/")) return "/brochure";
    if (!/^\/[a-z0-9/_-]*$/i.test(url.pathname) || /\d{7}/.test(url.pathname)) return "/";
    return url.pathname;
  } catch { return "/"; }
}

export function leadParameters(data: SubmitLeadData, formId: string): Record<string, string> {
  const source = safeSourcePage(data.source_page);
  const details = data.details ?? {};
  const meta = data.attribution_metadata ?? {};
  let category = "general";
  let type = "general_enquiry";
  let pageType = "general";
  const commercialProperty = ["commercial", "commercial office", "commercial office space", "commercial real estate", "office", "retail", "office space", "commercial office space for sale", "corporate office space", "managed office space"].includes((data.property_type ?? "").toLowerCase());
  const commercial = commercialProperty || source === "/commercial-investments" || source.startsWith("/commercial/") ||
    details.segment === "institutional-commercial" || details.segment === "commercial-investments" ||
    data.type === "CORPORATE_OFFICE_LEASING";
  if (commercial) {
    category = "commercial";
    pageType = "commercial";
    if (data.type === "CORPORATE_OFFICE_LEASING" || source.includes("office-space-for-lease") || source.includes("managed-office-space")) type = "office_lease";
    else if (source.includes("office-space-for-sale") || details.intent === "office_purchase") type = "office_sale";
    else if (source === "/commercial-investments" || source.includes("pre-leased") || details.segment === "institutional-commercial" || details.intent === "commercial_investment") type = "investment";
  } else if (["PROJECT_INTEREST", "GOA_PROPERTY"].includes(data.type) ||
      ["villa_enquiry", "luxury_lead"].includes(formId)) {
    category = "residential";
    type = "project_enquiry";
    pageType = "residential_project";
  }
  const parameters: Record<string, string> = {
    send_to: GA4_ID,
    lead_category: category,
    lead_type: type,
    page_type: pageType,
    form_id: slug(formId) ?? "website_enquiry",
    source_page: source,
    page_location: HOST + source,
    page_referrer: "",
    // Prevent automatic document titles from introducing personal context.
    page_title: pageType,
  };
  const projectRoute = source.match(/^\/(hyderabad|goa|dubai)\/projects\/([^/]+)\/?$/);
  const project = slug(meta.project_slug) ?? slug(projectRoute?.[2]);
  if (project) parameters.project_slug = project;
  const city = slug(meta.city) ?? slug(details.city) ?? projectRoute?.[1] ??
    (source.startsWith("/commercial/hyderabad") ? "hyderabad" : source === "/commercial/pre-leased-mumbai" ? "mumbai" : undefined);
  if (city && ["hyderabad", "bengaluru", "goa", "dubai", "mumbai"].includes(city)) parameters.city = city;
  // Metadata micro_market is supplied by project records. Avoid free-text location_preference.
  const locality = typeof meta.micro_market === "string" ? meta.micro_market : details.micro_market;
  if (typeof locality === "string" && /^[a-zA-Z -/]{1,80}$/.test(locality)) {
    parameters.locality = locality.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
  }
  const scope = meta.location_scope ?? details.location_scope;
  if (typeof scope === "string" && ["gachibowli_financial_district", "hitec_city_madhapur", "neopolis_kokapet"].includes(scope)) parameters.locality = scope;
  const intent = meta.cta_intent;
  if (typeof intent === "string" && ["general_prelaunch", "price", "eoi", "3bhk", "4bhk", "floor_plan"].includes(intent)) parameters.cta_intent = intent;
  const buyerIntents: Record<string, string> = {
    "End-use home purchase": "end_use", "Investment / rental yield": "investment",
    "Upgrade from current home": "upgrade", "Shortlist and compare": "compare",
    "Rental yield focus": "rental_yield", "Long-term appreciation": "appreciation",
    "Portfolio diversification": "diversification", "Primary family home": "family_home",
    "Near-work convenience": "near_work",
  };
  if (!parameters.cta_intent && typeof details.buyerIntent === "string" && Object.prototype.hasOwnProperty.call(buyerIntents, details.buyerIntent)) parameters.cta_intent = buyerIntents[details.buyerIntent];
  if (project === "godrej-neopolis") parameters.page_type = "residential_prelaunch_project";
  return parameters;
}

/** Receipt is an opaque random acknowledgement, used only locally; never sent to Google. */
export function trackSuccessfulLead(response: SubmitLeadResponse, data: SubmitLeadData, formId: string): void {
  try {
    if (typeof window === "undefined" || response.success !== true || !response.analyticsReceipt || seen.has(response.analyticsReceipt)) return;
    const parameters = leadParameters(data, formId);
    seen.add(response.analyticsReceipt);
    const target = window as GoogleWindow;
    if (typeof target.gtag === "function") {
      target.gtag("event", "generate_lead", parameters);
    } else {
      // Standard gtag command queue, also works before the existing Google tag loads.
      // Do not initialize another tag or override consent state.
      target.dataLayer = target.dataLayer || [];
      const queue: (...args: unknown[]) => void = function () {
        // gtag.js consumes IArguments commands (plain arrays are dataLayer messages).
        // eslint-disable-next-line prefer-rest-params
        target.dataLayer!.push(arguments);
      };
      queue("event", "generate_lead", parameters);
    }
  } catch {
    // Blocked scripts/storage or a throwing analytics sink cannot affect CRM success.
  }
}

export async function withLeadTracking<T extends SubmitLeadResponse>(
  submit: () => Promise<T>, data: SubmitLeadData, formId: string,
): Promise<T> {
  const response = await submit();
  trackSuccessfulLead(response, data, formId);
  return response;
}
