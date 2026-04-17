export default function MicroMarkets() {
  return (
    <section style={{ background: "#0d0f1a", padding: "80px 24px" }}>
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
          Micro-Market Spotlight
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 48, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
          Where these opportunities are located
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {/* Bandra West & Khar West */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(200,169,110,0.05)",
              }}
            >
              <p style={{ fontSize: 10, color: "#c8a96e", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>
                7 of 11 mandates
              </p>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
                Bandra West &amp; Khar West
              </h3>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, margin: 0 }}>
                Mumbai&apos;s most coveted commercial high-streets converge in Bandra and Khar — Turner Road, Linking Road, SV Road, and Hill Road form a dense network of premium retail frontages anchored by international brands. Seven of our eleven listings are located here, reflecting deep mandate flow from owners of established commercial assets. High footfall, captive residential catchment from Bandra West&apos;s affluent localities, and robust demand from banking and F&B tenants make this corridor one of India&apos;s most liquid commercial micro-markets. Entry yields are lower than the MMR average, but capital compounding and tenant stability more than compensate over a 5–7 year holding period.
              </p>
            </div>
          </div>

          {/* Santacruz, Thane & Malad */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>
                4 of 11 mandates
              </p>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
                Santacruz West, Thane &amp; Malad West
              </h3>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, margin: 0 }}>
                Beyond the Bandra–Khar belt, three distinct corridors offer compelling larger-ticket plays. Santacruz West&apos;s SV Road and Linking Road extension command strong retail rents with slightly higher yields than Bandra. Thane West&apos;s Lodha i-Think Technocampus represents an institutional-grade office asset — one of India&apos;s largest integrated tech campuses — delivering long-term income security from a ₹500 Cr+ licensee. Malad West, identified by Cushman &amp; Wakefield&apos;s Q4 2025 data as part of the Jogeshwari–Borivali–Malad frontier absorbing significant new office demand, hosts the Vodafone Idea building — an independent asset with plot conveyance and a 6.66% yield kicking in from September 2026.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
