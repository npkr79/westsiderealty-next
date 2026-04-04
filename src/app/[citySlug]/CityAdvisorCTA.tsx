"use client";

import { useState } from "react";

// ─── Design constants (dark context) ─────────────────────────────────────────
const C = {
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
} as const;

export type AdvisorChip = { label: string; message: string };

// ─── Component ────────────────────────────────────────────────────────────────

export function CityAdvisorCTA({
  chips,
}: {
  chips: AdvisorChip[];
}) {
  const [active, setActive] = useState<number | null>(null);

  function handleChip(chip: AdvisorChip, idx: number) {
    setActive(idx);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("westside:openAdvisor", { detail: { message: chip.message } })
      );
    }
    // Reset after brief highlight
    setTimeout(() => setActive(null), 1800);
  }

  return (
    <>
      <style>{`
        .city-chip {
          transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.15s;
        }
        .city-chip:hover {
          background: rgba(176,141,87,0.12) !important;
          border-color: rgba(176,141,87,0.5) !important;
          transform: translateY(-1px);
        }
      `}</style>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
        {chips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChip(chip, idx)}
            className="city-chip"
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
              color: active === idx ? C.bgDark : "#fff",
              background:
                active === idx ? C.goldLight : "rgba(255,255,255,0.05)",
              border: `1px solid ${active === idx ? C.goldLight : "rgba(255,255,255,0.2)"}`,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </>
  );
}
