"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { submitLead } from "@/app/actions/submit-lead";

const GOLD = "#c9a96e";
const NAVY = "#0a0f1e";

const BUDGET_OPTIONS = [
  "Under ₹50L",
  "₹50L–₹1Cr",
  "₹1Cr–₹2Cr",
  "₹2Cr–₹5Cr",
  "₹5Cr+",
];

interface MicroMarketLeadFormProps {
  marketName: string;
  citySlug: string;
  notes?: string;
}

export default function MicroMarketLeadForm({
  marketName,
  notes,
}: MicroMarketLeadFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = "Enter your name";
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, "")))
      errs.phone = "Enter a valid 10-digit mobile number";
    if (!budget) errs.budget = "Select a budget range";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setServerError(null);
    setLoading(true);
    try {
      const sourcePage =
        typeof window !== "undefined" ? window.location.href : "";
      const result = await submitLead({
        name: name.trim(),
        phone: phone.replace(/\s/g, ""),
        type: "BUYER_REQUIREMENT",
        source_page: sourcePage,
        details: {
          location_preference: marketName,
          notes: notes ?? `Micro-market inquiry: ${marketName}`,
          budgetBand: budget,
          budgetRange: budget,
        },
      });
      if (result.success) {
        setStatus("success");
      } else {
        console.error("[MicroMarketLeadForm] submitLead failed:", result.error);
        setServerError(result.error || "Submission failed. Please try again.");
        setStatus("error");
      }
    } catch (err) {
      console.error("[MicroMarketLeadForm] unexpected error:", err);
      setServerError("Unexpected error. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ backgroundColor: NAVY }} className="py-14">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">

          {/* Left — copy */}
          <div className="mb-8 lg:mb-0 lg:flex-1">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: GOLD }}
            >
              Expert Advisory
            </p>
            <h2 className="text-3xl font-bold text-white leading-snug">
              Interested in {marketName}?<br />Get Expert Advice.
            </h2>
            <p className="mt-3 text-base" style={{ color: "rgba(255,255,255,0.6)" }}>
              Our advisors will reach out within 2 hours.
            </p>
            <ul className="mt-6 space-y-2">
              {[
                "Free, no-obligation consultation",
                "Local market specialists — not call-centre agents",
                "Your details stay private and are never sold",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span style={{ color: GOLD }}>✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — form */}
          <div className="lg:w-[420px] xl:w-[460px]">
            {status === "success" ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,169,110,0.3)" }}
              >
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
                <p className="text-lg font-semibold text-white">
                  Thank you — our team will call you shortly.
                </p>
                <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  We typically respond within 2 hours during business hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-xl p-6 space-y-4"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                noValidate
              >
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    disabled={loading}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2"
                    style={
                      errors.name
                        ? { border: "1px solid #f87171", backgroundColor: "#fff" }
                        : { border: "1px solid #e2e8f0", backgroundColor: "#fff" }
                    }
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    disabled={loading}
                    maxLength={10}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2"
                    style={
                      errors.phone
                        ? { border: "1px solid #f87171", backgroundColor: "#fff" }
                        : { border: "1px solid #e2e8f0", backgroundColor: "#fff" }
                    }
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                  )}
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Budget Range
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2"
                    style={
                      errors.budget
                        ? { border: "1px solid #f87171", backgroundColor: "#fff" }
                        : { border: "1px solid #e2e8f0", backgroundColor: "#fff" }
                    }
                  >
                    <option value="">Select budget</option>
                    {BUDGET_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {errors.budget && (
                    <p className="mt-1 text-xs text-red-400">{errors.budget}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: GOLD, color: NAVY }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Get Expert Advice"
                  )}
                </button>

                {status === "error" && (
                  <p className="text-center text-xs text-red-400">
                    {serverError || "Something went wrong. Please try again."}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
