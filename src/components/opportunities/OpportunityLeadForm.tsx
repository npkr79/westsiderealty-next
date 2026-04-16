"use client";

import { useState, useTransition } from "react";
import { submitLead } from "@/app/actions/submit-lead";
import type { DevelopmentOpportunity } from "@/lib/opportunities/types";

interface Props {
  opportunity: DevelopmentOpportunity;
  variant?: "panel" | "inline";
}

const INVESTOR_ROLES = [
  "Developer / Builder",
  "Real Estate PE / Fund",
  "Family Office / HNI",
  "Land Aggregator",
  "Channel Partner",
  "Other",
] as const;

const TICKET_BANDS = [
  "< ₹50 Cr",
  "₹50–200 Cr",
  "₹200–500 Cr",
  "₹500–1000 Cr",
  "₹1000 Cr+",
] as const;

export function OpportunityLeadForm({ opportunity, variant = "panel" }: Props) {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [investorType, setInvestorType] = useState<string>("");
  const [ticket, setTicket] = useState<string>("");
  const [message, setMessage] = useState("");
  const [agreedNda, setAgreedNda] = useState(false);

  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !investorType || !agreedNda) {
      setStatus("error");
      setErrorMsg("Please fill name, phone, your role, and accept the NDA terms.");
      return;
    }

    // Parse ticket size band for analytics — keep as text for the rep
    const ticketCrore =
      ticket === "₹1000 Cr+" ? 1000 :
      ticket === "₹500–1000 Cr" ? 500 :
      ticket === "₹200–500 Cr" ? 200 :
      ticket === "₹50–200 Cr" ? 50 :
      ticket === "< ₹50 Cr" ? 25 : null;

    startTransition(async () => {
      const res = await submitLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        type: "DEVELOPER_INQUIRY",
        source_page: `/opportunities/${opportunity.slug}`,
        details: {
          institution: organization.trim() || null,
          investorType,
          ticketSizeInrCrore: ticketCrore,
          ticketBand: ticket || null,
          opportunitySlug: opportunity.slug,
          opportunityTitle: opportunity.title,
          opportunityCity: opportunity.city,
          ndaAccepted: agreedNda,
          message: message.trim() || null,
        },
        attribution_metadata: {
          source_type: "opportunities_page",
          opportunity_slug: opportunity.slug,
          opportunity_city_slug: opportunity.city_slug,
          deal_stage: opportunity.stage,
        },
      });

      if (res.success) {
        setStatus("ok");
      } else {
        setStatus("error");
        setErrorMsg(res.error || "Could not submit. Please try again.");
      }
    });
  }

  if (status === "ok") {
    return (
      <div
        style={{
          padding: variant === "panel" ? 28 : 20,
          borderRadius: 14,
          background: "#0a0a0a",
          color: "#fff",
          border: "1px solid #c8a96e",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#c8a96e",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Request Received
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: "10px 0 8px" }}>
          We&apos;ll be in touch within 24 hours
        </h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.6 }}>
          An advisor will reach out to confirm interest and share the NDA. Detailed feasibility,
          title chain, and tenant data follow once executed.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 8,
    background: "#fff",
    color: "#1a1a1f",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#6b6b6f",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    marginBottom: 4,
    display: "block",
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: variant === "panel" ? "#fff" : "transparent",
        padding: variant === "panel" ? 24 : 0,
        borderRadius: 14,
        border: variant === "panel" ? "1px solid rgba(0,0,0,0.08)" : "none",
        boxShadow: variant === "panel" ? "0 8px 30px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {variant === "panel" && (
        <>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#c8a96e",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Confidential Enquiry
          </p>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1f", margin: "6px 0 4px" }}>
            Request Detailed Feasibility
          </h3>
          <p style={{ fontSize: 12, color: "#6b6b6f", margin: "0 0 18px", lineHeight: 1.5 }}>
            For institutional review only. Non-disclosure required before owner identity, full
            financials, and title documents are shared.
          </p>
        </>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={labelStyle}>Your Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Organization</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Company / fund / family office"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Phone *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 …"
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="work email"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>You are *</label>
          <select
            value={investorType}
            onChange={(e) => setInvestorType(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">Select your role…</option>
            {INVESTOR_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Indicative ticket size</label>
          <select value={ticket} onChange={(e) => setTicket(e.target.value)} style={inputStyle}>
            <option value="">Optional</option>
            {TICKET_BANDS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anything specific you'd like us to address?"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <label style={{ display: "flex", gap: 8, fontSize: 12, color: "#4a4a4e", lineHeight: 1.55, alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={agreedNda}
            onChange={(e) => setAgreedNda(e.target.checked)}
            style={{ marginTop: 3, flexShrink: 0 }}
            required
          />
          <span>
            I agree to keep all information shared (including owner identity, financials, and title
            documents) confidential, and to execute a formal NDA before deeper diligence.
          </span>
        </label>

        {status === "error" && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#b91c1c",
              background: "#fee2e2",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            background: pending ? "#6b6b6f" : "#0a0a0a",
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: pending ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            marginTop: 4,
            transition: "background 0.15s",
          }}
        >
          {pending ? "Submitting…" : "Request Confidential Feasibility →"}
        </button>

        <p style={{ fontSize: 11, color: "#9a9a9e", margin: "4px 0 0", textAlign: "center" }}>
          We typically respond within 24 hours · Information shared only with verified parties
        </p>
      </div>
    </form>
  );
}
