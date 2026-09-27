"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { submitLead } from "@/app/actions/submit-lead";
import { trackCorporateLeasingEvent } from "@/lib/analytics/corporateLeasingTracking";

const AREA_RANGES = [
  "Under 10,000 sq ft",
  "10,000-25,000 sq ft",
  "25,000-50,000 sq ft",
  "50,000-100,000 sq ft",
  "100,000-250,000 sq ft",
  "250,000+ sq ft",
];

const LOCATIONS = [
  "Financial District",
  "Gachibowli",
  "HITEC City",
  "Raidurg",
  "Kokapet / Neopolis",
  "Other / Flexible",
];

const REQUIREMENT_TYPES = [
  "New Office",
  "Expansion",
  "Relocation",
  "Consolidation",
  "GCC Setup",
  "Other",
];

const FIT_OUTS = [
  "Bare Shell",
  "Warm Shell",
  "Furnished / Plug-and-Play",
  "Flexible",
];

const TIMELINES = [
  "Immediately",
  "Within 3 months",
  "3-6 months",
  "6-12 months",
  "Exploring / Flexible",
];

const AREA_SELECTED_EVENT = "corporate-office-area-selected";

const getPageUrl = () => (typeof window === "undefined" ? "/commercial/hyderabad/office-space-for-lease" : window.location.href);

const scrollToRequirementForm = () => {
  const scroll = () => document.getElementById("office-requirement")?.scrollIntoView({ behavior: "smooth", block: "center" });
  scroll();
  window.requestAnimationFrame(scroll);
  window.setTimeout(scroll, 80);
};

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

export function CorporateOfficeLeasingTracker() {
  return null;
}

export function CorporateOfficeLeasingCta({ label, variant = "primary" }: { label: string; variant?: "primary" | "secondary" }) {
  return (
    <a
      href="#office-requirement"
      onClick={() => {
        if (variant === "primary") trackCorporateLeasingEvent("corporate_leasing_primary_cta", { cta_location: "hero" });
      }}
      className={
        variant === "primary"
          ? "inline-flex min-h-12 items-center justify-center rounded-sm bg-[#c8a96e] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#101010] transition hover:bg-[#d9bd82]"
          : "inline-flex min-h-12 items-center justify-center rounded-sm border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:border-[#c8a96e] hover:text-[#c8a96e]"
      }
    >
      {label}
    </a>
  );
}

export function RequirementSizeSelector() {
  const chooseArea = (areaBand: string) => {
    window.dispatchEvent(new CustomEvent(AREA_SELECTED_EVENT, { detail: { areaBand } }));
    scrollToRequirementForm();
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.48fr_1.52fr] lg:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c8a96e]">Start Your Office Search</p>
        <h2 className="mt-2 text-xl font-semibold text-white">How much space are you looking for?</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        {AREA_RANGES.map((range, index) => (
          <button
            key={range}
            type="button"
            onClick={() => chooseArea(range)}
            className={
              index === 0
                ? "min-h-12 rounded-sm border border-white/10 bg-white/[0.025] px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-400 transition hover:border-[#c8a96e]/60 hover:text-white"
                : "min-h-12 rounded-sm border border-white/10 bg-white/[0.045] px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-200 transition hover:border-[#c8a96e]/70 hover:bg-[#c8a96e]/10 hover:text-white"
            }
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MarketCorridorSelector({
  corridors,
}: {
  corridors: { name: string; label?: string; note: string }[];
}) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const chooseLocation = (location: string) => {
    setSelectedLocations((prev) => (prev.includes(location) ? prev : [...prev, location]));
    window.dispatchEvent(new CustomEvent(AREA_SELECTED_EVENT, { detail: { location } }));
    scrollToRequirementForm();
  };

  return (
    <div className="mt-9 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
      {corridors.map((corridor) => {
        const selected = selectedLocations.includes(corridor.name);
        return (
          <button
            key={corridor.name}
            type="button"
            onClick={() => chooseLocation(corridor.name)}
            aria-pressed={selected}
            className={
              selected
                ? "bg-[#16120a] p-6 text-left ring-1 ring-inset ring-[#c8a96e]/70 transition hover:bg-[#1c160d]"
                : "bg-[#101010] p-6 text-left transition hover:bg-[#151515]"
            }
          >
            <MapPin className="mb-5 h-5 w-5 text-[#c8a96e]" />
            <h3 className="text-xl font-semibold text-white">{corridor.label || corridor.name}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{corridor.note}</p>
          </button>
        );
      })}
    </div>
  );
}

export function CorporateOfficeLeasingForm() {
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
  const [locations, setLocations] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const openedTracked = useRef(false);
  const submissionInFlight = useRef(false);
  const submissionSucceeded = useRef(false);
  const selectedArea = useRef("");
  const selectedLocations = useRef<string[]>([]);

  const trackArea = (areaBand: string) => {
    if (!AREA_RANGES.includes(areaBand) || selectedArea.current === areaBand) return;
    selectedArea.current = areaBand;
    trackCorporateLeasingEvent("corporate_leasing_area_selected", { area_band: areaBand });
  };

  const trackLocation = (location: string) => {
    if (!LOCATIONS.includes(location) || selectedLocations.current.includes(location)) return;
    selectedLocations.current = [...selectedLocations.current, location];
    trackCorporateLeasingEvent("corporate_leasing_location_selected", { location_selection: location });
  };

  const trackOpened = () => {
    if (openedTracked.current) return;
    openedTracked.current = true;
    trackCorporateLeasingEvent("corporate_leasing_form_start", {});
  };

  const update = (field: keyof typeof form, value: string) => {
    trackOpened();
    if (field === "requiredArea") {
      if (value) trackArea(value);
      else selectedArea.current = "";
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleLocation = (location: string) => {
    trackOpened();
    if (selectedLocations.current.includes(location)) {
      selectedLocations.current = selectedLocations.current.filter((item) => item !== location);
    } else {
      trackLocation(location);
    }
    setLocations((prev) => (
      prev.includes(location)
        ? prev.filter((item) => item !== location)
        : [...prev, location]
    ));
  };

  useEffect(() => {
    const handleFunnelSelection = (event: Event) => {
      const { areaBand, location } = (event as CustomEvent<{ areaBand?: string; location?: string }>).detail || {};
      if (!(areaBand && AREA_RANGES.includes(areaBand)) && !(location && LOCATIONS.includes(location))) return;
      if (!openedTracked.current) {
        openedTracked.current = true;
        trackCorporateLeasingEvent("corporate_leasing_form_start", {});
      }
      if (areaBand && AREA_RANGES.includes(areaBand)) {
        trackArea(areaBand);
        setForm((prev) => ({ ...prev, requiredArea: areaBand }));
      }
      if (location && LOCATIONS.includes(location)) {
        trackLocation(location);
        setLocations((prev) => (
          prev.includes(location)
            ? prev
            : [...prev, location]
        ));
      }
    };

    window.addEventListener(AREA_SELECTED_EVENT, handleFunnelSelection);
    return () => window.removeEventListener(AREA_SELECTED_EVENT, handleFunnelSelection);
  }, []);

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
    const locationPreference = locations.length ? locations.join(", ") : "Flexible / to be discussed";
    const notes = [
      "CORPORATE OFFICE LEASING REQUIREMENT",
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

    try {
      const result = await submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.workEmail.trim(),
        type: "CORPORATE_OFFICE_LEASING",
        source_page: getPageUrl(),
        property_type: "Corporate Office Space",
        details: {
          source_type: "website",
          source_name: "corporate_office_leasing",
          source_page_type: "corporate_office_leasing",
          intent: "commercial_lease",
          transaction_type: "lease",
          requirement_type: form.requirementType,
          requirement_category: "corporate_office_leasing",
          city: "hyderabad",
          locality: locationPreference,
          location_preference: locationPreference,
          property_type: "Corporate Office Space",
          buyer_type: "corporate_occupier",
          company_name: form.companyName.trim(),
          current_office_location: form.currentOfficeLocation.trim() || null,
          required_area: form.requiredArea,
          preferred_locations: locations,
          fit_out: form.fitOut || null,
          move_in_timeline: form.timeline || null,
          timeline: form.timeline || null,
          rent_budget: form.rentBudget.trim() || null,
          seats: form.seats.trim() || null,
          notes,
          ...campaign,
        },
        attribution_metadata: {
          source_page_type: "corporate_office_leasing",
          intent: "commercial_lease",
          transaction_type: "lease",
          requirement_type: form.requirementType,
          requirement_category: "corporate_office_leasing",
          city: "hyderabad",
          locality: locationPreference,
          company_name: form.companyName.trim(),
          current_office_location: form.currentOfficeLocation.trim() || null,
          required_area: form.requiredArea,
          preferred_locations: locations,
          fit_out: form.fitOut || null,
          move_in_timeline: form.timeline || null,
          rent_budget: form.rentBudget.trim() || null,
          seats: form.seats.trim() || null,
          ...campaign,
        },
      });

      if (!result.success) {
        setError(result.error || "We could not submit this requirement. Please try again.");
        return;
      }

      submissionSucceeded.current = true;
      setSubmitted(true);
      trackCorporateLeasingEvent("corporate_leasing_form_submit_success", {});
    } catch (err) {
      console.error("[CorporateOfficeLeasingForm] submit failed:", err);
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
          Our Corporate Leasing team will review your requirement and contact you to understand the mandate before preparing suitable office options.
        </p>
      </div>
    );
  }

  return (
    <form id="office-requirement" noValidate onSubmit={submit} className="scroll-mt-28 rounded-sm border border-white/10 bg-[#111111] p-5 shadow-2xl shadow-black/30 sm:p-7 lg:p-8">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8a96e]">Tell Us Your Office Requirement</p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Share one requirement. We&apos;ll evaluate suitable options.</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Share your requirement once. Our Corporate Leasing team will evaluate suitable options across Hyderabad&apos;s Grade-A office market.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="mt-4">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Preferred Location</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {LOCATIONS.map((location) => (
            <label key={location} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:border-[#c8a96e]/50">
              <input
                type="checkbox"
                checked={locations.includes(location)}
                onChange={() => toggleLocation(location)}
                className="h-4 w-4 accent-[#c8a96e]"
              />
              <span>{location}</span>
            </label>
          ))}
        </div>
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
