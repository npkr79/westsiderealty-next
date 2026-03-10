"use client";

import { useState } from "react";

export default function VillaEnquiryForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    setSubmitting(true);
    try {
      const response = await fetch('/api/crm/leads/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          source_type: 'website',
          source_channel: 'organic_landing',
          status: 'new',
          priority: 'high',
          assigned_to: '8a0946ec-a736-4d8c-9255-84dbad921fb6',
          notes: `Project: Kokapet/Gandipet Luxury Villa | Budget: ${formData.budget} | Location: ${formData.location} | Requirements: ${formData.requirements}`,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('[Villa Form] error:', result.error);
        alert('Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      console.error('[Villa Form] Unexpected error:', err);
      alert('Something went wrong. Please try again.');
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
