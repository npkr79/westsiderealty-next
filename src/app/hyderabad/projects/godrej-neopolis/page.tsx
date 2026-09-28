import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { buildMetadata, JsonLd } from "@/components/common/SEO";
import { GodrejNeopolisCta, GodrejNeopolisLeadForm, GodrejNeopolisStyles } from "./GodrejNeopolisClient";

const canonicalUrl = "https://www.westsiderealty.in/hyderabad/projects/godrej-neopolis";
const title = "Godrej Neopolis Kokapet | Price, EOI, Floor Plans & Pre-Launch";
const description = "Explore Godrej Neopolis in Kokapet, Hyderabad. See current pre-launch details, expected pricing, 3 & 4 BHK sizes, EOI information, location and floor plan updates.";

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#17171B",
  gold: "#B08D57",
  goldLight: "#D8BF8A",
  accent: "#2D6A4F",
  text: "#1A1A1F",
  textMuted: "#737378",
  border: "rgba(0,0,0,0.08)",
};

const prices = [
  ["3 BHK", "1,950 sqft", "₹2.54–₹2.73 Cr"],
  ["3 BHK", "2,250 sqft", "₹2.93–₹3.15 Cr"],
  ["3 BHK", "2,400 sqft", "₹3.12–₹3.36 Cr"],
  ["3 BHK", "2,700 sqft", "₹3.51–₹3.78 Cr"],
  ["4 BHK", "3,250 sqft", "₹4.23–₹4.55 Cr"],
];

const faqs = [
  { q: "What is Godrej Neopolis?", a: "Godrej Neopolis is a currently indicated pre-launch premium residential development by Godrej Properties in Neopolis / Kokapet, Hyderabad." },
  { q: "Where is Godrej Neopolis located?", a: "Godrej Neopolis is located in the Neopolis / Kokapet corridor of Hyderabad." },
  { q: "What is the expected Godrej Neopolis price?", a: "The expected base price range is ₹13,000–₹14,000 per sqft. Indicative base values are not all-inclusive prices." },
  { q: "What are the expected 3 BHK sizes?", a: "Current developer-provided pre-launch information indicates 3 BHK sizes of 1,950, 2,250, 2,400 and 2,700 sqft." },
  { q: "What is the expected 4 BHK size?", a: "The currently indicated 4 BHK size is 3,250 sqft." },
  { q: "How many towers are planned at Godrej Neopolis?", a: "Current pre-launch information indicates 2 towers." },
  { q: "How many floors are currently indicated?", a: "Current pre-launch information indicates 57 floors." },
  { q: "What is the clubhouse size?", a: "The clubhouse is currently indicated at approximately 75,000 sqft across 5 floors." },
  { q: "Is Godrej Neopolis RERA registered?", a: "Godrej Neopolis is currently in the pre-launch stage. RERA registration is expected in the first week of October 2026, and this page does not present the project as RERA registered." },
  { q: "When is Godrej Neopolis RERA expected?", a: "RERA registration is currently expected in the first week of October 2026." },
  { q: "How does the Godrej Neopolis EOI process work?", a: "Current developer information indicates that the EOI process is completed at the project/developer site. Final EOI terms should be confirmed when formally released by the developer." },
  { q: "Are Godrej Neopolis floor plans available?", a: "Reliable floor-plan assets are not available on this page yet. Detailed floor-plan updates can be requested through the form." },
];

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonicalUrl,
  keywords: "Godrej Neopolis Kokapet, Godrej Neopolis price, Godrej Neopolis EOI, Godrej Neopolis floor plans, Godrej Neopolis pre launch",
});

function SectionTitle({ eyebrow, title: heading, children, inverse = false }: { eyebrow: string; title: string; children?: ReactNode; inverse?: boolean }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ margin: "0 0 9px", color: C.gold, fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>{eyebrow}</p>
      <h2 style={{ margin: "0 0 12px", color: inverse ? "#fff" : C.text, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.08, fontWeight: 600 }}>{heading}</h2>
      {children && <p style={{ margin: 0, color: inverse ? "rgba(255,255,255,0.7)" : C.textMuted, lineHeight: 1.7, maxWidth: 760 }}>{children}</p>}
    </div>
  );
}

function FactCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="gn-soft-card">
      <p style={{ margin: "0 0 8px", color: C.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, color: C.text, fontSize: 22, fontWeight: 800 }}>{value}</p>
      {note && <p style={{ margin: "8px 0 0", color: C.textMuted, fontSize: 13, lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

export default function GodrejNeopolisPage() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: canonicalUrl,
      isPartOf: { "@type": "WebSite", name: "Westside Realty", url: "https://www.westsiderealty.in" },
      about: ["Godrej Neopolis", "Kokapet", "Neopolis Hyderabad", "Pre-launch residential project"],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
        { "@type": "ListItem", position: 2, name: "Hyderabad", item: "https://www.westsiderealty.in/hyderabad/buy" },
        { "@type": "ListItem", position: 3, name: "Godrej Neopolis", item: canonicalUrl },
      ],
    },
  ];

  return (
    <main style={{ background: C.bg, color: C.text, fontFamily: "'Outfit', sans-serif" }}>
      <JsonLd jsonLd={schemas} />
      <GodrejNeopolisStyles />

      <section style={{ background: `radial-gradient(circle at 72% 18%, rgba(176,141,87,0.25), transparent 34%), linear-gradient(135deg, ${C.bgDark}, #262126)`, color: "#fff", padding: "112px 0 70px" }}>
        <div className="gn-container gn-grid-2">
          <div>
            <p style={{ margin: "0 0 14px", color: C.goldLight, fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>Godrej Properties · Neopolis / Kokapet</p>
            <h1 style={{ margin: "0 0 20px", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(42px, 6.5vw, 76px)", lineHeight: 0.96, fontWeight: 600 }}>Godrej Neopolis Kokapet – Pre-Launch Project</h1>
            <p style={{ margin: "0 0 28px", color: "rgba(255,255,255,0.74)", fontSize: 18, lineHeight: 1.7, maxWidth: 720 }}>Premium residential development by Godrej Properties in the Neopolis–Kokapet corridor, with current pre-launch information covering expected price, EOI stage and 3 & 4 BHK residence plans.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
              <GodrejNeopolisCta intent="general_prelaunch" location="hero">Get pre-launch details</GodrejNeopolisCta>
              <GodrejNeopolisCta intent="price" location="hero" variant="secondary">Check expected price</GodrejNeopolisCta>
            </div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.56)", fontSize: 13 }}>No phone, call or messaging shortcut is used on this page. All enquiries go through the lead form.</p>
          </div>
          <aside style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 26, padding: 24, backdropFilter: "blur(10px)" }}>
            <p style={{ margin: "0 0 14px", color: C.goldLight, fontWeight: 800 }}>Pre-Launch Information</p>
            <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.72)", lineHeight: 1.7 }}>Pre-Launch Information: Godrej Neopolis is currently in the pre-launch stage. Certain project details, specifications and pricing on this page are based on current developer-provided pre-launch information and may change before formal launch. Final specifications, pricing, EOI terms and timelines should be confirmed when formally released by the developer.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FactCard label="Land parcel" value="~5 acres" />
              <FactCard label="Towers" value="2" />
              <FactCard label="Height" value="57 floors" />
              <FactCard label="Clubhouse" value="~75,000 sqft" />
            </div>
          </aside>
        </div>
      </section>

      <section className="gn-section" style={{ background: C.bgWarm }}>
        <div className="gn-container">
          <SectionTitle eyebrow="Project snapshot" title="What is publicly known so far">The confirmed public transaction and developer pre-launch details point to a premium residential project in Neopolis / Kokapet, one of Hyderabad’s most watched western corridors.</SectionTitle>
          <div className="gn-card-grid">
            <FactCard label="Developer" value="Godrej Properties" />
            <FactCard label="Proposed saleable area" value="~2.5M sqft" note="Publicly reported proposed scale." />
            <FactCard label="Estimated revenue potential" value="~₹4,150 Cr" note="Publicly reported estimate." />
            <FactCard label="Configurations" value="3 & 4 BHK" note="Current pre-launch indication." />
            <FactCard label="Expected base price" value="₹13k–₹14k/sqft" note="Not all-inclusive." />
            <FactCard label="RERA expectation" value="Oct 2026" note="Expected first week; not yet presented as registered." />
          </div>
        </div>
      </section>

      <section className="gn-section" id="price">
        <div className="gn-container">
          <SectionTitle eyebrow="Expected price" title="Godrej Neopolis Price & Pre-Launch Pricing">Expected base price: ₹13,000–₹14,000 per sqft. Indicative base values calculated from the currently expected ₹13,000–₹14,000/sq ft base-price range. These are not all-inclusive prices.</SectionTitle>
          <div className="gn-price-grid">
            {prices.map(([type, size, range]) => (
              <div key={size} className="gn-soft-card">
                <p style={{ margin: "0 0 10px", color: C.gold, fontWeight: 800 }}>{type}</p>
                <p style={{ margin: "0 0 6px", color: C.textMuted }}>{size}</p>
                <p style={{ margin: 0, color: C.text, fontSize: 21, fontWeight: 850 }}>{range}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <GodrejNeopolisCta intent="price" location="price">GET PRE-LAUNCH PRICE DETAILS</GodrejNeopolisCta>
            <GodrejNeopolisCta intent="eoi" location="price" variant="secondary">Ask about EOI</GodrejNeopolisCta>
          </div>
        </div>
      </section>

      <section className="gn-section" style={{ background: C.bgWarm }}>
        <div className="gn-container gn-grid-2">
          <div>
            <SectionTitle eyebrow="Configurations" title="Godrej Neopolis 3 & 4 BHK Configurations">The current developer-provided pre-launch information indicates four 3 BHK size bands and one 4 BHK size band. Final availability, stack mix and plan details should be verified at launch.</SectionTitle>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <GodrejNeopolisCta intent="3bhk" location="configuration">GET 3 BHK DETAILS</GodrejNeopolisCta>
              <GodrejNeopolisCta intent="4bhk" location="configuration" variant="secondary">GET 4 BHK DETAILS</GodrejNeopolisCta>
            </div>
          </div>
          <div className="gn-soft-card">
            <ul style={{ margin: 0, paddingLeft: 20, color: C.textMuted, lineHeight: 2 }}>
              <li>3 BHK: 1,950 sqft</li>
              <li>3 BHK: 2,250 sqft</li>
              <li>3 BHK: 2,400 sqft</li>
              <li>3 BHK: 2,700 sqft</li>
              <li>4 BHK: 3,250 sqft</li>
              <li>Clubhouse: approximately 75,000 sqft across 5 floors</li>
            </ul>
          </div>
        </div>
      </section>


      <section className="gn-section" style={{ background: C.bgWarm }}>
        <div className="gn-container gn-grid-2">
          <div>
            <SectionTitle eyebrow="Floor plans" title="Godrej Neopolis Floor Plans">Reliable Godrej Neopolis floor-plan assets are not available yet. The currently indicated residence sizes are 3 BHK homes of 1,950 / 2,250 / 2,400 / 2,700 sqft and a 4 BHK home of 3,250 sqft. Detailed floor-plan information can be requested through the form.</SectionTitle>
            <GodrejNeopolisCta intent="floor_plan" location="floor_plan">GET FLOOR PLAN UPDATES</GodrejNeopolisCta>
          </div>
          <div className="gn-soft-card">
            <p style={{ margin: "0 0 12px", color: C.text, fontSize: 18, fontWeight: 800 }}>Project scale currently indicated</p>
            <ul style={{ margin: 0, paddingLeft: 20, color: C.textMuted, lineHeight: 2 }}>
              <li>Approximately 75,000 sqft clubhouse</li>
              <li>5 clubhouse floors</li>
              <li>2 residential towers</li>
              <li>57 floors</li>
              <li>5-acre site</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="gn-section">
        <div className="gn-container">
          <SectionTitle eyebrow="Why Neopolis" title="Why Neopolis?">Neopolis has become one of Hyderabad’s most closely watched premium residential pockets because it sits within the west Hyderabad growth corridor and attracts demand from buyers comparing Kokapet, Financial District, Gachibowli and HITEC City. A large Godrej Properties pre-launch in this corridor is commercially significant because it adds a national developer to an already competitive ultra-premium project cluster.</SectionTitle>
          <Link href="/hyderabad/neopolis" style={{ color: C.gold, fontWeight: 800 }}>Explore the Neopolis Market →</Link>
        </div>
      </section>

      <section className="gn-section" style={{ background: C.bgWarm }}>
        <div className="gn-container gn-grid-2">
          <div>
            <SectionTitle eyebrow="Location" title="Godrej Neopolis Location – Kokapet, Hyderabad">Godrej Neopolis sits in Hyderabad’s west corridor around Neopolis and Kokapet, with natural connectivity context around Financial District, Gachibowli, HITEC City and the Outer Ring Road. Use this page along with our market guides to compare the location against nearby project supply.</SectionTitle>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/hyderabad/neopolis" style={{ color: C.gold, fontWeight: 800 }}>Read Neopolis market guide →</Link>
              <Link href="/hyderabad/kokapet" style={{ color: C.gold, fontWeight: 800 }}>Compare Kokapet →</Link>
            </div>
          </div>
          <div className="gn-soft-card">
            <p style={{ margin: "0 0 12px", color: C.text, fontSize: 18, fontWeight: 800 }}>Developer context</p>
            <p style={{ margin: "0 0 18px", color: C.textMuted, lineHeight: 1.7 }}>Godrej Neopolis is by Godrej Properties. Review the developer profile before comparing launch price, configuration and location fit.</p>
            <Link href="/developers/godrej-properties" style={{ color: C.gold, fontWeight: 800 }}>View Godrej Properties profile →</Link>
          </div>
        </div>
      </section>

      <section className="gn-section" style={{ background: C.bgDark, color: "#fff" }}>
        <div className="gn-container gn-grid-2">
          <div>
            <SectionTitle eyebrow="EOI stage" title="Godrej Neopolis EOI – Pre-Launch Stage" inverse>Godrej Neopolis is currently in its pre-launch EOI stage. Current developer information indicates that the EOI process is completed at the project/developer site. Before proceeding, verify the latest price, EOI terms, RERA status, unit preference, launch timeline and all-inclusive cost structure.</SectionTitle>
            <GodrejNeopolisCta intent="eoi" location="eoi">GET EOI DETAILS</GodrejNeopolisCta>
          </div>
          <div className="gn-soft-card" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)" }}>
            <p style={{ margin: "0 0 12px", color: C.goldLight, fontWeight: 800 }}>Pre-Launch Information</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>Godrej Neopolis is currently in the pre-launch stage. The project is not represented here as RERA registered, and no RERA number is listed until official details are available.</p>
          </div>
        </div>
      </section>

      <section className="gn-section" style={{ background: C.bgWarm }}>
        <div className="gn-container gn-grid-2">
          <div>
            <SectionTitle eyebrow="FAQs" title="Godrej Neopolis questions buyers are asking" />
            <div style={{ display: "grid", gap: 14 }}>
              {faqs.map((faq) => (
                <details key={faq.q} className="gn-soft-card">
                  <summary style={{ cursor: "pointer", fontWeight: 800, color: C.text }}>{faq.q}</summary>
                  <p style={{ margin: "14px 0 0", color: C.textMuted, lineHeight: 1.7 }}>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
          <GodrejNeopolisLeadForm />
        </div>
      </section>
    </main>
  );
}
