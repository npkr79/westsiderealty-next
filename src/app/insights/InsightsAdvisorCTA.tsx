"use client";

import { useState } from "react";

const C = {
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
} as const;

const CHIPS = [
  { label: "What does the GCC boom mean for residential prices?", message: "What does the GCC boom mean for residential prices in Hyderabad?" },
  { label: "Which micro-markets have the best 5-year outlook?", message: "Which Hyderabad micro-markets have the best 5-year appreciation outlook?" },
  { label: "Show me institutional-grade analysis on Kokapet", message: "Can you give me institutional-grade analysis on the Kokapet micro-market?" },
];

export function InsightsAdvisorCTA() {
  const [active, setActive] = useState<number | null>(null);

  function handleChip(idx: number, message: string) {
    setActive(idx);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("westside:openAdvisor", { detail: { message } })
      );
    }
    setTimeout(() => setActive(null), 1800);
  }

  return (
    <>
      <style>{`
        .ins-cta-chip {
          transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.15s;
        }
        .ins-cta-chip:hover {
          background: rgba(176,141,87,0.12) !important;
          border-color: rgba(176,141,87,0.5) !important;
          transform: translateY(-1px);
        }
      `}</style>
      <section style={{ background: C.bgDark, padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(28px,4vw,36px)",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 12px",
              lineHeight: 1.2,
            }}
          >
            Get personalised research
          </p>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 36px",
              lineHeight: 1.6,
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Our AI advisor synthesises market data to answer your specific investment questions
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChip(idx, chip.message)}
                className="ins-cta-chip"
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: active === idx ? C.bgDark : "#fff",
                  background: active === idx ? C.goldLight : "rgba(255,255,255,0.05)",
                  border: `1px solid ${active === idx ? C.goldLight : "rgba(255,255,255,0.2)"}`,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
