import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const DARK  = "#070c18";
  const NAVY  = "#0e1628";
  const GOLD  = "#c8a96e";
  const WHITE = "#ffffff";
  const MUTED = "#94a3b8";
  const BORDER = "#1e2d47";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: DARK,
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(30,80,200,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Gold top bar */}
        <div style={{ width: "100%", height: 4, background: GOLD, flexShrink: 0 }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "44px 64px 48px",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", color: GOLD, textTransform: "uppercase" }}>
                WESTSIDE REALTY
              </div>
              <div style={{ fontSize: 12, color: MUTED, letterSpacing: "0.08em" }}>
                Commercial Advisory
              </div>
            </div>
            <div
              style={{
                background: NAVY,
                border: `1px solid ${BORDER}`,
                borderRadius: 99,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                color: GOLD,
                letterSpacing: "0.05em",
              }}
            >
              Mumbai MMR
            </div>
          </div>

          {/* Central content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(200,169,110,0.6)", textTransform: "uppercase" }}>
              EXCLUSIVE MANDATES
            </div>
            <div
              style={{
                fontSize: 50,
                fontWeight: 800,
                color: WHITE,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                maxWidth: 820,
              }}
            >
              Pre-Leased Commercial Opportunities in Mumbai
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["11 Properties", "₹11–70 Cr", "4.9–6.66% Yields", "Bandra · Khar · Thane · Malad"].map((pill, i) => (
                <div
                  key={i}
                  style={{
                    background: i === 0 ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${i === 0 ? "rgba(201,168,76,0.35)" : BORDER}`,
                    borderRadius: 99,
                    padding: "7px 18px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: i === 0 ? GOLD : MUTED,
                    letterSpacing: "0.03em",
                  }}
                >
                  {pill}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 20,
            }}
          >
            <div style={{ fontSize: 14, color: MUTED }}>
              Institutional-grade • Live tenants • Clear titles
            </div>
            <div style={{ fontSize: 14, color: MUTED, letterSpacing: "0.05em" }}>
              westsiderealty.in
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
