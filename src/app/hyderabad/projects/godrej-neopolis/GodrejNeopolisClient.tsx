"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { submitLead } from "@/app/actions/submit-lead";
import { trackGodrejNeopolisEvent } from "@/lib/analytics/godrejNeopolisTracking";

type Intent = "general_prelaunch" | "price" | "eoi" | "3bhk" | "4bhk" | "floor_plan";
type FormState = {
  name: string;
  phone: string;
  configuration: string;
  budget: string;
  purpose: string;
  stage: string;
};

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#17171B",
  gold: "#B08D57",
  goldLight: "#D8BF8A",
  accent: "#2D6A4F",
  text: "#1A1A1F",
  textMuted: "#737378",
  border: "rgba(0,0,0,0.08)",
};

const configurationOptions = [
  { value: "3bhk_1950", label: "3 BHK — 1,950 sqft" },
  { value: "3bhk_2250", label: "3 BHK — 2,250 sqft" },
  { value: "3bhk_2400", label: "3 BHK — 2,400 sqft" },
  { value: "3bhk_2700", label: "3 BHK — 2,700 sqft" },
  { value: "4bhk_3250", label: "4 BHK — 3,250 sqft" },
  { value: "flexible", label: "Flexible / Need Advice" },
];

const budgetOptions = [
  { value: "2_5_3_cr", label: "₹2.5–3 Cr" },
  { value: "3_3_5_cr", label: "₹3–3.5 Cr" },
  { value: "3_5_4_cr", label: "₹3.5–4 Cr" },
  { value: "4_5_cr", label: "₹4–5 Cr" },
  { value: "5_cr_plus", label: "₹5 Cr+" },
  { value: "flexible", label: "Flexible" },
];

const purposeOptions = [
  { value: "self_use", label: "Self Use" },
  { value: "investment", label: "Investment" },
];

const stageOptions = [
  { value: "ready_eoi", label: "Ready for Pre-Launch / EOI" },
  { value: "evaluating", label: "Evaluating Godrej Neopolis" },
  { value: "comparing", label: "Comparing Neopolis Projects" },
];

const defaultForm: FormState = {
  name: "",
  phone: "",
  configuration: "",
  budget: "",
  purpose: "",
  stage: "",
};

function labelFor(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function GodrejNeopolisCta({ intent, location, children, variant = "primary" }: { intent: Intent; location: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const handleClick = () => {
    trackGodrejNeopolisEvent("godrej_neopolis_primary_cta", { cta_intent: intent, cta_location: location });
    window.dispatchEvent(new CustomEvent("godrej-neopolis:set-intent", { detail: { intent } }));
    document.getElementById("godrej-neopolis-lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        border: variant === "primary" ? "none" : `1px solid ${C.gold}`,
        background: variant === "primary" ? C.gold : "transparent",
        color: variant === "primary" ? "#fff" : C.gold,
        borderRadius: 999,
        padding: "13px 22px",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function GodrejNeopolisLeadForm() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [intent, setIntent] = useState<Intent>("general_prelaunch");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formStarted = useRef(false);

  const markStarted = useCallback((nextIntent = intent) => {
    if (formStarted.current) return;
    formStarted.current = true;
    trackGodrejNeopolisEvent("godrej_neopolis_form_start", { cta_intent: nextIntent, cta_location: "form" });
  }, [intent]);

  useEffect(() => {
    function onIntent(event: Event) {
      const detail = (event as CustomEvent<{ intent?: Intent }>).detail;
      if (!detail?.intent) return;
      setIntent(detail.intent);
      trackGodrejNeopolisEvent("godrej_neopolis_intent_selected", { cta_intent: detail.intent, cta_location: "form" });
      markStarted(detail.intent);
    }
    window.addEventListener("godrej-neopolis:set-intent", onIntent);
    return () => window.removeEventListener("godrej-neopolis:set-intent", onIntent);
  }, [markStarted]);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    markStarted();
    if (field === "configuration") trackGodrejNeopolisEvent("godrej_neopolis_configuration_selected", { configuration: value, cta_intent: intent });
    if (field === "budget") trackGodrejNeopolisEvent("godrej_neopolis_budget_selected", { budget_band: value, cta_intent: intent });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    markStarted();

    if (!form.name.trim() || !form.phone.trim() || !form.configuration || !form.budget || !form.purpose || !form.stage) {
      setError("Please complete all required fields before submitting.");
      return;
    }

    setLoading(true);
    try {
      const sourcePage = typeof window !== "undefined" ? window.location.href : "https://www.westsiderealty.in/hyderabad/projects/godrej-neopolis";
      const details = {
        projectName: "Godrej Neopolis",
        project_slug: "godrej-neopolis",
        project_stage: "pre_launch",
        configuration: labelFor(configurationOptions, form.configuration),
        configuration_key: form.configuration,
        budgetBand: labelFor(budgetOptions, form.budget),
        budget_band_key: form.budget,
        purpose: labelFor(purposeOptions, form.purpose),
        buying_stage: labelFor(stageOptions, form.stage),
        buying_stage_key: form.stage,
        buyerIntent: intent,
        location: "Neopolis / Kokapet, Hyderabad",
        location_preference: "Neopolis / Kokapet",
        property_type: "Residential Apartment",
        notes: `Godrej Neopolis pre-launch enquiry. Configuration: ${labelFor(configurationOptions, form.configuration)}. Budget: ${labelFor(budgetOptions, form.budget)}. Purpose: ${labelFor(purposeOptions, form.purpose)}. Stage: ${labelFor(stageOptions, form.stage)}. CTA intent: ${intent}.`,
      };

      const result = await submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        type: "PROJECT_INTEREST",
        source_page: sourcePage,
        property_type: "Residential Apartment",
        attribution_metadata: {
          project_name: "Godrej Neopolis",
          project_slug: "godrej-neopolis",
          source_type: "residential_prelaunch_project",
          source_name: "godrej_neopolis_prelaunch_page",
          city: "hyderabad",
          micro_market: "Neopolis / Kokapet",
          location_scope: "neopolis_kokapet",
          project_stage: "pre_launch",
          configuration: form.configuration,
          budget_band: form.budget,
          purchase_purpose: form.purpose,
          buying_stage: form.stage,
          cta_intent: intent,
        },
        details,
      });

      if (!result.success) throw new Error(result.error || "Unable to submit your enquiry right now.");
      trackGodrejNeopolisEvent("godrej_neopolis_form_submit_success", {
        cta_intent: intent,
        cta_location: "form",
        configuration: form.configuration,
        budget_band: form.budget,
        purchase_purpose: form.purpose,
        buying_stage: form.stage,
      });
      setSuccess(true);
      setForm(defaultForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your enquiry right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="godrej-neopolis-lead-form" onSubmit={onSubmit} style={{ scrollMarginTop: 110, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 24, padding: 24, boxShadow: "0 16px 45px rgba(0,0,0,0.08)" }}>
      <p style={{ margin: "0 0 8px", color: C.gold, fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>Pre-launch enquiry</p>
      <h2 style={{ margin: "0 0 12px", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(28px, 3vw, 40px)", color: C.text }}>Get Godrej Neopolis pre-launch details</h2>
      <p style={{ margin: "0 0 24px", color: C.textMuted, lineHeight: 1.65 }}>Share your preferred residence and buying stage. Our team will respond with the latest available pre-launch information.</p>

      <div className="gn-form-grid">
        <label className="gn-field">Name*<input required value={form.name} onFocus={() => markStarted()} onChange={(e) => update("name", e.target.value)} /></label>
        <label className="gn-field">Mobile Number*<input required value={form.phone} inputMode="tel" onFocus={() => markStarted()} onChange={(e) => update("phone", e.target.value)} /></label>
        <label className="gn-field">Preferred Residence*<select required value={form.configuration} onChange={(e) => update("configuration", e.target.value)}><option value="">Select residence</option>{configurationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="gn-field">Budget*<select required value={form.budget} onChange={(e) => update("budget", e.target.value)}><option value="">Select budget</option>{budgetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="gn-field">Buying Purpose*<select required value={form.purpose} onChange={(e) => update("purpose", e.target.value)}><option value="">Select purpose</option>{purposeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="gn-field">Buying Stage*<select required value={form.stage} onChange={(e) => update("stage", e.target.value)}><option value="">Select stage</option>{stageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      </div>

      {error && <p style={{ color: "#9f2d2d", marginTop: 16 }}>{error}</p>}
      {success && <p style={{ color: C.accent, marginTop: 16 }}>Thank you. Our team will contact you with the latest available Godrej Neopolis pre-launch information.</p>}

      <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 22, border: "none", borderRadius: 999, padding: "15px 22px", background: C.gold, color: "#fff", fontWeight: 800, letterSpacing: "0.08em", cursor: loading ? "wait" : "pointer" }}>
        {loading ? "SUBMITTING..." : "GET PRE-LAUNCH DETAILS"}
      </button>
      <p style={{ margin: "14px 0 0", color: C.textMuted, fontSize: 12, lineHeight: 1.55 }}>No email or free-text message is required. Details are used only to respond to this enquiry.</p>
    </form>
  );
}

export function GodrejNeopolisStyles() {
  return (
    <style>{`
      .gn-container { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
      .gn-grid-2 { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr); gap: 36px; align-items: start; }
      .gn-card-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
      .gn-price-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
      .gn-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .gn-field { display: flex; flex-direction: column; gap: 7px; color: ${C.text}; font-size: 13px; font-weight: 700; }
      .gn-field input, .gn-field select { border: 1px solid ${C.border}; border-radius: 12px; padding: 12px 13px; font: inherit; font-weight: 500; background: #fff; color: ${C.text}; }
      .gn-section { padding: 72px 0; }
      .gn-soft-card { background: ${C.bgCard}; border: 1px solid ${C.border}; border-radius: 20px; padding: 22px; }
      @media (max-width: 900px) { .gn-grid-2, .gn-form-grid { grid-template-columns: 1fr; } .gn-card-grid, .gn-price-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 620px) { .gn-card-grid, .gn-price-grid { grid-template-columns: 1fr; } .gn-section { padding: 52px 0; } }
    `}</style>
  );
}

export function GodrejNeopolisDeveloperLink() {
  return <Link href="/developers/godrej-properties">Godrej Properties</Link>;
}
