"use client";

import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitLead } from "@/lib/analytics/submitTrackedLead";

type SelectOption = { label: string; value: string };

const CITY_OPTIONS: SelectOption[] = [
  { label: "Hyderabad", value: "hyderabad" },
  { label: "Bengaluru", value: "bengaluru" },
  { label: "Both", value: "both" },
];

const BUDGET_OPTIONS: SelectOption[] = [
  { label: "Below ₹5 Cr", value: "below_5cr" },
  { label: "₹5–10 Cr", value: "5_10cr" },
  { label: "₹10–25 Cr", value: "10_25cr" },
  { label: "₹25–50 Cr", value: "25_50cr" },
  { label: "₹50 Cr+", value: "50cr_plus" },
];

const PREFERENCE_OPTIONS: SelectOption[] = [
  { label: "Grade-A Office", value: "grade_a_office" },
  { label: "Pre-Leased", value: "pre_leased" },
  { label: "Corporate Self-Use", value: "corporate_self_use" },
  { label: "Retail", value: "retail" },
  { label: "Open to Options", value: "open_to_options" },
];

const TIMELINE_OPTIONS: SelectOption[] = [
  { label: "Immediately", value: "immediately" },
  { label: "1–3 Months", value: "1_3_months" },
  { label: "3–6 Months", value: "3_6_months" },
  { label: "Exploring", value: "exploring" },
];

const fieldClass =
  "min-h-12 w-full rounded-sm border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1f5f8b] focus:ring-2 focus:ring-[#1f5f8b]/15";
const labelClass = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";

function optionLabel(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label || value || "";
}

function parseBudgetRange(value: string): { min: number | null; max: number | null } {
  const map: Record<string, { min: number | null; max: number | null }> = {
    below_5cr: { min: null, max: 50_000_000 },
    "5_10cr": { min: 50_000_000, max: 100_000_000 },
    "10_25cr": { min: 100_000_000, max: 250_000_000 },
    "25_50cr": { min: 250_000_000, max: 500_000_000 },
    "50cr_plus": { min: 500_000_000, max: null },
  };
  return map[value] || { min: null, max: null };
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

function phoneLooksValid(value: string) {
  return value.replace(/\D/g, "").length >= 10;
}

function analyticsCity(value: string) {
  return value === "hyderabad" || value === "bengaluru" ? value : undefined;
}

function commercialIntent(preference: string) {
  return preference === "pre_leased" || preference === "retail" ? "commercial_investment" : "office_purchase";
}

export default function CommercialLandingForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    budget: "",
    preference: "",
    timeline: "",
    requirement: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const succeeded = useRef(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || succeeded.current) return;
    setError("");

    if (!form.name.trim() || !form.phone.trim() || !form.city || !form.budget || !form.preference || !form.timeline) {
      setError("Please complete the required fields so we can qualify the commercial purchase brief.");
      return;
    }

    if (!phoneLooksValid(form.phone)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    inFlight.current = true;
    setSubmitting(true);

    const budget = parseBudgetRange(form.budget);
    const cityLabel = optionLabel(CITY_OPTIONS, form.city);
    const budgetLabel = optionLabel(BUDGET_OPTIONS, form.budget);
    const preferenceLabel = optionLabel(PREFERENCE_OPTIONS, form.preference);
    const timelineLabel = optionLabel(TIMELINE_OPTIONS, form.timeline);
    const intent = commercialIntent(form.preference);
    const cityForAnalytics = analyticsCity(form.city);
    const campaign = getCampaignContext();

    try {
      const lead = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        type: "GENERAL_CONTACT" as const,
        source_page: typeof window === "undefined" ? "/commercial" : window.location.href,
        property_type: "Commercial Real Estate",
        details: {
          source_type: "website",
          source_name: "commercial_sales_landing",
          source_page_type: "commercial_sales_landing",
          segment: "commercial",
          intent,
          transaction_type: "sale",
          requirement_type: intent,
          requirement_category: "commercial_purchase",
          city: cityForAnalytics,
          city_scope: form.city,
          location_preference: cityLabel,
          property_type: "Commercial Real Estate",
          buyer_type: form.preference,
          property_preference: form.preference,
          budget_band: form.budget,
          budgetBand: form.budget,
          budget_min: budget.min,
          budget_max: budget.max,
          timeline: timelineLabel,
          purchaseTimeline: timelineLabel,
          additionalDetails: form.requirement.trim() || null,
          notes: `COMMERCIAL SALES LANDING ENQUIRY. Preferred city: ${cityLabel}. Budget: ${budgetLabel}. Property preference: ${preferenceLabel}. Purchase timeline: ${timelineLabel}.${form.requirement.trim() ? ` Additional requirement: ${form.requirement.trim()}.` : ""}`,
          ...campaign,
        },
        attribution_metadata: {
          source_page_type: "commercial_sales_landing",
          source_page: "/commercial",
          lead_category: "commercial",
          intent,
          transaction_type: "sale",
          requirement_type: intent,
          requirement_category: "commercial_purchase",
          city: cityForAnalytics,
          city_scope: form.city,
          preferred_city: form.city,
          budget_band: form.budget,
          property_preference: form.preference,
          timeline: form.timeline,
          ...campaign,
        },
      };

      const result = await submitLead(lead, "commercial_sales_landing");

      if (!result.success) {
        setError(result.error || "We could not submit this requirement. Please try again.");
        return;
      }

      succeeded.current = true;
      setSubmitted(true);
    } catch (err) {
      console.error("[CommercialLandingForm] submit failed", err);
      setError("We could not submit this requirement. Please try again.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Commercial requirement received</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
          Westside will review the city, budget and asset preference before discussing suitable purchase or investment options.
        </p>
      </div>
    );
  }

  return (
    <form id="commercial-requirement" noValidate onSubmit={handleSubmit} className="grid scroll-mt-28 gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Full Name *</span>
          <input className={fieldClass} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" />
        </label>
        <label className="block">
          <span className={labelClass}>Mobile Number *</span>
          <input className={fieldClass} type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 XXXXX XXXXX" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Preferred City *</span>
          <select className={fieldClass} value={form.city} onChange={(event) => update("city", event.target.value)}>
            <option value="">Select city</option>
            {CITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Investment Budget *</span>
          <select className={fieldClass} value={form.budget} onChange={(event) => update("budget", event.target.value)}>
            <option value="">Select budget</option>
            {BUDGET_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Property Preference *</span>
          <select className={fieldClass} value={form.preference} onChange={(event) => update("preference", event.target.value)}>
            <option value="">Select preference</option>
            {PREFERENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Purchase Timeline *</span>
          <select className={fieldClass} value={form.timeline} onChange={(event) => update("timeline", event.target.value)}>
            <option value="">Select timeline</option>
            {TIMELINE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Additional Requirement</span>
        <textarea
          className={`${fieldClass} min-h-28 resize-y`}
          value={form.requirement}
          onChange={(event) => update("requirement", event.target.value)}
          placeholder="Optional. Share asset size, preferred corridor or investment objective."
        />
      </label>

      {error ? <p className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-12 rounded-sm bg-[#1f5f8b] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Request Commercial Property Options"}
      </button>

      <p className="text-xs leading-6 text-slate-500">
        No public inventory claim is made from this form. Your requirement is routed through Westside&apos;s commercial advisory workflow.
      </p>
    </form>
  );
}
