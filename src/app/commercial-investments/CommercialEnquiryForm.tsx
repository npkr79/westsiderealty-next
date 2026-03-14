"use client";

import { useState } from "react";
import { submitLead } from "@/app/actions/submit-lead";

function parseBudgetRange(label: string): { min: number | null; max: number | null } {
  const map: Record<string, { min: number; max: number | null }> = {
    "₹50L – ₹1 Cr":   { min: 5000000,   max: 10000000 },
    "₹1 Cr – ₹3 Cr":  { min: 10000000,  max: 30000000 },
    "₹3 Cr – ₹5 Cr":  { min: 30000000,  max: 50000000 },
    "₹5 Cr – ₹10 Cr": { min: 50000000,  max: 100000000 },
    "₹10 Cr+":         { min: 100000000, max: null },
  };
  return map[label] ?? { min: null, max: null };
}

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(201,169,110,0.2)",
  background: "rgba(255,255,255,0.04)",
  color: "#F5F0E8",
  padding: "14px 16px",
  fontFamily: "inherit",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  marginBottom: "16px",
  display: "block",
};

export default function CommercialEnquiryForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    budget: "",
    stage: "",
    timeline: "",
    message: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData((p) => ({ ...p, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const sourcePage = typeof window !== "undefined" ? window.location.href : "/commercial-investments";
      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        type: "GENERAL_CONTACT",
        source_page: sourcePage,
        details: {
          segment: "commercial-investments",
          source: "commercial-investments-page",
          budgetRange: formData.budget || null,
          budget_min: parseBudgetRange(formData.budget).min,
          budget_max: parseBudgetRange(formData.budget).max,
          timeline: formData.timeline || null,
          investment_stage: formData.stage || null,
          notes: `Commercial Investment Enquiry | Budget: ${formData.budget} | Stage: ${formData.stage} | Timeline: ${formData.timeline} | Message: ${formData.message}`,
        },
      });

      if (!result.success) {
        setErrorMessage(result.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("[Commercial Form] Unexpected error:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ fontSize: "48px", color: "#C9A96E", marginBottom: "24px" }}>✓</div>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 300, color: "#F5F0E8", marginBottom: "16px" }}>
          Thank you. Our commercial specialist will be in touch.
        </h3>
        <p style={{ fontSize: "15px", fontWeight: 300, color: "#888880", lineHeight: 1.7, maxWidth: "440px", margin: "0 auto" }}>
          We will review your investment profile and reach out within 4 hours with 2–3 curated opportunities matched to your requirements.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888880", marginBottom: "8px" }}>Full Name</label>
          <input type="text" placeholder="Your name" required value={formData.name} onChange={set("name")} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888880", marginBottom: "8px" }}>Mobile Number</label>
          <input type="tel" placeholder="+91 XXXXX XXXXX" required value={formData.phone} onChange={set("phone")} style={inputStyle} />
        </div>
      </div>

      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888880", marginBottom: "8px" }}>Investment Budget</label>
      <select required value={formData.budget} onChange={set("budget")} style={inputStyle}>
        <option value="" style={{ background: "#111110" }}>Select budget range</option>
        <option style={{ background: "#111110" }}>₹50L – ₹1 Cr</option>
        <option style={{ background: "#111110" }}>₹1 Cr – ₹3 Cr</option>
        <option style={{ background: "#111110" }}>₹3 Cr – ₹5 Cr</option>
        <option style={{ background: "#111110" }}>₹5 Cr – ₹10 Cr</option>
        <option style={{ background: "#111110" }}>₹10 Cr+</option>
      </select>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888880", marginBottom: "8px" }}>Preferred Stage</label>
          <select value={formData.stage} onChange={set("stage")} style={inputStyle}>
            <option value="" style={{ background: "#111110" }}>Select stage</option>
            <option style={{ background: "#111110" }}>Early Entry (High Growth)</option>
            <option style={{ background: "#111110" }}>Mid-Construction</option>
            <option style={{ background: "#111110" }}>Near Completion</option>
            <option style={{ background: "#111110" }}>Rental Ready</option>
            <option style={{ background: "#111110" }}>Open to Advisor Recommendation</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888880", marginBottom: "8px" }}>Investment Timeline</label>
          <select value={formData.timeline} onChange={set("timeline")} style={inputStyle}>
            <option value="" style={{ background: "#111110" }}>Select timeline</option>
            <option style={{ background: "#111110" }}>Immediate</option>
            <option style={{ background: "#111110" }}>3–6 Months</option>
            <option style={{ background: "#111110" }}>6–12 Months</option>
            <option style={{ background: "#111110" }}>Exploring Options</option>
          </select>
        </div>
      </div>

      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888880", marginBottom: "8px" }}>Message (Optional)</label>
      <textarea
        rows={4}
        placeholder="Any specific requirements or questions..."
        value={formData.message}
        onChange={set("message")}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      {errorMessage && (
        <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px", textAlign: "center" }}>{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          background: "#C9A96E",
          color: "#080808",
          border: "none",
          padding: "18px",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
          marginTop: "8px",
          fontFamily: "inherit",
        }}
      >
        {submitting ? "Submitting..." : "Request Private Consultation →"}
      </button>

      <p style={{ fontSize: "12px", fontWeight: 300, color: "#888880", textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>
        Your enquiry is completely confidential. Our commercial specialist will respond within 4 hours.
      </p>
    </form>
  );
}
