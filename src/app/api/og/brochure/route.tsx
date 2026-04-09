import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const title    = searchParams.get("title")   || "Curated Properties";
  const count    = searchParams.get("count")   || "0";
  const city     = searchParams.get("city")    || "";   // "goa" | "hyderabad" | ""
  const region   = searchParams.get("region")  || "";   // "north" | "south" | ""
  const budget   = searchParams.get("budget")  || "";   // "₹1–3 Cr"
  const configs  = searchParams.get("configs") || "";   // "2BHK / 3BHK"

  // ─── Derived display values ───────────────────────────────────────────────
  const cityLabel =
    region === "north" ? "North Goa" :
    region === "south" ? "South Goa" :
    city === "goa"     ? "Goa" :
    city === "hyderabad" ? "Hyderabad" : "All Cities";

  const projectsLabel = `${count} ${Number(count) === 1 ? "property" : "properties"}`;

  const pills: string[] = [cityLabel];
  if (configs) pills.push(configs);
  if (budget)  pills.push(budget);

  // ─── Colors ───────────────────────────────────────────────────────────────
  const DARK   = "#0a0f1c";
  const NAVY   = "#0e1628";
  const GOLD   = "#c9a84c";
  const WHITE  = "#ffffff";
  const MUTED  = "#94a3b8";
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
        {/* ── Background texture — subtle radial glow ── */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(30,80,200,0.06) 0%, transparent 70%)",
          }}
        />

        {/* ── Top gold accent bar ── */}
        <div style={{ width: "100%", height: 4, background: GOLD, flexShrink: 0 }} />

        {/* ── Main content ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 64px 52px",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Brand */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: GOLD,
                  textTransform: "uppercase",
                }}
              >
                WESTSIDE REALTY
              </div>
              <div style={{ fontSize: 12, color: MUTED, letterSpacing: "0.08em" }}>
                Advisory Portfolio
              </div>
            </div>

            {/* City badge */}
            <div
              style={{
                background: NAVY,
                border: `1px solid ${BORDER}`,
                borderRadius: 99,
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: GOLD,
                letterSpacing: "0.05em",
              }}
            >
              {cityLabel}
            </div>
          </div>

          {/* Central title block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
            <div
              style={{
                fontSize: title.length > 40 ? 44 : 52,
                fontWeight: 700,
                color: WHITE,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                maxWidth: 860,
              }}
            >
              {title}
            </div>

            {/* Pill row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {pills.map((pill, i) => (
                <div
                  key={i}
                  style={{
                    background: i === 0 ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${i === 0 ? "rgba(201,168,76,0.35)" : BORDER}`,
                    borderRadius: 99,
                    padding: "7px 18px",
                    fontSize: 15,
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

          {/* Footer row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 24,
            }}
          >
            {/* Projects count */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: WHITE, lineHeight: 1 }}>
                {count}
              </div>
              <div style={{ fontSize: 16, color: MUTED, fontWeight: 400 }}>
                {Number(count) === 1 ? "property" : "properties"} curated for you
              </div>
            </div>

            {/* Domain */}
            <div style={{ fontSize: 14, color: MUTED, letterSpacing: "0.05em" }}>
              westsiderealty.in
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
