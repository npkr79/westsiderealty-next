"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitLead, type LeadType } from "@/app/actions/submit-lead";
import { trackCommercialPhase1Event } from "@/lib/analytics/commercialPhase1Tracking";

type PageType = "commercial_hyderabad_hub" | "commercial_office_sale" | "managed_office";
type CommercialIntent = "commercial_hub" | "office_purchase" | "managed_office" | "commercial_lease" | "commercial_investment";

type SelectOption = { label: string; value: string };

const COMMERCIAL_LOCATIONS: SelectOption[] = [
  { label: "Hyderabad / Flexible", value: "hyderabad" },
  { label: "Financial District + Gachibowli", value: "financial_district_gachibowli" },
  { label: "HITEC City + Madhapur", value: "hitec_city_madhapur" },
  { label: "Gachibowli", value: "gachibowli" },
  { label: "Financial District", value: "financial_district" },
  { label: "HITEC City", value: "hitec_city" },
  { label: "Madhapur", value: "madhapur" },
  { label: "Raidurg", value: "raidurg" },
  { label: "Kondapur", value: "kondapur" },
  { label: "Kokapet / Neopolis", value: "kokapet_neopolis" },
  { label: "Other / Flexible", value: "other_flexible" },
];

const AREA_BANDS: SelectOption[] = [
  { label: "Under 2,500 sq ft", value: "under_2500" },
  { label: "2,500–5,000 sq ft", value: "2500_5000" },
  { label: "5,000–10,000 sq ft", value: "5000_10000" },
  { label: "10,000–25,000 sq ft", value: "10000_25000" },
  { label: "25,000–50,000 sq ft", value: "25000_50000" },
  { label: "50,000+ sq ft", value: "50000_plus" },
];

const BUDGET_BANDS: SelectOption[] = [
  { label: "Under ₹5 Cr", value: "under_5cr" },
  { label: "₹5–10 Cr", value: "5_10cr" },
  { label: "₹10–25 Cr", value: "10_25cr" },
  { label: "₹25–50 Cr", value: "25_50cr" },
  { label: "₹50 Cr+", value: "50cr_plus" },
  { label: "To be discussed", value: "to_be_discussed" },
];

const TIMELINES: SelectOption[] = [
  { label: "Immediately", value: "immediately" },
  { label: "Within 3 months", value: "within_3_months" },
  { label: "3–6 months", value: "3_6_months" },
  { label: "6–12 months", value: "6_12_months" },
  { label: "Exploring / Flexible", value: "exploring_flexible" },
];

const SEAT_BANDS: SelectOption[] = [
  { label: "20–50 seats", value: "20_50" },
  { label: "51–100 seats", value: "51_100" },
  { label: "101–250 seats", value: "101_250" },
  { label: "251–500 seats", value: "251_500" },
  { label: "501–1,000 seats", value: "501_1000" },
  { label: "1,000+ seats", value: "1000_plus" },
];

const PURCHASE_PURPOSES: SelectOption[] = [
  { label: "Own Use", value: "own_use" },
  { label: "Investment", value: "investment" },
  { label: "Either", value: "either" },
];

const PROPERTY_PREFERENCES: SelectOption[] = [
  { label: "Vacant", value: "vacant" },
  { label: "Pre-Leased", value: "pre_leased" },
  { label: "Either", value: "either" },
];

const OFFICE_TYPES: SelectOption[] = [
  { label: "Managed", value: "managed" },
  { label: "Furnished", value: "furnished" },
  { label: "Plug-and-Play", value: "plug_and_play" },
  { label: "Flexible / Not Sure", value: "flexible_not_sure" },
];

const SERVICE_INTENTS: SelectOption[] = [
  { label: "Office Space for Lease", value: "commercial_lease" },
  { label: "Managed Office Space", value: "managed_office" },
  { label: "Office Space for Sale", value: "office_purchase" },
  { label: "Commercial Investment", value: "commercial_investment" },
];

const fieldClass = "min-h-12 w-full rounded-sm border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#b08a42] focus:ring-2 focus:ring-[#b08a42]/20";
const labelClass = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";

function getPageUrl(fallback: string) {
  return typeof window === "undefined" ? fallback : window.location.href;
}

function getCampaignContext() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    gclid: params.get("gclid"),
    fbclid: params.get("fbclid"),
    referrer: document.referrer || null,
  };
}

function optionLabel(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label || value || "";
}

function parseBudgetRange(value: string): { min: number | null; max: number | null } {
  const map: Record<string, { min: number | null; max: number | null }> = {
    under_5cr: { min: null, max: 50_000_000 },
    "5_10cr": { min: 50_000_000, max: 100_000_000 },
    "10_25cr": { min: 100_000_000, max: 250_000_000 },
    "25_50cr": { min: 250_000_000, max: 500_000_000 },
    "50cr_plus": { min: 500_000_000, max: null },
  };
  return map[value] || { min: null, max: null };
}

function isValidEmail(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function phoneLooksValid(value: string) {
  return value.replace(/\D/g, "").length >= 10;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}

function SubmitState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center text-slate-900">
      <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-600" />
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

function FormShell({ eyebrow, title, text, error, children }: { eyebrow: string; title: string; text: string; error: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9f7a35]">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
      </div>
      {children}
      {error ? <p className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

function trackCta(pageType: PageType, commercialIntent: CommercialIntent, ctaLocation: "hero" | "pathway_card" | "inline" | "form" | "final_cta", locationScope?: string) {
  trackCommercialPhase1Event("commercial_phase1_primary_cta", {
    page_type: pageType,
    commercial_intent: commercialIntent,
    cta_location: ctaLocation,
    location_scope: locationScope,
  });
}

export function CommercialCta({ href, label, pageType, intent, ctaLocation = "hero", variant = "primary" }: { href: string; label: string; pageType: PageType; intent: CommercialIntent; ctaLocation?: "hero" | "pathway_card" | "inline" | "form" | "final_cta"; variant?: "primary" | "secondary" }) {
  const className = variant === "primary"
    ? "inline-flex min-h-12 items-center justify-center rounded-sm bg-[#b08a42] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#987335]"
    : "inline-flex min-h-12 items-center justify-center rounded-sm border border-slate-300 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-900 transition hover:border-[#b08a42] hover:text-[#8c672e]";

  return (
    <Link href={href} onClick={() => trackCta(pageType, intent, ctaLocation)} className={className}>
      {label}
    </Link>
  );
}

export function ServicePathwayTracker({ href, children, intent }: { href: string; children: React.ReactNode; intent: CommercialIntent }) {
  return (
    <Link
      href={href}
      onClick={() => {
        trackCommercialPhase1Event("commercial_phase1_service_selected", {
          page_type: "commercial_hyderabad_hub",
          commercial_intent: intent,
          cta_location: "pathway_card",
        });
      }}
      className="group block h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#b08a42]/50 hover:shadow-xl hover:shadow-slate-200/80"
    >
      {children}
    </Link>
  );
}

export function HubRequirementForm() {
  const [form, setForm] = useState({ name: "", phone: "", company: "", email: "", intent: "", location: "", timeline: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const inFlight = useRef(false);
  const succeeded = useRef(false);
  const selectedLocation = useRef("");

  const start = () => {
    if (started.current) return;
    started.current = true;
    trackCommercialPhase1Event("commercial_phase1_form_start", {
      page_type: "commercial_hyderabad_hub",
      commercial_intent: "commercial_hub",
      location_scope: form.location || "hyderabad",
    });
  };

  const update = (field: keyof typeof form, value: string) => {
    start();
    if (field === "intent" && value) {
      trackCommercialPhase1Event("commercial_phase1_service_selected", {
        page_type: "commercial_hyderabad_hub",
        commercial_intent: value as CommercialIntent,
        cta_location: "form",
      });
    }
    if (field === "location" && value && selectedLocation.current !== value) {
      selectedLocation.current = value;
      trackCommercialPhase1Event("commercial_phase1_location_selected", {
        page_type: "commercial_hyderabad_hub",
        commercial_intent: "commercial_hub",
        location_selection: value,
      });
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current || succeeded.current) return;
    setError("");

    if (!form.name.trim() || !form.phone.trim() || !form.intent) {
      setError("Please share your name, phone and commercial requirement type.");
      return;
    }
    if (!phoneLooksValid(form.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid work email or leave it blank.");
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    const campaign = getCampaignContext();
    const locationLabel = optionLabel(COMMERCIAL_LOCATIONS, form.location || "hyderabad");
    const intentLabel = optionLabel(SERVICE_INTENTS, form.intent);

    try {
      const result = await submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        type: form.intent === "commercial_lease" || form.intent === "managed_office" ? "CORPORATE_OFFICE_LEASING" : "GENERAL_CONTACT",
        source_page: getPageUrl("/commercial/hyderabad"),
        property_type: "Commercial Real Estate",
        details: {
          source_type: "website",
          source_name: "commercial_hyderabad_hub",
          source_page_type: "commercial_hyderabad_hub",
          intent: form.intent,
          transaction_type: form.intent,
          requirement_type: "hub_router",
          requirement_category: "commercial_hyderabad_hub",
          city: "hyderabad",
          locality: locationLabel,
          location_preference: locationLabel,
          property_type: "Commercial Real Estate",
          buyer_type: form.intent,
          company_name: form.company.trim() || null,
          timeline: optionLabel(TIMELINES, form.timeline),
          notes: `HYDERABAD COMMERCIAL HUB ENQUIRY. Intent: ${intentLabel}. Preferred location: ${locationLabel}. Timeline: ${optionLabel(TIMELINES, form.timeline) || "Not specified"}.${form.company.trim() ? ` Company: ${form.company.trim()}.` : ""}`,
          ...campaign,
        },
        attribution_metadata: {
          source_page_type: "commercial_hyderabad_hub",
          intent: form.intent,
          transaction_type: form.intent,
          requirement_type: "hub_router",
          requirement_category: "commercial_hyderabad_hub",
          city: "hyderabad",
          locality: locationLabel,
          preferred_location: form.location || "hyderabad",
          company_name: form.company.trim() || null,
          timeline: form.timeline || null,
          ...campaign,
        },
      });

      if (!result.success) {
        setError(result.error || "We could not submit this requirement. Please try again.");
        return;
      }

      succeeded.current = true;
      setSubmitted(true);
      trackCommercialPhase1Event("commercial_phase1_form_submit_success", {
        page_type: "commercial_hyderabad_hub",
        commercial_intent: "commercial_hub",
        location_scope: form.location || "hyderabad",
        requirement_type: "hub_router",
      });
    } catch (err) {
      console.error("[HubRequirementForm] submit failed", err);
      setError("We could not submit this requirement. Please try again.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <SubmitState title="Commercial requirement received" text="Westside will review the requirement type and location preference before routing it to the right commercial advisory workflow." />;
  }

  return (
    <FormShell eyebrow="Start with one brief" title="Tell us what you are trying to solve" text="Share the commercial path you are considering. We will route the enquiry to the right advisory workflow instead of forcing you into a generic property search." error={error}>
      <form id="commercial-requirement" noValidate onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required><input className={fieldClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" /></Field>
          <Field label="Phone" required><input className={fieldClass} type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company"><input className={fieldClass} value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Optional" /></Field>
          <Field label="Work Email"><input className={fieldClass} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Optional" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Commercial Requirement" required>
            <select className={fieldClass} value={form.intent} onChange={(e) => update("intent", e.target.value)}>
              <option value="">Select requirement</option>
              {SERVICE_INTENTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Preferred Location">
            <select className={fieldClass} value={form.location} onChange={(e) => update("location", e.target.value)}>
              <option value="">Hyderabad / flexible</option>
              {COMMERCIAL_LOCATIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Timeline">
          <select className={fieldClass} value={form.timeline} onChange={(e) => update("timeline", e.target.value)}>
            <option value="">Select timeline</option>
            {TIMELINES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <button type="submit" disabled={submitting} className="mt-2 min-h-12 rounded-sm bg-[#b08a42] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#987335] disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Submitting…" : "Share Commercial Requirement"}
        </button>
      </form>
    </FormShell>
  );
}

export function OfficeSaleRequirementForm() {
  const [form, setForm] = useState({ name: "", phone: "", company: "", email: "", purchasePurpose: "", budget: "", area: "", location: "", propertyPreference: "", timeline: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const inFlight = useRef(false);
  const succeeded = useRef(false);
  const selectedPurpose = useRef("");
  const selectedArea = useRef("");
  const selectedLocation = useRef("");

  const start = () => {
    if (started.current) return;
    started.current = true;
    trackCommercialPhase1Event("commercial_phase1_form_start", { page_type: "commercial_office_sale", commercial_intent: "office_purchase", location_scope: form.location || "hyderabad" });
  };

  const update = (field: keyof typeof form, value: string) => {
    start();
    if (field === "purchasePurpose" && value && selectedPurpose.current !== value) {
      selectedPurpose.current = value;
      trackCommercialPhase1Event("commercial_phase1_purchase_intent_selected", { page_type: "commercial_office_sale", commercial_intent: "office_purchase", purchase_purpose: value });
    }
    if (field === "area" && value && selectedArea.current !== value) {
      selectedArea.current = value;
      trackCommercialPhase1Event("commercial_phase1_area_selected", { page_type: "commercial_office_sale", commercial_intent: "office_purchase", area_band: value });
    }
    if (field === "location" && value && selectedLocation.current !== value) {
      selectedLocation.current = value;
      trackCommercialPhase1Event("commercial_phase1_location_selected", { page_type: "commercial_office_sale", commercial_intent: "office_purchase", location_selection: value });
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current || succeeded.current) return;
    setError("");

    if (!form.name.trim() || !form.phone.trim() || !form.purchasePurpose) {
      setError("Please share your name, phone and purchase purpose.");
      return;
    }
    if (!phoneLooksValid(form.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid work email or leave it blank.");
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    const campaign = getCampaignContext();
    const budget = parseBudgetRange(form.budget);
    const locationLabel = optionLabel(COMMERCIAL_LOCATIONS, form.location || "hyderabad");
    const purposeLabel = optionLabel(PURCHASE_PURPOSES, form.purchasePurpose);
    const preferenceLabel = optionLabel(PROPERTY_PREFERENCES, form.propertyPreference);
    const areaLabel = optionLabel(AREA_BANDS, form.area);
    const timelineLabel = optionLabel(TIMELINES, form.timeline);

    try {
      const result = await submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        type: "GENERAL_CONTACT" as LeadType,
        source_page: getPageUrl("/commercial/hyderabad/office-space-for-sale"),
        property_type: "Commercial Office Space for Sale",
        details: {
          source_type: "website",
          source_name: "commercial_office_sale",
          source_page_type: "commercial_office_sale",
          intent: "office_purchase",
          transaction_type: "sale",
          requirement_type: "office_purchase",
          requirement_category: "commercial_office_purchase",
          city: "hyderabad",
          locality: locationLabel,
          location_preference: locationLabel,
          property_type: "Commercial Office Space for Sale",
          buyer_type: form.purchasePurpose,
          company_name: form.company.trim() || null,
          purchase_purpose: form.purchasePurpose,
          required_area: areaLabel || null,
          preferred_location: form.location || null,
          property_preference: form.propertyPreference || null,
          asset_status_preference: form.propertyPreference || null,
          timeline: timelineLabel || null,
          budget_min: budget.min,
          budget_max: budget.max,
          budget_band: form.budget || null,
          notes: `HYDERABAD OFFICE PURCHASE REQUIREMENT. Purchase purpose: ${purposeLabel}. Budget: ${optionLabel(BUDGET_BANDS, form.budget) || "Not specified"}. Area: ${areaLabel || "Not specified"}. Preferred location: ${locationLabel}. Property preference: ${preferenceLabel || "Not specified"}. Timeline: ${timelineLabel || "Not specified"}.${form.company.trim() ? ` Company: ${form.company.trim()}.` : ""}`,
          ...campaign,
        },
        attribution_metadata: {
          source_page_type: "commercial_office_sale",
          intent: "office_purchase",
          transaction_type: "sale",
          requirement_type: "office_purchase",
          requirement_category: "commercial_office_purchase",
          city: "hyderabad",
          locality: locationLabel,
          preferred_location: form.location || null,
          company_name: form.company.trim() || null,
          purchase_purpose: form.purchasePurpose,
          required_area: form.area || null,
          property_preference: form.propertyPreference || null,
          asset_status_preference: form.propertyPreference || null,
          timeline: form.timeline || null,
          budget_band: form.budget || null,
          ...campaign,
        },
      });

      if (!result.success) {
        setError(result.error || "We could not submit this requirement. Please try again.");
        return;
      }
      succeeded.current = true;
      setSubmitted(true);
      trackCommercialPhase1Event("commercial_phase1_form_submit_success", { page_type: "commercial_office_sale", commercial_intent: "office_purchase", location_scope: form.location || "hyderabad", requirement_type: "office_purchase" });
    } catch (err) {
      console.error("[OfficeSaleRequirementForm] submit failed", err);
      setError("We could not submit this requirement. Please try again.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (submitted) return <SubmitState title="Office purchase brief received" text="Our commercial advisory team will review the acquisition brief before discussing suitable Hyderabad office options." />;

  return (
    <FormShell eyebrow="Office purchase brief" title="Share your office acquisition requirement" text="Use this form for commercial office purchase requirements. If your primary requirement is yield or a pre-leased investment, we will route the conversation accordingly." error={error}>
      <form id="office-sale-requirement" noValidate onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required><input className={fieldClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" /></Field>
          <Field label="Phone" required><input className={fieldClass} type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company"><input className={fieldClass} value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Optional" /></Field>
          <Field label="Work Email"><input className={fieldClass} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Optional" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Purchase Purpose" required><select className={fieldClass} value={form.purchasePurpose} onChange={(e) => update("purchasePurpose", e.target.value)}><option value="">Select purpose</option>{PURCHASE_PURPOSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
          <Field label="Purchase Budget"><select className={fieldClass} value={form.budget} onChange={(e) => update("budget", e.target.value)}><option value="">Select budget</option>{BUDGET_BANDS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Required Area"><select className={fieldClass} value={form.area} onChange={(e) => update("area", e.target.value)}><option value="">Select area band</option>{AREA_BANDS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
          <Field label="Preferred Location"><select className={fieldClass} value={form.location} onChange={(e) => update("location", e.target.value)}><option value="">Hyderabad / flexible</option>{COMMERCIAL_LOCATIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property Preference"><select className={fieldClass} value={form.propertyPreference} onChange={(e) => update("propertyPreference", e.target.value)}><option value="">Select preference</option>{PROPERTY_PREFERENCES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
          <Field label="Timeline"><select className={fieldClass} value={form.timeline} onChange={(e) => update("timeline", e.target.value)}><option value="">Select timeline</option>{TIMELINES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        </div>
        <button type="submit" disabled={submitting} className="mt-2 min-h-12 rounded-sm bg-[#b08a42] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#987335] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Submitting…" : "Discuss Office Purchase"}</button>
      </form>
    </FormShell>
  );
}

export function ManagedOfficeRequirementForm() {
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", seats: "", location: "", timeline: "", officeType: "", budget: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const inFlight = useRef(false);
  const succeeded = useRef(false);
  const selectedSeatBand = useRef("");
  const selectedLocation = useRef("");
  const selectedOfficeType = useRef("");

  const start = () => {
    if (started.current) return;
    started.current = true;
    trackCommercialPhase1Event("commercial_phase1_form_start", { page_type: "managed_office", commercial_intent: "managed_office", location_scope: form.location || "hyderabad" });
  };

  const update = (field: keyof typeof form, value: string) => {
    start();
    if (field === "seats" && value && selectedSeatBand.current !== value) {
      selectedSeatBand.current = value;
      trackCommercialPhase1Event("commercial_phase1_seat_band_selected", { page_type: "managed_office", commercial_intent: "managed_office", seat_band: value });
    }
    if (field === "location" && value && selectedLocation.current !== value) {
      selectedLocation.current = value;
      trackCommercialPhase1Event("commercial_phase1_location_selected", { page_type: "managed_office", commercial_intent: "managed_office", location_selection: value });
    }
    if (field === "officeType" && value && selectedOfficeType.current !== value) {
      selectedOfficeType.current = value;
      trackCommercialPhase1Event("commercial_phase1_office_type_selected", { page_type: "managed_office", commercial_intent: "managed_office", office_type: value });
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const chooseSeatBand = (value: string) => {
    update("seats", value);
    document.getElementById("managed-office-requirement")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current || succeeded.current) return;
    setError("");

    if (!form.name.trim() || !form.company.trim() || !form.phone.trim() || !form.email.trim() || !form.seats) {
      setError("Please share your name, company, phone, work email and seat requirement.");
      return;
    }
    if (!phoneLooksValid(form.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid work email.");
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    const campaign = getCampaignContext();
    const locationLabel = optionLabel(COMMERCIAL_LOCATIONS, form.location || "hyderabad");
    const seatLabel = optionLabel(SEAT_BANDS, form.seats);
    const typeLabel = optionLabel(OFFICE_TYPES, form.officeType);
    const timelineLabel = optionLabel(TIMELINES, form.timeline);

    try {
      const result = await submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        type: "CORPORATE_OFFICE_LEASING",
        source_page: getPageUrl("/commercial/hyderabad/managed-office-space"),
        property_type: "Managed Office Space",
        details: {
          source_type: "website",
          source_name: "managed_office_hyderabad",
          source_page_type: "managed_office",
          intent: "managed_office",
          transaction_type: "managed_office",
          requirement_type: "managed_office",
          requirement_category: "managed_office",
          city: "hyderabad",
          locality: locationLabel,
          location_preference: locationLabel,
          property_type: "Managed Office Space",
          buyer_type: "managed_office_requirement",
          company_name: form.company.trim(),
          seats: seatLabel,
          preferred_location: form.location || null,
          preferred_locations: form.location ? [locationLabel] : [],
          move_in_timeline: timelineLabel || null,
          timeline: timelineLabel || null,
          fit_out: typeLabel || null,
          office_type: form.officeType || null,
          rent_budget: form.budget.trim() || null,
          additionalDetails: form.notes.trim() || null,
          notes: `MANAGED OFFICE REQUIREMENT. Company: ${form.company.trim()}. Seats: ${seatLabel}. Preferred location: ${locationLabel}. Office type: ${typeLabel || "Not specified"}. Move-in timeline: ${timelineLabel || "Not specified"}.${form.budget.trim() ? ` Approx budget: ${form.budget.trim()}.` : ""}${form.notes.trim() ? ` Notes: ${form.notes.trim()}.` : ""}`,
          ...campaign,
        },
        attribution_metadata: {
          source_page_type: "managed_office",
          intent: "managed_office",
          transaction_type: "managed_office",
          requirement_type: "managed_office",
          requirement_category: "managed_office",
          city: "hyderabad",
          locality: locationLabel,
          company_name: form.company.trim(),
          seat_band: form.seats,
          seats: seatLabel,
          preferred_location: form.location || null,
          move_in_timeline: form.timeline || null,
          office_type: form.officeType || null,
          rent_budget: form.budget.trim() || null,
          ...campaign,
        },
      });

      if (!result.success) {
        setError(result.error || "We could not submit this requirement. Please try again.");
        return;
      }
      succeeded.current = true;
      setSubmitted(true);
      trackCommercialPhase1Event("commercial_phase1_form_submit_success", { page_type: "managed_office", commercial_intent: "managed_office", location_scope: form.location || "hyderabad", requirement_type: "managed_office" });
    } catch (err) {
      console.error("[ManagedOfficeRequirementForm] submit failed", err);
      setError("We could not submit this requirement. Please try again.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (submitted) return <SubmitState title="Managed office brief received" text="Westside will review your team size, location preference and move-in timeline before identifying suitable managed or furnished options." />;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9f7a35]">Seat bands</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Start with team size</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">Pick the closest band. This is used only to qualify the requirement and does not create separate SEO pages.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {SEAT_BANDS.map((option) => (
            <button key={option.value} type="button" onClick={() => chooseSeatBand(option.value)} aria-pressed={form.seats === option.value} className={form.seats === option.value ? "rounded-sm border border-[#b08a42] bg-[#fff8e8] px-4 py-3 text-left text-sm font-semibold text-slate-950" : "rounded-sm border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#b08a42]/60 hover:text-slate-950"}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <FormShell eyebrow="Managed office brief" title="Share team size, location and move-in timeline" text="Westside uses the requirement to identify suitable managed, furnished or plug-and-play options across operators and buildings. Features vary by selected option." error={error}>
        <form id="managed-office-requirement" noValidate onSubmit={submit} className="grid gap-4 scroll-mt-28">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required><input className={fieldClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" /></Field>
            <Field label="Company" required><input className={fieldClass} value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Company / organisation" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required><input className={fieldClass} type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" /></Field>
            <Field label="Work Email" required><input className={fieldClass} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@company.com" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of Seats" required><select className={fieldClass} value={form.seats} onChange={(e) => update("seats", e.target.value)}><option value="">Select seat band</option>{SEAT_BANDS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
            <Field label="Preferred Location"><select className={fieldClass} value={form.location} onChange={(e) => update("location", e.target.value)}><option value="">Hyderabad / flexible</option>{COMMERCIAL_LOCATIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Move-In Timeline"><select className={fieldClass} value={form.timeline} onChange={(e) => update("timeline", e.target.value)}><option value="">Select timeline</option>{TIMELINES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
            <Field label="Office Type"><select className={fieldClass} value={form.officeType} onChange={(e) => update("officeType", e.target.value)}><option value="">Select type</option>{OFFICE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
          </div>
          <Field label="Approximate Budget"><input className={fieldClass} value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="Optional — per seat, monthly or total budget" /></Field>
          <Field label="Additional Requirement"><textarea className={`${fieldClass} min-h-28 resize-y`} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Optional. Avoid sharing confidential data here." /></Field>
          <button type="submit" disabled={submitting} className="mt-2 min-h-12 rounded-sm bg-[#b08a42] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#987335] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Submitting…" : "Get Managed Office Options"}</button>
        </form>
      </FormShell>
    </div>
  );
}
