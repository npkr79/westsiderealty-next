"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Clock, Phone, MessageCircle, Mail, Send, CheckCircle, Loader2 } from "lucide-react";
import { JsonLd } from "@/components/common/SEO";
import { submitLead } from "@/app/actions/submit-lead";

export const revalidate = 3600;

// ─── Design tokens (matches HomepageRedesign / MicroMarketRedesign) ──────────
const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgDark: "#1A1A1F",
  bgCard: "#FFFFFF",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
  borderDark: "rgba(255,255,255,0.1)",
} as const;

const FONT_SERIF = "'Cormorant Garamond', Georgia, serif";
const FONT_SANS = "'Outfit', system-ui, sans-serif";

const CONTACT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact RE/MAX Westside Realty",
  description: "Contact RE/MAX Westside Realty for expert property advice in Hyderabad.",
  url: "https://www.westsiderealty.in/contact",
  mainEntity: {
    "@type": "RealEstateAgent",
    name: "RE/MAX Westside Realty",
    telephone: "+91-83677-24368",
    address: {
      "@type": "PostalAddress",
      streetAddress: "415, 4th Floor, Kokapet Terminal, Kokapet",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500075",
      addressCountry: "IN",
    },
  },
};

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", interest: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        type: "GENERAL_CONTACT",
        source_page: "/contact",
        details: { message: formData.message, interest: formData.interest },
      });
      if (!result.success) throw new Error(result.error || "Submission failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: C.bgWarm,
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontFamily: FONT_SANS,
    fontSize: 15,
    color: C.text,
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: FONT_SANS,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: C.textMuted,
    marginBottom: 8,
  };

  return (
    <>
      <JsonLd jsonLd={CONTACT_SCHEMA} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Outfit:wght@300;400;500;600;700&display=swap');
        .contact-input:focus { border-color: ${C.gold} !important; }
        .quick-link:hover { background: rgba(176,141,87,0.12) !important; border-color: ${C.gold} !important; }
        .submit-btn:hover:not(:disabled) { background: ${C.gold} !important; }
      `}</style>

      <main style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT_SANS }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section style={{ background: C.bgDark, padding: "80px 24px 64px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: C.goldLight, marginBottom: 16 }}>
              Westside Realty · Hyderabad
            </p>
            <h1 style={{ fontFamily: FONT_SERIF, fontSize: "clamp(2.4rem, 5vw, 3.5rem)", fontWeight: 600, color: "#FFFFFF", lineHeight: 1.15, marginBottom: 20 }}>
              Let's Talk Real Estate
            </h1>
            <p style={{ fontFamily: FONT_SANS, fontSize: 17, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 40px" }}>
              Whether you're buying, investing, or just exploring — our advisors will give you a straight, data-backed answer. No pressure.
            </p>

            {/* Quick contact chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              {[
                { icon: <Phone size={15} />, label: "Call Us", sub: "+91 83677 24368", href: "tel:+918367724368" },
                { icon: <MessageCircle size={15} />, label: "WhatsApp", sub: "Chat Now", href: "https://wa.me/918367724368" },
                { icon: <Mail size={15} />, label: "Email", sub: "info@westsiderealty.in", href: "mailto:info@westsiderealty.in" },
              ].map((q) => (
                <a key={q.label} href={q.href} className="quick-link" target={q.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", border: `1px solid ${C.borderDark}`, borderRadius: 40, background: "rgba(255,255,255,0.05)", textDecoration: "none", transition: "all 0.2s" }}>
                  <span style={{ color: C.goldLight }}>{q.icon}</span>
                  <span>
                    <span style={{ display: "block", fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{q.label}</span>
                    <span style={{ display: "block", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 500, color: "#fff" }}>{q.sub}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Form + Info ───────────────────────────────────────────────────── */}
        <section style={{ padding: "64px 24px 80px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: 32 }}
            className="contact-grid">
            <style>{`@media(min-width:900px){.contact-grid{grid-template-columns:1fr 420px !important;}}`}</style>

            {/* ── Left: Form ──────────────────────────────────────────────── */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "40px 36px", border: `1px solid ${C.border}`, boxShadow: "0 2px 20px rgba(0,0,0,0.04)" }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <CheckCircle size={52} color="#22c55e" style={{ margin: "0 auto 20px" }} />
                  <h2 style={{ fontFamily: FONT_SERIF, fontSize: "1.8rem", fontWeight: 600, color: C.text, marginBottom: 12 }}>Message Received</h2>
                  <p style={{ fontFamily: FONT_SANS, fontSize: 16, color: C.textMuted, marginBottom: 32 }}>
                    One of our advisors will be in touch within a few hours.
                  </p>
                  <Link href="/hyderabad/projects" style={{ display: "inline-block", padding: "12px 28px", background: C.bgDark, color: "#fff", borderRadius: 8, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                    Browse Projects
                  </Link>
                </div>
              ) : (
                <>
                  <h2 style={{ fontFamily: FONT_SERIF, fontSize: "1.6rem", fontWeight: 600, color: C.text, marginBottom: 8 }}>Send a Message</h2>
                  <p style={{ fontFamily: FONT_SANS, fontSize: 14, color: C.textMuted, marginBottom: 32 }}>Fill in your details and we'll get back to you shortly.</p>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
                      className="form-two-col">
                      <style>{`@media(max-width:520px){.form-two-col{grid-template-columns:1fr !important;}}`}</style>
                      <div>
                        <label style={labelStyle}>Full Name *</label>
                        <input name="name" required value={formData.name} onChange={handleChange} placeholder="Your name" disabled={submitting} className="contact-input" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone Number *</label>
                        <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" disabled={submitting} className="contact-input" style={inputStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" disabled={submitting} className="contact-input" style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>What are you looking for?</label>
                      <select name="interest" value={formData.interest} onChange={handleChange} disabled={submitting} className="contact-input" style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                        <option value="">Select your interest</option>
                        <option value="hyderabad-buy">Buying in Hyderabad</option>
                        <option value="hyderabad-invest">Investment in Hyderabad</option>
                        <option value="goa-investment">Goa Holiday / Investment</option>
                        <option value="dubai-investment">Dubai Investment</option>
                        <option value="general-consultation">General Consultation</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Message</label>
                      <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us what you're looking for..." rows={4} disabled={submitting} className="contact-input"
                        style={{ ...inputStyle, resize: "vertical", minHeight: 110 }} />
                    </div>

                    {error && (
                      <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: "#ef4444", background: "#fef2f2", padding: "10px 14px", borderRadius: 8 }}>{error}</p>
                    )}

                    <button type="submit" disabled={submitting} className="submit-btn"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 28px", background: C.bgDark, color: "#fff", border: "none", borderRadius: 8, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, transition: "background 0.2s" }}>
                      {submitting ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : <><Send size={17} /> Send Message</>}
                    </button>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </form>
                </>
              )}
            </div>

            {/* ── Right: Info + Map ────────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Office info card */}
              <div style={{ background: C.bgCard, borderRadius: 16, padding: "32px 28px", border: `1px solid ${C.border}`, boxShadow: "0 2px 20px rgba(0,0,0,0.04)" }}>
                <p style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: C.gold, marginBottom: 16 }}>Our Office</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    {
                      icon: <MapPin size={18} color={C.gold} />,
                      title: "Address",
                      lines: ["415, 4th Floor, Kokapet Terminal", "Kokapet, Hyderabad – 500075"],
                    },
                    {
                      icon: <Clock size={18} color={C.gold} />,
                      title: "Business Hours",
                      lines: ["Monday – Saturday", "9:00 AM – 7:00 PM"],
                    },
                    {
                      icon: <Phone size={18} color={C.gold} />,
                      title: "Phone",
                      lines: ["+91 83677 24368"],
                    },
                  ].map((item) => (
                    <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                      <div>
                        <p style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textMuted, marginBottom: 4 }}>{item.title}</p>
                        {item.lines.map((l) => (
                          <p key={l} style={{ fontFamily: FONT_SANS, fontSize: 15, color: C.text, lineHeight: 1.5 }}>{l}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map embed */}
              <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 2px 20px rgba(0,0,0,0.04)" }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3574.5406493313703!2d78.3269774748044!3d17.385123602871065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6869ea289d44d3d%3A0x7ee055e9306884d4!2sRE%2FMAX%20Westside%20Realty!5e1!3m2!1sen!2sin!4v1766248713985!5m2!1sen!2sin"
                  width="100%"
                  height="280"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="RE/MAX Westside Realty Office Location"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom trust strip ────────────────────────────────────────────── */}
        <section style={{ background: C.bgDark, padding: "40px 24px", borderTop: `1px solid ${C.borderDark}` }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", alignItems: "center" }}>
            {[
              { value: "12+ Yrs", label: "In Hyderabad Market" },
              { value: "1,200+", label: "Buyers Advised" },
              { value: "577+", label: "RERA Projects" },
              { value: "No Obligation", label: "Free Consultation" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: FONT_SERIF, fontSize: "1.4rem", fontWeight: 600, color: C.goldLight }}>{s.value}</p>
                <p style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
