"use client";

import { useState, useId } from "react";
import { submitLead } from "@/app/actions/submit-lead";
import { PROPERTY_OPTIONS } from "../data";

const INVESTMENT_RANGES = ["₹10–25 Cr", "₹25–50 Cr", "₹50 Cr+"];

export default function InquiryForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    property: "",
    investmentRange: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const selectId = useId();

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError("Name and phone are required."); return; }
    setSubmitting(true);
    setError("");

    // GA4 event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "commercial_inquiry_submit", {
        property_ref: form.property,
        investment_range: form.investmentRange,
      });
    }

    const result = await submitLead({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      type: "GENERAL_CONTACT",
      source_page: "/commercial/pre-leased-mumbai",
      details: {
        property_interest: form.property,
        investment_range: form.investmentRange,
        message: form.message,
        page_type: "pre_leased_mumbai_commercial",
      },
    });

    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError("Something went wrong. Please try WhatsApp or call us directly.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 6,
  };

  return (
    <section id="inquiry-form" style={{ background: "#070c18", padding: "80px 24px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Request the Complete Investment Deck
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 40, lineHeight: 1.65 }}>
          Full fact sheets, lease summaries, and site-visit scheduling for any of the 11 opportunities. Typical response time: under 4 hours.
        </p>

        {submitted ? (
          <div
            style={{
              background: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.25)",
              borderRadius: 12,
              padding: "32px 28px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 20, color: "#c8a96e", fontWeight: 700, marginBottom: 8 }}>Thank you — we&apos;ll be in touch shortly.</p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: 0 }}>
              Our advisory team typically responds within 4 hours on business days. For immediate assistance, reach us on WhatsApp below.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <label htmlFor="comm-name" style={labelStyle}>Name *</label>
                <input id="comm-name" type="text" value={form.name} onChange={set("name")} placeholder="Your full name" style={inputStyle} required />
              </div>
              <div>
                <label htmlFor="comm-phone" style={labelStyle}>Phone *</label>
                <input id="comm-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" style={inputStyle} required />
              </div>
            </div>

            <div>
              <label htmlFor="comm-email" style={labelStyle}>Email</label>
              <input id="comm-email" type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" style={inputStyle} />
            </div>

            <div>
              <label htmlFor={`comm-property-${selectId}`} style={labelStyle}>Property Interest</label>
              <select
                id={`comm-property-${selectId}`}
                value={form.property}
                onChange={set("property")}
                style={{ ...inputStyle, cursor: "pointer" }}
                aria-label="Select property interest"
              >
                <option value="">Any / Not Sure</option>
                {PROPERTY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="comm-range" style={labelStyle}>Investment Range</label>
              <select
                id="comm-range"
                value={form.investmentRange}
                onChange={set("investmentRange")}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Select range</option>
                {INVESTMENT_RANGES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="comm-message" style={labelStyle}>Message</label>
              <textarea
                id="comm-message"
                value={form.message}
                onChange={set("message")}
                placeholder="Any specific requirements, timelines, or questions..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "14px 0",
                borderRadius: 999,
                background: submitting ? "rgba(200,169,110,0.4)" : "linear-gradient(135deg,#c8a96e,#a8843e)",
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 4px 20px rgba(200,169,110,0.3)",
              }}
            >
              {submitting ? "Sending…" : "Request Deck"}
            </button>
          </form>
        )}

        {/* Quick connect */}
        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          <a
            href="https://wa.me/919502500068?text=Hi%2C%20I%20am%20interested%20in%20pre-leased%20commercial%20opportunities%20in%20Mumbai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(37,211,102,0.1)",
              border: "1px solid rgba(37,211,102,0.25)",
              color: "#25d366",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span>💬</span> WhatsApp
          </a>
          <a
            href="tel:+919502500068"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <span>📞</span> Call Us
          </a>
        </div>
      </div>
    </section>
  );
}
