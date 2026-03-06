"use client";

import { FormEvent, useState } from "react";
import { submitLead } from "@/app/actions/submit-lead";

const investorTypes = ["Sovereign Fund", "Private Equity", "Family Office", "Pension Fund", "Insurance Capital"];

export default function InstitutionalLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [investorType, setInvestorType] = useState(investorTypes[0]);
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    ticketSize: "",
    email: "",
    phone: "",
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const sourcePage =
        typeof window !== "undefined"
          ? window.location.pathname
          : "/institutional-investment-commercial";

      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        type: "GENERAL_CONTACT",
        source_page: sourcePage,
        details: {
          segment: "institutional-commercial",
          institution: formData.institution,
          ticketSizeInrCrore: formData.ticketSize,
          investorType,
          source: "institutional-investment-commercial-page",
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Unable to submit at this time.");
      }

      setSubmitted(true);
      setFormData({
        name: "",
        institution: "",
        ticketSize: "",
        email: "",
        phone: "",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="institutional-investment-memo"
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-slate-950/75 p-5 md:p-7"
    >
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#B48A3C]">Institutional Access</p>
      <h3 className="mt-2 text-xl font-semibold text-white">Request Institutional Investment Memorandum</h3>
      <p className="mt-2 text-sm text-slate-300">
        Complete this form to unlock the data room, underwriting assumptions, and the gated deck.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input
          required
          placeholder="Name"
          value={formData.name}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, name: event.target.value }))
          }
          className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400"
        />
        <input
          required
          placeholder="Institution"
          value={formData.institution}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, institution: event.target.value }))
          }
          className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400"
        />
        <input
          required
          placeholder="Ticket size (INR crore)"
          value={formData.ticketSize}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, ticketSize: event.target.value }))
          }
          className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400"
        />
        <select
          value={investorType}
          onChange={(event) => setInvestorType(event.target.value)}
          className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white"
        >
          {investorTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          required
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, email: event.target.value }))
          }
          className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400"
        />
        <input
          required
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, phone: event.target.value }))
          }
          className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-400"
        />
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs text-slate-300">
        <input type="checkbox" required className="mt-0.5" />
        <span>I agree to receive the gated institutional deck and data room access instructions.</span>
      </label>
      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 rounded-lg bg-[#B48A3C] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
      >
        {isSubmitting ? "Submitting..." : "Request Access"}
      </button>

      {submitted ? (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          Thank you! We&apos;ve received your enquiry and will be in touch shortly.
          <span className="mt-1 block text-xs text-emerald-300">One of our Hyderabad specialists will call you within 24 hours.</span>
        </p>
      ) : null}
    </form>
  );
}
