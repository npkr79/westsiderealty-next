"use client";

import { useState } from "react";
import type { FAQ } from "../data";

export default function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ background: "#0a0a0a", padding: "80px 24px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Frequently Asked Questions
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 48, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
          Pre-Leased Commercial Investing in Mumbai
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                overflow: "hidden",
                transition: "border-color 0.2s",
                borderColor: open === i ? "rgba(200,169,110,0.25)" : "rgba(255,255,255,0.08)",
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 20px",
                  background: open === i ? "rgba(200,169,110,0.04)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 12,
                }}
                aria-expanded={open === i}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
                  {faq.question}
                </span>
                <span
                  style={{
                    color: "#c8a96e",
                    fontSize: 18,
                    flexShrink: 0,
                    transform: open === i ? "rotate(45deg)" : "none",
                    transition: "transform 0.2s",
                    display: "inline-block",
                  }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div
                  style={{
                    padding: "0 20px 18px",
                    background: "rgba(200,169,110,0.02)",
                  }}
                >
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
