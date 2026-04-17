export default function InvestorAnalysis() {
  const columns = [
    {
      icon: "📈",
      title: "Yield Premium",
      body: "Commercial yields in Mumbai's prime corridors run at 6–8%, roughly double the 2.5–3.5% achievable on residential. With pre-leased assets, rental income starts from day one — no fit-out lag, no tenant search, no vacancy gap during the initial holding period. For investors seeking predictable quarterly cash flow, pre-leased commercial is among the most efficient instruments available in Indian real estate today.",
    },
    {
      icon: "🏙️",
      title: "Capital Appreciation + Rental Escalation",
      body: "Mumbai's prime commercial land supply is structurally constrained. High-street retail in Bandra, Khar, and Santacruz has compounded at approximately 8–10% CAGR over the past decade. Most leases carry 5–15% escalation every 3–5 years, compounding investor income as asset values rise. Investors who entered Linking Road or Turner Road assets five years ago have seen 25–40% uplift in capital values alongside steadily growing rental receipts.",
    },
    {
      icon: "🏦",
      title: "Tenant Credit & Lock-In Protection",
      body: "Institutional tenants — Federal Bank, private-sector banks, listed F&B chains, and Lodha-grade corporates — dramatically reduce default risk relative to individual occupants. Lock-in periods of 3–5 years ensure the tenant is contractually bound even if they choose to vacate. RERA compliance and clear title chains on our mandates make diligence faster and exit planning more reliable, reducing transaction friction for buyers and sellers alike.",
    },
  ];

  const highlights = [
    "Entry ticket from ₹11 Cr",
    "Yields locked at 4.9–6.66%",
    "12 months avg rental income already baked in",
    "Freehold titles on all assets",
    "RERA-compliant where applicable",
  ];

  return (
    <section style={{ background: "#080b14", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Why Invest in Mumbai Commercial Now
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 48, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
          Investor Analysis
        </p>

        {/* Three columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            marginBottom: 48,
          }}
        >
          {columns.map((col) => (
            <div
              key={col.title}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "28px 24px",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 16 }} aria-hidden="true">{col.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, lineHeight: 1.3 }}>
                {col.title}
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, margin: 0 }}>
                {col.body}
              </p>
            </div>
          ))}
        </div>

        {/* Investor highlights band */}
        <div
          style={{
            background: "rgba(200,169,110,0.06)",
            border: "1px solid rgba(200,169,110,0.15)",
            borderRadius: 16,
            padding: "24px 28px",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8a96e", marginRight: 8, flexShrink: 0 }}>
            Investor Highlights
          </p>
          {highlights.map((h) => (
            <div
              key={h}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <span style={{ color: "#c8a96e", fontSize: 10 }}>✦</span>
              {h}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
