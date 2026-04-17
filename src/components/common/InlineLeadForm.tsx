"use client";

import { useState } from "react";
import { submitLead, type LeadType } from "@/app/actions/submit-lead";

interface InlineLeadFormProps {
  sourcePage: string;
  leadType?: LeadType;
  heading?: string;
  subtext?: string;
  ctaLabel?: string;
  details?: Record<string, unknown>;
}

export function InlineLeadForm({
  sourcePage,
  leadType = "GENERAL_CONTACT",
  heading = "Speak to an Advisor",
  subtext = "Leave your details and we'll call you back.",
  ctaLabel = "Request a Callback",
  details,
}: InlineLeadFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { setError("Name and phone are required."); return; }
    setSubmitting(true);
    setError("");
    const result = await submitLead({ name: name.trim(), phone: phone.trim(), type: leadType, source_page: sourcePage, details });
    setSubmitting(false);
    if (result.success) setSubmitted(true);
    else setError("Something went wrong. Please try again.");
  };

  const inp: React.CSSProperties = {
    flex: 1,
    minWidth: 140,
    padding: "11px 14px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    outline: "none",
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#c8a96e", marginBottom: 4 }}>We'll call you shortly.</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>Our advisory team typically responds within 4 hours.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
      {heading && (
        <p style={{ fontSize: "clamp(20px,2.5vw,26px)", fontWeight: 700, color: "#fff", marginBottom: 8, textAlign: "center" }}>
          {heading}
        </p>
      )}
      {subtext && (
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 20, textAlign: "center", lineHeight: 1.5 }}>
          {subtext}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: error ? 8 : 0 }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inp}
            required
            aria-label="Your name"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inp}
            required
            aria-label="Phone number"
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "11px 24px",
              borderRadius: 8,
              background: submitting ? "rgba(200,169,110,0.4)" : "linear-gradient(135deg,#c8a96e,#a8843e)",
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.05em",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {submitting ? "Sending…" : ctaLabel}
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: "#f87171", margin: "4px 0 0" }}>{error}</p>}
      </form>
    </div>
  );
}
