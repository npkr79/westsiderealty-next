export default function MarketStats() {
  const stats = [
    { value: "~10%", label: "Mumbai office vacancy", sub: "Tightening" },
    { value: "2.0 MSF", label: "Quarterly net office absorption", sub: "Q4 2025" },
    { value: "5–7%", label: "Expected rental growth", sub: "FY26 forecast" },
    { value: "6–8%", label: "Commercial yields", sub: "vs 2.5–3.5% residential" },
  ];

  return (
    <section style={{ background: "#0d0f1a", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#fff",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Why Mumbai Commercial Real Estate Now
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 48, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
          Market Context — 2026
        </p>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "24px 20px",
              }}
            >
              <p style={{ fontSize: "clamp(28px, 3vw, 36px)", fontWeight: 800, color: "#c8a96e", margin: 0, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 8, lineHeight: 1.4 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, letterSpacing: "0.04em" }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Prose */}
        <div style={{ maxWidth: 800 }}>
          <p
            style={{
              fontSize: "clamp(15px, 1.6vw, 17px)",
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            Mumbai&apos;s commercial real estate market enters 2026 from a position of strength. Net office absorption hit 2.0 million sq ft in Q4 2025, pushing citywide vacancy down to approximately 10% — the tightest level in three years. Grade A rentals firmed up 1.9% quarter-on-quarter, and consensus forecasts put FY26 rental growth at 5–7% across prime markets. With residential yields compressed at 2.5–3.5%, investors are rotating into commercial, where pre-leased assets deliver 6–8% yields backed by institutional tenants and multi-year lock-ins. The opportunities below represent Remax Westside Realty&apos;s current curated mandates — all with live tenants, verified titles, and clear exit potential.
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              marginTop: 16,
              letterSpacing: "0.03em",
            }}
          >
            Source: Cushman &amp; Wakefield Q4 2025 Mumbai Office Market Report
          </p>
        </div>
      </div>
    </section>
  );
}
