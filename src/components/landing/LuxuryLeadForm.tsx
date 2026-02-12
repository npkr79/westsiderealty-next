"use client";

import { useState } from "react";
import { submitLead } from "@/app/actions/submit-lead";

interface LuxuryLeadFormProps {
  sourceLabel: string;
}

export default function LuxuryLeadForm({ sourceLabel }: LuxuryLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    budgetRange: "",
    purchaseTimeline: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const sourcePage =
        typeof window !== "undefined" ? window.location.pathname : "/";
      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        type: "GENERAL_CONTACT",
        source_page: sourcePage,
        details: {
          source: sourceLabel,
          budgetRange: formData.budgetRange || null,
          purchaseTimeline: formData.purchaseTimeline || null,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Submission failed");
      }

      setIsSubmitted(true);
      setFormData({
        name: "",
        phone: "",
        budgetRange: "",
        purchaseTimeline: "",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <p className="text-sm text-white/70">
        Thanks. We will follow up with confidential access details.
      </p>
    );
  }

  return (
    <form className="mt-10 grid gap-6 sm:grid-cols-2" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
        Name
        <input
          type="text"
          required
          className="bg-white/5 px-4 py-3 text-sm text-white outline-none"
          placeholder="Full name"
          value={formData.name}
          onChange={(event) => handleChange("name", event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
        Phone
        <input
          type="tel"
          required
          className="bg-white/5 px-4 py-3 text-sm text-white outline-none"
          placeholder="Phone number"
          value={formData.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
        Budget Range
        <input
          type="text"
          className="bg-white/5 px-4 py-3 text-sm text-white outline-none"
          placeholder="₹12 Cr - ₹20 Cr"
          value={formData.budgetRange}
          onChange={(event) => handleChange("budgetRange", event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
        Purchase Timeline
        <input
          type="text"
          className="bg-white/5 px-4 py-3 text-sm text-white outline-none"
          placeholder="Within 6 months"
          value={formData.purchaseTimeline}
          onChange={(event) => handleChange("purchaseTimeline", event.target.value)}
        />
      </label>
      {errorMessage ? (
        <p className="text-xs text-white/60 sm:col-span-2">{errorMessage}</p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="luxury-cta w-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#0B0F1A] disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Request Confidential Access"}
        </button>
      </div>
    </form>
  );
}
