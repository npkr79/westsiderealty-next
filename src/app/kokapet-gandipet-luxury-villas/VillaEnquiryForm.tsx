"use client";

import { useState } from "react";
import { submitLead } from "@/app/actions/submit-lead";

export default function VillaEnquiryForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    budget: "",
    location: "",
    requirements: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const sourcePage = typeof window !== "undefined" ? window.location.href : "/kokapet-gandipet-luxury-villas";
      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        type: "GENERAL_CONTACT",
        source_page: sourcePage,
        details: {
          segment: "luxury-villas",
          source: "kokapet-gandipet-luxury-villas-page",
          budgetRange: formData.budget || null,
          location_preference: formData.location || null,
          notes: `Luxury Villa Enquiry | Budget: ${formData.budget} | Location: ${formData.location} | Requirements: ${formData.requirements}`,
        },
      });

      if (!result.success) {
        setErrorMessage(result.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("[Villa Form] Unexpected error:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ fontSize: "48px", marginBottom: "24px" }}>✓</div>
        <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, marginBottom: "16px" }}>
          Thank you. We will be in touch.
        </h3>
        <p style={{ fontSize: "15px", fontWeight: 300, color: "var(--muted)", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto" }}>
          Our villa specialist will review your requirements and reach out to you personally with curated options within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-field">
          <label>Full Name</label>
          <input type="text" placeholder="Your name" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="form-field">
          <label>Mobile Number</label>
          <input type="tel" placeholder="+91 XXXXX XXXXX" required value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
        </div>
      </div>
      <div className="form-field">
        <label>Email Address</label>
        <input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Budget Range</label>
          <select value={formData.budget} onChange={(e) => setFormData((p) => ({ ...p, budget: e.target.value }))}>
            <option value="">Select budget</option>
            <option>₹10 – 14 Cr</option>
            <option>₹14 – 18 Cr</option>
            <option>₹18 – 24 Cr</option>
            <option>₹24 Cr and above</option>
          </select>
        </div>
        <div className="form-field">
          <label>Preferred Location</label>
          <select value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}>
            <option value="">Select location</option>
            <option>Kokapet</option>
            <option>Gandipet</option>
            <option>Narsingi</option>
            <option>Open to any</option>
          </select>
        </div>
      </div>
      <div className="form-field">
        <label>Requirements</label>
        <textarea rows={3} placeholder="Minimum size, BHK, specific needs..." style={{ resize: "vertical" }} value={formData.requirements} onChange={(e) => setFormData((p) => ({ ...p, requirements: e.target.value }))} />
      </div>
      {errorMessage && (
        <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px" }}>{errorMessage}</p>
      )}
      <button
        type="submit"
        className="form-submit"
        disabled={submitting}
        style={submitting ? { pointerEvents: "none", opacity: 0.7 } : undefined}
      >
        {submitting ? "Submitting..." : "Request Private Villa Consultation"}
      </button>
      <p className="form-note">Your enquiry is completely confidential. Expect a call from our specialist within 2 hours.</p>
    </form>
  );
}
