"use client";

import { useState } from "react";

const C = {
  border: "rgba(0,0,0,0.07)",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  gold: "#B08D57",
} as const;

export function BlogShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const encodedUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.href)
      : "";
  const encodedTitle = encodeURIComponent(title);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: C.textMuted,
        }}
      >
        Share this article
      </span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={handleCopy}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            color: copied ? C.gold : C.text,
            padding: "8px 18px",
            cursor: "pointer",
            background: "transparent",
            transition: "color 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            color: C.text,
            padding: "8px 18px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          WhatsApp
        </a>
        <a
          href={`https://linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            color: C.text,
            padding: "8px 18px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          LinkedIn
        </a>
      </div>
    </div>
  );
}
