"use client";

import { useState } from "react";

const C = {
  bgCard: "#FFFFFF",
  gold: "#B08D57",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

export function CityFaqAccordion({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);

  if (!items.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              textAlign: "left",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: C.text,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              lineHeight: 1.5,
              gap: 12,
            }}
          >
            <span>{item.question}</span>
            <span
              style={{
                color: C.gold,
                fontSize: 20,
                flexShrink: 0,
                display: "inline-block",
                transition: "transform 0.2s ease",
                transform: open === i ? "rotate(45deg)" : "none",
              }}
            >
              +
            </span>
          </button>
          {open === i && (
            <div
              style={{
                padding: "0 20px 18px",
                paddingTop: 14,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                color: C.textMuted,
                lineHeight: 1.75,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
