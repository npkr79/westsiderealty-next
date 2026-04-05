import type { Metadata } from "next";
import Link from "next/link";
import { InsightsAdvisorCTA } from "../InsightsAdvisorCTA";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hyderabad Real Estate 5-Year Outlook 2026–2031 | Westside Realty",
  description:
    "AI-powered 5-year appreciation forecasts for Hyderabad micro-markets. Which corridors will outperform through 2031?",
};

const C = {
  bg: "#FAFAF7",
  bgCard: "#FFFFFF",
  bgWarm: "#F5F3EE",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

export default function OutlookPage() {
  return (
    <>
      <style>{`
        .out-body h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px; font-weight: 600; color: #1A1A1F;
          margin: 40px 0 16px; line-height: 1.3;
        }
        .out-body h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px; font-weight: 600; color: #1A1A1F;
          margin: 0 0 10px;
        }
        .out-body p {
          font-family: 'Outfit', sans-serif; font-size: 15px;
          color: #1A1A1F; line-height: 1.8; margin: 0 0 16px;
        }
        @media (max-width: 768px) {
          .out-forecast-grid { grid-template-columns: 2fr 1fr !important; }
          .out-forecast-grid span:nth-child(3), .out-forecast-grid span:nth-child(4) { display: none !important; }
          .out-stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Hero */}
      <section style={{ background: C.bgDark, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 65% 60% at 65% 40%, rgba(176,141,87,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 64px", position: "relative" }}>
          <Link href="/insights" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
            ← Back to Research
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: C.gold }}>Research Report</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 20, padding: "3px 10px" }}>AI</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(36px,5vw,56px)", fontWeight: 600, color: "#fff", lineHeight: 1.15, margin: "0 0 20px" }}>
            5-Year Outlook <span style={{ color: C.goldLight }}>2026–2031</span>
          </h1>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 580, margin: 0 }}>
            Appreciation forecasts, infrastructure catalysts, and our top corridor picks for the next five years.
          </p>
        </div>
      </section>

      {/* Executive Summary */}
      <section style={{ background: C.bg, padding: "48px 24px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: C.bgCard, borderLeft: `4px solid ${C.gold}`, padding: "24px 28px", borderRadius: "0 12px 12px 0" }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", color: C.gold, margin: "0 0 12px" }}>Executive Summary</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.text, lineHeight: 1.7, margin: 0 }}>
              Hyderabad is in a structural bull market for residential real estate unlikely to reverse before 2030. Three forces will compound: GCC employment expansion (120,000–140,000 new jobs by 2030), Metro Phase 2 infrastructure unlock, and RERA-enforced supply discipline. The following forecasts are AI-generated from 15 years of transaction data and infrastructure records.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: C.bg, padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }} className="out-body">

          {/* Thesis */}
          <div style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 40 }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "#c4b5fd", margin: "0 0 12px" }}>The 5-Year Thesis</p>
            <p>Hyderabad&apos;s residential market is driven by three compounding forces:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { n: "1", label: "Employment expansion", body: "The tech corridor will add an estimated 120,000–140,000 jobs between 2026–2030 as global MNCs expand Hyderabad GCC operations." },
                { n: "2", label: "Infrastructure unlock", body: "Metro Phase 2, ORR extensions, and the RGIA–HITEC City elevated corridor will open new residential corridors currently priced as peripheral." },
                { n: "3", label: "Supply discipline", body: "RERA and land acquisition constraints mean Hyderabad will not see the oversupply that suppressed returns in NCR and Bengaluru outer rings." },
              ].map((f) => (
                <div key={f.n} style={{ display: "flex", gap: 14 }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "rgba(176,141,87,0.15)", border: `1px solid rgba(176,141,87,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: C.gold }}>{f.n}</span>
                  <p style={{ margin: 0, fontSize: 14 }}><strong>{f.label}:</strong> {f.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast table */}
          <h2>Appreciation Forecasts by Corridor</h2>
          <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 20px" }}>Base case assumes no recession, metro approvals on schedule, stable employment growth. All figures are CAGR.</p>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 48 }}>
            <div className="out-forecast-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, padding: "12px 20px", background: C.bgWarm, borderBottom: `1px solid ${C.border}` }}>
              {["Corridor", "Today", "5yr CAGR", "2031 Est."].map((h) => (
                <span key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.textMuted }}>{h}</span>
              ))}
            </div>
            {[
              { corridor: "Financial District", today: "₹12–14K", cagr: "9–11%", est: "₹18–22K", color: C.gold, conviction: "High" },
              { corridor: "Kokapet", today: "₹10–12.5K", cagr: "13–16%", est: "₹19–26K", color: "#4ade80", conviction: "Highest" },
              { corridor: "Gachibowli", today: "₹11–13K", cagr: "8–10%", est: "₹16–21K", color: C.gold, conviction: "High" },
              { corridor: "Narsingi", today: "₹8.5–10K", cagr: "12–15%", est: "₹15–20K", color: "#4ade80", conviction: "High" },
              { corridor: "Kondapur", today: "₹9–11K", cagr: "8–10%", est: "₹13–18K", color: "#60a5fa", conviction: "Moderate" },
              { corridor: "Nanakramguda", today: "₹9.5–11K", cagr: "9–11%", est: "₹15–18K", color: C.gold, conviction: "High" },
              { corridor: "Tellapur", today: "₹7–9K", cagr: "11–14%", est: "₹13–17K", color: "#a78bfa", conviction: "Moderate" },
              { corridor: "Kollur / Mokila", today: "₹5–7K", cagr: "14–18%", est: "₹10–17K", color: "#34d399", conviction: "Speculative" },
            ].map((r, i) => (
              <div key={r.corridor} className="out-forecast-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "14px 20px", borderBottom: i < 7 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 500, color: C.text }}>{r.corridor}</span>
                  <span style={{ background: r.color + "18", color: r.color, fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, textTransform: "uppercase", borderRadius: 20, padding: "2px 8px" }}>{r.conviction}</span>
                </div>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted }}>{r.today}</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: "#4ade80" }}>+{r.cagr}</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>{r.est}</span>
              </div>
            ))}
          </div>

          {/* Infrastructure catalysts */}
          <h2>Infrastructure Catalysts</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {[
              { name: "Metro Phase 2 — Kokapet Extension", status: "Approval Expected 2026", statusColor: "#f59e0b", impact: "If approved and built by 2029–30, this single project transforms Kokapet and Narsingi from 'drive only' to 'metro accessible'. Historical data from Phase 1 shows properties within 800m of metro stations appreciated 18–24% in the 24 months post-announcement.", corridors: ["Kokapet", "Narsingi", "Puppalaguda"] },
              { name: "Kokapet SEZ — 22 Million Sqft Tech Park", status: "Approved, Construction Started", statusColor: "#4ade80", impact: "Anchored by Tata Consultancy, Infosys, and a cluster of US MNC GCCs, this is the largest single employment catalyst in Hyderabad since HITEC City. At full buildout (est. 2029–30), the SEZ will employ 80,000–100,000 people.", corridors: ["Kokapet", "Narsingi", "Tellapur"] },
              { name: "ORR Expansion — Kollur & Budwel Nodes", status: "Phase 1 Complete, Phase 2 In Progress", statusColor: "#60a5fa", impact: "Each new interchange node creates a 5 km radius of high-demand residential land. The Kollur and Budwel nodes are the last major unlocks on the western arc. Land prices within 2 km of these nodes have already moved.", corridors: ["Kollur", "Mokila", "Budwel"] },
              { name: "RGIA–HITEC City Elevated Corridor", status: "Pre-Feasibility Stage", statusColor: "#f87171", impact: "A proposed elevated expressway connecting the international airport to the HITEC City tech belt. If built (earliest 2030–31), this would dramatically improve connectivity for southern corridors and begin a new wave of development in the airport proximity belt.", corridors: ["Tukkuguda", "Rajendra Nagar", "Osman Nagar"] },
            ].map((c) => (
              <div key={c.name} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <h3>{c.name}</h3>
                  <span style={{ background: c.statusColor + "20", color: c.statusColor, fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", borderRadius: 20, padding: "3px 12px", flexShrink: 0 }}>{c.status}</span>
                </div>
                <p style={{ margin: "0 0 14px", color: C.textMuted }}>{c.impact}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {c.corridors.map((cor) => (
                    <span key={cor} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, padding: "4px 12px" }}>{cor}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Investment scenarios */}
          <h2>Investment Scenarios</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {[
              { label: "Conservative — ₹80L–1.2Cr budget", color: "#60a5fa", title: "2BHK in Tellapur or Gopanpally", body: "Buy a RERA-registered 2BHK in a project by an established developer. At ₹7,000–8,500/sqft and 1,000–1,200 sqft, you land in the ₹75L–1Cr range. Rental yield of 3.5–4.2% covers most of EMI. 5-year appreciation forecast: 55–70%. Risk: low." },
              { label: "Growth — ₹1.5–2.5Cr budget", color: "#4ade80", title: "3BHK in Kokapet or Narsingi", body: "The highest conviction trade in Hyderabad. A 1,600–1,800 sqft 3BHK in Kokapet from a Tier 1 developer at ₹10,500–11,500/sqft puts you at ₹1.7–2.1Cr. SEZ employment catalyst and metro phase 2 upside mean 5-year appreciation of 80–110% in the base case. Rental yield currently 3.8–4.5%." },
              { label: "Speculative — ₹50–80L budget", color: "#a78bfa", title: "Plotted development in Kollur/Mokila", body: "High risk, high reward. A 200 sqyd plot in Kollur (DTCP/HMDA approved) at ₹25,000–32,000/sqyd. No rental income. 5-year upside: 100–180% IF infrastructure delivers. Risk: high. A thesis-based bet on Hyderabad&apos;s expansion, not an income-generating asset." },
            ].map((s) => (
              <div key={s.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: s.color, margin: "0 0 6px" }}>{s.label}</p>
                <h3>{s.title}</h3>
                <p style={{ margin: 0, color: C.textMuted }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Methodology */}
          <div style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 16, padding: 24 }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#c4b5fd", margin: "0 0 10px" }}>About These Forecasts</p>
            <p style={{ margin: 0, fontSize: 13, color: C.textMuted, lineHeight: 1.75 }}>
              Forecasts are generated using a model trained on 15 years of Hyderabad transaction data, infrastructure investment records, employment growth figures, and developer absorption rates. These are probability-weighted CAGR ranges, not guarantees. Real estate markets can diverge from models — use these as directional guidance, not precise targets.
            </p>
          </div>
        </div>
      </section>

      <InsightsAdvisorCTA />
    </>
  );
}
