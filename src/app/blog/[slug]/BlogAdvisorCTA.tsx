"use client";

import { useState } from "react";

const C = {
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
} as const;

export function BlogAdvisorCTA({ articleTitle }: { articleTitle: string }) {
  const [active, setActive] = useState<number | null>(null);

  const chips = [
    { label: `Ask our advisor about this`, message: `I read your article "${articleTitle}" and have questions about this topic. Can you help?` },
    { label: "Browse related projects →", href: "/hyderabad/projects" },
  ];

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
        .blog-cta-chip {
          transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.15s;
        }
        .blog-cta-chip:hover {
          background: rgba(176,141,87,0.12) !important;
          border-color: rgba(176,141,87,0.5) !important;
          transform: translateY(-1px);
        }
      `}</style>
      <section
        style={{
          background: C.bgDark,
          padding: "64px 24px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(26px,4vw,32px)",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 12px",
              lineHeight: 1.2,
            }}
          >
            Have questions about this topic?
          </p>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              margin: "0 0 32px",
              lineHeight: 1.6,
            }}
          >
            Our AI advisor can answer your specific questions about this market.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            {chips.map((chip, idx) =>
              chip.href ? (
                <a
                  key={idx}
                  href={chip.href}
                  className="blog-cta-chip"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    color: "#fff",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  {chip.label}
                </a>
              ) : (
                <button
                  key={idx}
                  onClick={() => handleChip(idx, chip.message!)}
                  className="blog-cta-chip"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    color: active === idx ? C.bgDark : "#fff",
                    background: active === idx ? C.goldLight : "rgba(255,255,255,0.05)",
                    border: `1px solid ${active === idx ? C.goldLight : "rgba(255,255,255,0.2)"}`,
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  {chip.label}
                </button>
              )
            )}
          </div>
        </div>
      </section>
    </>
  );
}
