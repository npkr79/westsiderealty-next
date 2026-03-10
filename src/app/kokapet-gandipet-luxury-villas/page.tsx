import type { Metadata } from "next";
import VillaEnquiryForm from "./VillaEnquiryForm";

export const metadata: Metadata = {
  title: "Luxury Villas in Kokapet & Gandipet | ₹10 Cr – ₹20 Cr+ | RE/MAX Westside Realty",
  description: "Rare luxury villa resales in Kokapet and Gandipet, Hyderabad. Prices from ₹10 Cr to ₹20 Cr+. No new villa communities being built — only resale inventory available.",
};

export default function KokapetGandipetVillasPage() {

  return (
    <main>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        :root {
          --gold: #C9A96E; --gold-light: #E8D5B0; --dark: #0A0A08;
          --dark-2: #111110; --dark-3: #1A1A17; --cream: #F5F0E8;
          --cream-2: #EDE6D6; --muted: #888880;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .vp { font-family: 'Jost', sans-serif; background: var(--dark); color: var(--cream); overflow-x: hidden; }
        .vp-hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; padding: 88px 48px 80px; background: linear-gradient(to bottom, rgba(10,10,8,0.8) 0%, rgba(10,10,8,0.45) 35%, rgba(10,10,8,0.6) 70%, rgba(10,10,8,1) 100%), url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=80') center/cover no-repeat; }
        .vp-tag { display: inline-block; border: 1px solid var(--gold); color: var(--gold); font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; padding: 6px 16px; margin-bottom: 32px; }
        .vp-hero h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(48px, 6vw, 88px); font-weight: 300; line-height: 1.05; max-width: 800px; margin-bottom: 28px; }
        .vp-hero h1 em { font-style: italic; color: var(--gold); }
        .vp-hero p { font-size: 16px; font-weight: 300; color: var(--cream-2); max-width: 500px; line-height: 1.7; margin-bottom: 40px; opacity: 0.85; }
        .vp-stats { display: flex; gap: 48px; margin-bottom: 48px; flex-wrap: wrap; }
        .vp-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; color: var(--gold); }
        .vp-stat-label { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
        .vp-cta { display: inline-block; background: var(--gold); color: var(--dark); padding: 16px 36px; font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; }
        .sec { padding: 100px 48px; }
        .sec-dark { background: var(--dark); }
        .sec-dark2 { background: var(--dark-2); }
        .sec-dark3 { background: var(--dark-3); }
        .sec-line { border-top: none; position: relative; }
        .sec-line::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, var(--gold), transparent); }
        .sec-label { font-size: 11px; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; text-align: center; }
        .sec-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(34px, 4vw, 54px); font-weight: 300; text-align: center; line-height: 1.2; max-width: 680px; margin: 0 auto 20px; }
        .sec-title em { font-style: italic; color: var(--gold); }
        .sec-body { font-size: 16px; font-weight: 300; line-height: 1.8; color: rgba(245,240,232,0.72); text-align: center; max-width: 660px; margin: 0 auto 64px; }
        .grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: rgba(201,169,110,0.12); max-width: 1000px; margin: 0 auto; }
        .grid2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 2px; background: rgba(201,169,110,0.1); max-width: 1000px; margin: 64px auto 0; }
        .card { background: var(--dark-2); padding: 48px 36px; }
        .card-icon { font-size: 30px; margin-bottom: 18px; }
        .card h3 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; margin-bottom: 14px; }
        .card p { font-size: 14px; font-weight: 300; color: var(--muted); line-height: 1.7; }
        .card-num { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; color: rgba(201,169,110,0.18); line-height: 1; margin-bottom: 14px; }
        .timeline { display: flex; flex-direction: column; gap: 0; }
        .tl-row { display: flex; align-items: flex-start; gap: 24px; padding-bottom: 40px; position: relative; }
        .tl-row::before { content: ''; position: absolute; left: 19px; top: 40px; bottom: 0; width: 1px; background: linear-gradient(to bottom, var(--gold), transparent); }
        .tl-row:last-child::before { display: none; }
        .tl-dot { width: 40px; height: 40px; border: 1px solid var(--gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--dark); position: relative; z-index: 1; font-size: 11px; font-weight: 500; color: var(--gold); }
        .tl-price { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; color: var(--gold); margin-bottom: 4px; }
        .tl-desc { font-size: 13px; font-weight: 300; color: var(--muted); line-height: 1.6; }
        .journey-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; max-width: 1100px; margin: 64px auto 0; align-items: center; }
        .insight-box { background: var(--dark-3); border: 1px solid rgba(201,169,110,0.2); padding: 48px; }
        .insight-box h3 { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; margin-bottom: 24px; line-height: 1.3; }
        .insight-box h3 em { font-style: italic; color: var(--gold); }
        .insight-stat { display: flex; align-items: baseline; gap: 12px; margin-bottom: 28px; }
        .insight-big { font-family: 'Cormorant Garamond', serif; font-size: 56px; font-weight: 300; color: var(--gold); line-height: 1; }
        .insight-label { font-size: 14px; font-weight: 300; color: var(--muted); line-height: 1.5; }
        .insight-box p { font-size: 14px; font-weight: 300; color: rgba(245,240,232,0.68); line-height: 1.8; border-top: 1px solid rgba(201,169,110,0.12); padding-top: 24px; }
        .mkt-table { max-width: 900px; margin: 64px auto 0; border: 1px solid rgba(201,169,110,0.15); }
        .mkt-hdr, .mkt-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; }
        .mkt-hdr { background: rgba(201,169,110,0.07); border-bottom: 1px solid rgba(201,169,110,0.2); }
        .mkt-hdr div { padding: 16px 24px; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); }
        .mkt-row div { padding: 16px 24px; font-size: 14px; font-weight: 300; color: rgba(245,240,232,0.78); border-bottom: 1px solid rgba(201,169,110,0.07); }
        .mkt-row div:first-child { font-weight: 400; color: var(--cream); }
        .mkt-row:last-child div { border-bottom: none; }
        .green { color: #5db870 !important; font-weight: 500 !important; }
        .inv-section { padding: 100px 48px; background: linear-gradient(to bottom, rgba(10,10,8,0.93), rgba(10,10,8,0.87)), url('https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1800&q=80') center/cover fixed; position: relative; }
        .inv-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, var(--gold), transparent); }
        .inv-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; max-width: 1100px; margin: 64px auto 0; }
        .inv-card { border: 1px solid rgba(201,169,110,0.2); padding: 36px 28px; background: rgba(10,10,8,0.55); backdrop-filter: blur(8px); }
        .inv-badge { display: inline-block; font-size: 10px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); border: 1px solid rgba(201,169,110,0.3); padding: 4px 12px; margin-bottom: 20px; }
        .inv-card h3 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; margin-bottom: 6px; }
        .inv-loc { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
        .inv-price { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 300; color: var(--gold); margin-bottom: 4px; }
        .inv-size { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
        .inv-feats { border-top: 1px solid rgba(201,169,110,0.1); padding-top: 20px; display: flex; flex-direction: column; gap: 8px; }
        .inv-feat { font-size: 13px; font-weight: 300; color: rgba(245,240,232,0.68); display: flex; gap: 8px; }
        .inv-feat::before { content: '—'; color: var(--gold); font-size: 10px; flex-shrink: 0; }
        .form-wrap { max-width: 660px; margin: 0 auto; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .form-field label { font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); }
        .form-field input, .form-field select, .form-field textarea { background: rgba(255,255,255,0.04); border: 1px solid rgba(201,169,110,0.2); color: var(--cream); padding: 14px 16px; font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 300; outline: none; width: 100%; transition: border-color 0.3s; }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: var(--gold); }
        .form-field select option { background: #1A1A17; }
        .form-submit { width: 100%; background: var(--gold); color: var(--dark); border: none; padding: 18px; font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; margin-top: 8px; }
        .form-note { font-size: 12px; font-weight: 300; color: var(--muted); text-align: center; margin-top: 16px; line-height: 1.6; }
        @media (max-width: 768px) {
          .vp-hero { padding: 88px 20px 60px; }
          .vp-stats { gap: 24px; }
          .sec { padding: 60px 20px; }
          .grid3, .inv-grid { grid-template-columns: 1fr; }
          .grid2 { grid-template-columns: 1fr; }
          .journey-grid { grid-template-columns: 1fr; gap: 40px; }
          .mkt-hdr, .mkt-row { grid-template-columns: 2fr 1fr 1fr; }
          .mkt-hdr div:nth-child(3), .mkt-row div:nth-child(3) { display: none; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="vp">

        {/* HERO */}
        <section className="vp-hero">
          <span className="vp-tag">Kokapet · Gandipet · Hyderabad</span>
          <h1>Where <em>Luxury</em> Villas<br />Are No Longer Built</h1>
          <p>Developers have moved to high-density apartments. The last villa communities in Hyderabad's most coveted corridors are now only available as resales. We have rare inventory — ₹10 Cr to ₹20 Cr and above.</p>
          <div className="vp-stats">
            <div><div className="vp-stat-val">89%</div><div className="vp-stat-label">Price rise since 2019</div></div>
            <div><div className="vp-stat-val">₹10–20 Cr+</div><div className="vp-stat-label">Current villa range</div></div>
            <div><div className="vp-stat-val">Only 1–2</div><div className="vp-stat-label">New villa communities planned</div></div>
          </div>
          <a href="#enquire" className="vp-cta">View Available Villas →</a>
        </section>

        {/* SCARCITY */}
        <section className="sec sec-dark2 sec-line">
          <p className="sec-label">The Supply Paradox</p>
          <h2 className="sec-title">Demand is at its peak.<br /><em>Supply has stopped.</em></h2>
          <p className="sec-body">In 2019, several villa communities were being developed across Kokapet and Gandipet. By 2024, every major developer had pivoted to high-rise apartments. The land is too valuable for villas now — and that is precisely what makes existing villas so rare.</p>
          <div className="grid3">
            <div className="card"><div className="card-icon">🏗️</div><h3>No New Launches</h3><p>Not a single new villa gated community has launched in Kokapet or Gandipet since 2022. Developers find high-rises more profitable per square yard.</p></div>
            <div className="card"><div className="card-icon">📈</div><h3>10x Returns in a Decade</h3><p>Legend Chimes villas that launched at ₹1.4 Cr in 2015 now trade at ₹12–25 Cr. That is not appreciation — that is transformation of an entire corridor.</p></div>
            <div className="card"><div className="card-icon">🔑</div><h3>Resale Is the Only Route</h3><p>For anyone seeking a private villa with a garden and open sky in these corridors — the secondary market is the only option. These are rare finds.</p></div>
          </div>
        </section>

        {/* PRICE JOURNEY */}
        <section className="sec sec-dark">
          <p className="sec-label">Market Evolution</p>
          <h2 className="sec-title">Six Years That Changed<br /><em>Everything</em></h2>
          <div className="journey-grid">
            <div className="timeline">
              <div className="tl-row"><div className="tl-dot">19</div><div><div className="tl-price">₹1.4 – 2.1 Cr</div><div className="tl-desc">Legend Chimes launched in Kokapet at ₹1.4 Cr for a 327 sqyd villa and ₹2.1 Cr for 500 sqyd. Buyers who hesitated called it 'too expensive' for the outskirts.</div></div></div>
              <div className="tl-row"><div className="tl-dot">21</div><div><div className="tl-price">₹4 – 6 Cr</div><div className="tl-desc">Post-pandemic demand surge. Same Legend Chimes villas doubled in value. ORR connectivity and Financial District boom drove HNI migration to Kokapet.</div></div></div>
              <div className="tl-row"><div className="tl-dot">23</div><div><div className="tl-price">₹8 – 14 Cr</div><div className="tl-desc">GCC-era C-suite executives sought privacy over apartments. Legend Chimes resales crossed ₹8 Cr. Last villa communities fully absorbed — no new launches.</div></div></div>
              <div className="tl-row"><div className="tl-dot">25</div><div><div className="tl-price">₹12 – 25 Cr</div><div className="tl-desc">Today those same Legend Chimes villas trade at ₹12–25 Cr — a 10x return in a decade. Current villa rate: ₹20,000–25,000 per sqft. Only resales available.</div></div></div>
            </div>
            <div className="insight-box">
              <h3>Why <em>Gandipet</em> commands a premium over Kokapet</h3>
              <div className="insight-stat"><span className="insight-big">4×</span><span className="insight-label">Lower density than Kokapet.<br />Larger land parcels. More privacy. Lake views.</span></div>
              <p>Gandipet sits adjacent to Osman Sagar Lake, offering panoramic views unavailable anywhere else in west Hyderabad. Greenbelt restrictions have limited construction, preserving the exclusivity. A villa in Gandipet today starts at ₹18 Cr for 600 square yards — and rarely comes to market. Kokapet offers better connectivity; Gandipet offers irreplaceable tranquility. Both are irreversibly supply-constrained.</p>
            </div>
          </div>
        </section>

        {/* WHY NO NEW VILLAS */}
        <section className="sec sec-dark2 sec-line">
          <p className="sec-label">The Developer Calculus</p>
          <h2 className="sec-title">Why Developers Stopped<br />Building <em>Villas</em></h2>
          <p className="sec-body">The economics no longer work in the buyer's favour when it comes to new villa supply. Understanding why helps you recognise the long-term value of what you're acquiring.</p>
          <div className="grid2">
            <div className="card"><div className="card-num">01</div><h3>Land Cost Explosion</h3><p>Land in Kokapet now trades above ₹1.5 lakh per square yard. A 10-acre villa community needs 4,800+ square yards minimum. At these prices, the math only works for high-rise apartments — not low-density villas.</p></div>
            <div className="card"><div className="card-num">02</div><h3>Return on Capital</h3><p>A developer building 200 luxury apartments on the same land earns 3–4x the revenue per square yard compared to 20 villas. For every ₹100 of land cost, apartments return ₹380 — villas return ₹95. The choice is obvious.</p></div>
          </div>
        </section>

        {/* MARKET TABLE */}
        <section className="sec sec-dark">
          <p className="sec-label">Data Intelligence</p>
          <h2 className="sec-title">Corridor <em>Comparison</em></h2>
          <div className="mkt-table">
            <div className="mkt-hdr"><div>Micro-Market</div><div>Villa Rate (per sqft)</div><div>5-Year Growth</div><div>New Supply</div></div>
            <div className="mkt-row"><div>Kokapet</div><div>₹20,000–25,000</div><div className="green">+72.3%</div><div>Zero villas</div></div>
            <div className="mkt-row"><div>Gandipet</div><div>₹25,000–30,000</div><div className="green">+68%</div><div>Zero villas</div></div>
            <div className="mkt-row"><div>Narsingi</div><div>₹18,000–22,000</div><div className="green">+55%</div><div>Very limited</div></div>
            <div className="mkt-row"><div>Puppalaguda</div><div>₹20,000–24,000</div><div className="green">+61%</div><div>Minimal</div></div>
            <div className="mkt-row"><div>Gachibowli</div><div>₹22,000–28,000</div><div className="green">+48%</div><div>None</div></div>
          </div>
        </section>

        {/* INVENTORY */}
        <section className="inv-section">
          <p className="sec-label" style={{textAlign:'center'}}>Current Inventory</p>
          <h2 className="sec-title">Handpicked <em>Rare</em> Listings</h2>
          <p className="sec-body">Select verified listings from our exclusive resale inventory. Each personally assessed by our team. Pricing and availability subject to change — enquire immediately.</p>
          <div className="inv-grid">
            <div className="inv-card"><span className="inv-badge">Available · Kokapet</span><h3>Legend Chimes Villa</h3><div className="inv-loc">Kokapet, near Financial District</div><div className="inv-price">₹16 – 25 Cr</div><div className="inv-size">327–500 sqyds plot · 3,000–4,500 sqft built-up</div><div className="inv-feats"><div className="inv-feat">Gated community · 24/7 security</div><div className="inv-feat">Private garden & covered parking</div><div className="inv-feat">5 min from Financial District</div><div className="inv-feat">Ready to move</div></div></div>
            <div className="inv-card"><span className="inv-badge">Rare · Gandipet</span><h3>Lake View Villa Estate</h3><div className="inv-loc">Gandipet, Osman Sagar facing</div><div className="inv-price">₹20 – 28 Cr</div><div className="inv-size">600 sqyds plot · 7,500 sqft built-up</div><div className="inv-feats"><div className="inv-feat">Osman Sagar lake views</div><div className="inv-feat">Semi-furnished · premium finishes</div><div className="inv-feat">Greenbelt facing — no future construction</div><div className="inv-feat">Extremely rare resale opportunity</div></div></div>
            <div className="inv-card"><span className="inv-badge">Available · Narsingi</span><h3>Gooncha Hills Villa</h3><div className="inv-loc">Narsingi-Kokapet border</div><div className="inv-price">₹12 – 15 Cr</div><div className="inv-size">300 sqyds plot · 4,500 sqft built-up</div><div className="inv-feats"><div className="inv-feat">Gated community · 4 BHK · G+2</div><div className="inv-feat">Club house & swimming pool</div><div className="inv-feat">ORR & schools within 10 min</div><div className="inv-feat">Best value in the corridor</div></div></div>
          </div>
        </section>

        {/* FORM */}
        <section className="sec sec-dark3 sec-line" id="enquire">
          <div className="form-wrap">
            <p className="sec-label">Private Enquiry</p>
            <h2 className="sec-title">Speak to a <em>Villa Specialist</em></h2>
            <p className="sec-body" style={{marginBottom:'48px'}}>Our team has exclusive access to off-market villa listings in Kokapet and Gandipet. Share your requirements and we will curate options personally within 24 hours.</p>
            <VillaEnquiryForm />
          </div>
        </section>

      </div>
    </main>
  );
}
