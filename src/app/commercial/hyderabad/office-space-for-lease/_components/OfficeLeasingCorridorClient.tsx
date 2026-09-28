"use client";

import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitLead } from "@/app/actions/submit-lead";
import { trackCorporateLeasingEvent } from "@/lib/analytics/corporateLeasingTracking";
import type { CorridorPageData } from "../_data/corridorPages";

const AREA_RANGES = [
  "Under 10,000 sq ft",
  "10,000-25,000 sq ft",
  "25,000-50,000 sq ft",
  "50,000-100,000 sq ft",
  "100,000-250,000 sq ft",
  "250,000+ sq ft",
];
const REQUIREMENT_TYPES = ["New Office", "Expansion", "Relocation", "Consolidation", "GCC Setup", "Other"];
const FIT_OUTS = ["Bare Shell", "Warm Shell", "Furnished / Plug-and-Play", "Flexible"];
const TIMELINES = ["Immediately", "Within 3 months", "3-6 months", "6-12 months", "Exploring / Flexible"];

type CorridorContext = Pick<CorridorPageData, "locationScope" | "canonicalUrl" | "corridorLabel" | "selectedLocations" | "slug" | "formIntro">;

const getCampaignContext = () => {
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
};

function analyticsContext(corridor: CorridorContext) {
  return {
    page_path: new URL(corridor.canonicalUrl).pathname,
    page_type: "office_leasing_corridor" as const,
    commercial_intent: "office_lease" as const,
    location_scope: corridor.locationScope,
  };
}

export function CorridorPrimaryCta({ corridor, label }: { corridor: CorridorContext; label: string }) {
  return (
    <a
      href="#office-requirement"
      onClick={() => trackCorporateLeasingEvent("corporate_leasing_primary_cta", { cta_location: "hero", ...analyticsContext(corridor) })}
      className="inline-flex min-h-12 items-center justify-center rounded-sm bg-[#c8a96e] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#101010] transition hover:bg-[#d9bd82]"
    >
      {label}
    </a>
  );
}

export function OfficeLeasingCorridorForm({ corridor }: { corridor: CorridorContext }) {
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    phone: "",
    workEmail: "",
    requirementType: "",
    currentOfficeLocation: "",
    requiredArea: "",
    fitOut: "",
    timeline: "",
    rentBudget: "",
    seats: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const openedTracked = useRef(false);
  const submissionInFlight = useRef(false);
  const submissionSucceeded = useRef(false);
  const selectedArea = useRef("");
  const context = analyticsContext(corridor);

  const trackOpened = () => {
    if (openedTracked.current) return;
    openedTracked.current = true;
    trackCorporateLeasingEvent("corporate_leasing_form_start", context);
    trackCorporateLeasingEvent("corporate_leasing_location_selected", {
      ...context,
      location_selection: corridor.locationScope,
    });
  };

  const update = (field: keyof typeof form, value: string) => {
    trackOpened();
    if (field === "requiredArea" && value && selectedArea.current !== value) {
      selectedArea.current = value;
      trackCorporateLeasingEvent("corporate_leasing_area_selected", { ...context, area_band: value });
    }
    if (field === "requiredArea" && !value) selectedArea.current = "";
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionInFlight.current || submissionSucceeded.current) return;
    setError("");

    if (!form.name.trim() || !form.companyName.trim() || !form.phone.trim() || !form.workEmail.trim() || !form.requirementType || !form.requiredArea) {
      setError("Please complete the required fields.");
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    const campaign = getCampaignContext();
    const locationPreference = corridor.selectedLocations.join(", ");
    const notes = [
      "CORPORATE OFFICE LEASING CORRIDOR REQUIREMENT",
      `Corridor: ${corridor.corridorLabel}`,
      `Company: ${form.companyName}`,
      `Requirement type: ${form.requirementType}`,
      form.currentOfficeLocation ? `Current office/location: ${form.currentOfficeLocation}` : null,
      `Required area: ${form.requiredArea}`,
      `Preferred locations: ${locationPreference}`,
      form.fitOut ? `Fit-out: ${form.fitOut}` : null,
      form.timeline ? `Move-in timeline: ${form.timeline}` : null,
      form.rentBudget ? `Approx. rent budget: ${form.rentBudget}` : null,
      form.seats ? `Seats: ${form.seats}` : null,
      form.notes ? `Notes: ${form.notes}` : null,
    ].filter(Boolean).join(". ");

    const sharedContext = {
      source_page_type: "office_leasing_corridor",
      intent: "commercial_lease",
      commercial_intent: "office_lease",
      transaction_type: "lease",
      requirement_type: form.requirementType,
      requirement_category: "corporate_office_leasing",
      city: "hyderabad",
      locality: corridor.corridorLabel,
      location_scope: corridor.locationScope,
      corridor_slug: corridor.slug,
      location_preference: locationPreference,
      property_type: "Corporate Office Space",
      buyer_type: "corporate_occupier",
      company_name: form.companyName.trim(),
      current_office_location: form.currentOfficeLocation.trim() || null,
      required_area: form.requiredArea,
      preferred_locations: corridor.selectedLocations,
      selected_locations: corridor.selectedLocations,
      fit_out: form.fitOut || null,
      move_in_timeline: form.timeline || null,
      timeline: form.timeline || null,
      rent_budget: form.rentBudget.trim() || null,
      seats: form.seats.trim() || null,
      notes,
      ...campaign,
    };

    try {
      const result = await submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.workEmail.trim(),
        type: "CORPORATE_OFFICE_LEASING",
        source_page: typeof window === "undefined" ? corridor.canonicalUrl : window.location.href,
        property_type: "Corporate Office Space",
        details: {
          source_type: "website",
          source_name: `office_leasing_corridor_${corridor.locationScope}`,
          ...sharedContext,
        },
        attribution_metadata: sharedContext,
      });

      if (!result.success) {
        setError(result.error || "We could not submit this requirement. Please try again.");
        return;
      }

      submissionSucceeded.current = true;
      setSubmitted(true);
      trackCorporateLeasingEvent("corporate_leasing_form_submit_success", context);
    } catch (err) {
      console.error("[OfficeLeasingCorridorForm] submit failed:", err);
      setError("We could not submit this requirement. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-sm border border-emerald-400/25 bg-emerald-500/10 p-8 text-center text-white">
        <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-300" />
        <h2 className="text-2xl font-semibold uppercase tracking-[0.08em]">Requirement Received</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
          Our Corporate Leasing team will review the {corridor.corridorLabel} requirement and contact you before preparing suitable office options.
        </p>
      </div>
    );
  }

  return (
    <form id="office-requirement" noValidate onSubmit={submit} className="scroll-mt-28 rounded-sm border border-white/10 bg-[#111111] p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8a96e]">Tell Us Your Office Requirement</p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Share one {corridor.corridorLabel} office requirement.</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">{corridor.formIntro}</p>
      </div>

      <div className="rounded-sm border border-[#c8a96e]/25 bg-[#c8a96e]/10 p-4 text-sm leading-7 text-[#eadbbd]">
        Preselected corridor: <strong className="text-white">{corridor.corridorLabel}</strong>. Preferred locations sent with the enquiry: {corridor.selectedLocations.join(", ")}.
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="co-field" placeholder="Your name" />
        </Field>
        <Field label="Company Name" required>
          <input required value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="co-field" placeholder="Company / organisation" />
        </Field>
        <Field label="Phone" required>
          <input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="co-field" placeholder="+91 XXXXX XXXXX" />
        </Field>
        <Field label="Work Email" required>
          <input required type="email" value={form.workEmail} onChange={(e) => update("workEmail", e.target.value)} className="co-field" placeholder="name@company.com" />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Requirement Type" required>
          <select required value={form.requirementType} onChange={(e) => update("requirementType", e.target.value)} className="co-field">
            <option value="">Select requirement type</option>
            {REQUIREMENT_TYPES.map((requirementType) => <option key={requirementType}>{requirementType}</option>)}
          </select>
        </Field>
        <Field label="Current Office / Location">
          <input value={form.currentOfficeLocation} onChange={(e) => update("currentOfficeLocation", e.target.value)} className="co-field" placeholder="Optional relocation / expansion context" />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Required Office Area" required>
          <select required value={form.requiredArea} onChange={(e) => update("requiredArea", e.target.value)} className="co-field">
            <option value="">Select area range</option>
            {AREA_RANGES.map((range) => <option key={range}>{range}</option>)}
          </select>
        </Field>
        <Field label="Move-In Timeline">
          <select value={form.timeline} onChange={(e) => update("timeline", e.target.value)} className="co-field">
            <option value="">Select timeline</option>
            {TIMELINES.map((timeline) => <option key={timeline}>{timeline}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Fit-Out">
          <select value={form.fitOut} onChange={(e) => update("fitOut", e.target.value)} className="co-field">
            <option value="">Select fit-out preference</option>
            {FIT_OUTS.map((fitOut) => <option key={fitOut}>{fitOut}</option>)}
          </select>
        </Field>
        <Field label="Approx. Rent Budget">
          <input value={form.rentBudget} onChange={(e) => update("rentBudget", e.target.value)} className="co-field" placeholder="Optional" />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
        <Field label="Number of Seats">
          <input value={form.seats} onChange={(e) => update("seats", e.target.value)} className="co-field" placeholder="Optional" />
        </Field>
        <Field label="Additional Requirement">
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className="co-field min-h-24 resize-y" placeholder="Any floor plate, parking, lease term or timing notes..." />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex min-h-12 w-full items-center justify-center rounded-sm bg-[#c8a96e] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#101010] transition hover:bg-[#d9bd82] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting Requirement..." : "Get Matching Office Options"}
      </button>

      <p className="mt-4 text-center text-xs leading-6 text-slate-500">
        This is a corporate office requirement enquiry. Westside will not publish your company details.
      </p>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}{required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
