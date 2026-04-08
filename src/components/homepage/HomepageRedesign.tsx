"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buildProjectUrl } from "@/lib/routes";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPABASE_IMG =
  "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-hero-images";

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  accent: "#2D6A4F",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

const TICKER_MARKETS = [
  { name: "Kokapet", price: "₹11,200", change: "+14.2%" },
  { name: "Financial District", price: "₹10,775", change: "+8.5%" },
  { name: "Neopolis", price: "₹12,048", change: "+18.6%" },
  { name: "Gachibowli", price: "₹10,250", change: "+10.1%" },
  { name: "Tellapur", price: "₹7,800", change: "+12.4%" },
  { name: "Narsingi", price: "₹9,100", change: "+9.8%" },
  { name: "Jubilee Hills", price: "₹18,500", change: "+6.2%" },
  { name: "Kondapur", price: "₹8,400", change: "+11.3%" },
  { name: "Assagao, Goa", price: "₹25,000", change: "+9.5%" },
  { name: "Calangute, Goa", price: "₹18,500", change: "+8.2%" },
  { name: "Candolim, Goa", price: "₹22,000", change: "+10.1%" },
];

const HERO_CARDS = [
  // Neopolis
  {
    name: "Rajapushpa Skyra",
    location: "Neopolis, Kokapet",
    price: "₹3.35 Cr – ₹5.72 Cr",
    tag: "1.15L sqft Clubhouse",
    img: `${SUPABASE_IMG}/skyra_hero.png`,
    rotate: "-3deg",
    z: 9,
  },
  {
    name: "Brigade Gateway",
    location: "Neopolis, Kokapet",
    price: "₹4.60 Cr – ₹15.77 Cr",
    tag: "New Launch · Neopolis",
    img: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-hero-images/Brigade_Gateway_Hero_Image.jpg",
    rotate: "2deg",
    z: 8,
  },
  // Kokapet
  {
    name: "Ramky One Astra",
    location: "Kokapet",
    price: "Price on Request",
    tag: "Under Construction · Kokapet",
    img: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-hero-images/ramky_one_astra_hero_image.png",
    rotate: "-2deg",
    z: 7,
  },
  {
    name: "Rajapushpa Casa Luxura",
    location: "Kokapet",
    price: "₹4.5 Cr – ₹6.5 Cr",
    tag: "Ultra Luxury Villas",
    img: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-hero-images/Rajapushpa_Casa_Luxura_Hero_Image.jpg",
    rotate: "1deg",
    z: 6,
  },
  // Gachibowli
  {
    name: "Prestige High Fields",
    location: "Gachibowli",
    price: "₹1.5 Cr – ₹3.5 Cr",
    tag: "Ready to Move · Resale",
    img: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-hero-images/Prestige_High_Fields_Hero_Image.jpg",
    rotate: "-1deg",
    z: 5,
  },
  {
    name: "My Home Bhooja",
    location: "Gachibowli",
    price: "₹3.5 Cr – ₹6.0 Cr",
    tag: "Iconic Tower · Resale",
    img: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-images/projects/my_home_vipina/My_Home_Vipina_Main.png",
    rotate: "3deg",
    z: 4,
  },
  // Tellapur
  {
    name: "My Home Sayuk",
    location: "Tellapur",
    price: "Price on Request",
    tag: "Under Construction · Tellapur",
    img: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-hero-images/My_Home_Sayuk_Hero_Image.jpg",
    rotate: "-2deg",
    z: 3,
  },
  {
    name: "My Home Avali",
    location: "Tellapur",
    price: "₹3.5 Cr – ₹5.8 Cr",
    tag: "3 & 4 BHK · Tellapur",
    img: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/project-hero-images/My_Home_Avali_Hero_Image.jpg",
    rotate: "1deg",
    z: 2,
  },
  // Financial District
  {
    name: "ASBL Broadway",
    location: "Financial District",
    price: "₹2.2 Cr – ₹3.5 Cr",
    tag: "G+50 · ₹1000 Cr Launch Day",
    img: `${SUPABASE_IMG}/ASBL-Broadway_hero.png`,
    rotate: "-1deg",
    z: 1,
  },
];

const STATS = [
  { value: 577, suffix: "+", label: "RERA Projects" },
  { value: 25, suffix: "", label: "Markets" },
  { value: 200, suffix: "+", label: "AI-Enriched" },
  { value: 1200, suffix: "+", label: "Buyers Advised" },
  { value: 12, suffix: " Yrs", label: "Expertise" },
];

const MARKETS = [
  {
    name: "Kokapet",
    tag: "Fastest Growing",
    tagColor: "#2D6A4F",
    tagBg: "rgba(45,106,79,0.1)",
    avgPrice: "₹11,200/sqft",
    yoy: "+14.2%",
    yoyColor: "#2D6A4F",
    projects: 48,
    velocity: 90,
    desc: "Hyderabad's fastest-expanding luxury corridor, anchored by ORR access and proximity to HITEC City. Home to 48 active projects from top-tier developers like My Home, ASBL, and Rajapushpa.",
    href: "/hyderabad/kokapet",
  },
  {
    name: "Financial District",
    tag: "Highest Rental Yield",
    tagColor: "#B08D57",
    tagBg: "rgba(176,141,87,0.1)",
    avgPrice: "₹10,775/sqft",
    yoy: "+8.5%",
    yoyColor: "#2D6A4F",
    projects: 39,
    velocity: 87,
    desc: "Nanakramguda's corporate hub houses Fortune 500 GCCs and tech giants. Consistent 3.85% rental yields and blue-chip tenant demand make it the top pick for rental income investors.",
    href: "/hyderabad/financial-district",
  },
  {
    name: "Neopolis",
    tag: "Ultra Premium",
    tagColor: "#8B5CF6",
    tagBg: "rgba(139,92,246,0.1)",
    avgPrice: "₹12,048/sqft",
    yoy: "+18.6%",
    yoyColor: "#2D6A4F",
    projects: 12,
    velocity: 94,
    desc: "The ultra-luxury sub-zone within Kokapet, featuring Hyderabad's most exclusive developments. With only 12 curated projects, Neopolis commands the highest appreciation in the city.",
    href: "/hyderabad/kokapet",
  },
  {
    name: "Goa",
    tag: "Holiday & Investment",
    tagColor: "#E67E22",
    tagBg: "rgba(230,126,34,0.1)",
    avgPrice: "₹15,000–45,000",
    yoy: "+8–12%",
    yoyColor: "#2D6A4F",
    projects: 30,
    velocity: 72,
    desc: "India's premier holiday home destination. Luxury villas in Assagao, Calangute, and Candolim — rental yields of 5–8% driven by tourism and remote work migration.",
    href: "/contact",
  },
];

const FEATURED_PROJECTS = [
  {
    name: "One by MSN",
    location: "Neopolis",
    config: "3, 4, 5 BHK",
    price: "₹12,500–14,000/sqft",
    tag: "Largest Clubhouse: 1.8L sqft",
    appreciation: "+26%",
    gradientFrom: "#1a1a2e",
    gradientTo: "#16213e",
    slug: "one-by-msn",
    img: null,
  },
  {
    name: "ASBL Broadway",
    location: "Financial District",
    config: "3, 3.5 BHK",
    price: "₹10,683/sqft",
    tag: "G+50 · ₹1000 Cr Launch Day",
    appreciation: "+6.4%",
    gradientFrom: "#0d1827",
    gradientTo: "#1a2e40",
    slug: "asbl-broadway",
    img: `${SUPABASE_IMG}/ASBL-Broadway_hero.png`,
  },
  {
    name: "Songs of the Sun",
    location: "Financial District",
    config: "3, 4 BHK",
    price: "₹10,000–11,100/sqft",
    tag: "20 Shades · All Corner Units",
    appreciation: "+14%",
    gradientFrom: "#1a1209",
    gradientTo: "#2d1e0f",
    slug: "myscape-songs-of-the-sun",
    img: `${SUPABASE_IMG}/myscape-songs-of-the-sun_hero.png`,
  },
  {
    name: "Sumadhura Palais Royale",
    location: "Financial District",
    config: "4, 5 BHK",
    price: "₹13,100–15,400/sqft",
    tag: "85K sqft Floating Clubhouse",
    appreciation: null,
    gradientFrom: "#0d1b2a",
    gradientTo: "#1b2838",
    slug: "sumadhura-palais-royale",
    img: null,
  },
  {
    name: "Yoo Hyderabad",
    location: "Financial District",
    config: "4 BHK Branded",
    price: "₹13,500–14,000/sqft",
    tag: "YOO London · 52 Floors",
    appreciation: null,
    gradientFrom: "#1a0a2e",
    gradientTo: "#2d1b4e",
    slug: "yoo-hyderabad",
    img: null,
  },
  {
    name: "Candeur Skyline",
    location: "Financial District",
    config: "4 BHK Sky Villa",
    price: "₹12,000–13,500/sqft",
    tag: "G+58 · South India's Tallest",
    appreciation: "+12%",
    gradientFrom: "#0a1628",
    gradientTo: "#162032",
    slug: "candeur-skyline",
    img: null,
  },
];

const PILLARS = [
  {
    icon: "◉",
    title: "RERA-First Data",
    desc: "Every project verified against RERA filings. No ghost listings, no stale data. 577+ projects with real possession dates and developer accountability.",
  },
  {
    icon: "⬡",
    title: "AI Market Signals",
    desc: "200+ projects across Hyderabad and Goa enriched with pricing intelligence, appreciation tracking, rental yields, and buyer sentiment. Updated weekly.",
  },
  {
    icon: "◈",
    title: "12 Years On-Ground",
    desc: "We've walked every corridor, met every developer, tracked every site. Our advisors give you the conversation that no portal can replicate.",
  },
];

const CHAT_PREVIEW = [
  { role: "user", text: "What's the appreciation on ASBL Spire?" },
  {
    role: "ai",
    text: "ASBL Spire has delivered 148% appreciation since launch. Currently ₹9,200/sqft vs ₹3,750 at launch. Possession Dec 2026.",
  },
  { role: "user", text: "Is it good for rental income?" },
];

const QUICK_FILTERS = [
  "Ready to move",
  "Under ₹2 Cr",
  "₹5 Cr+",
  "Villa",
  "Best in Hyderabad",
  "Goa villas",
  "Invest in Goa",
  "Top appreciation",
];

// ─── Animated Counter ────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 2200) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return { count, ref };
}

function StatItem({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const { count, ref } = useCountUp(value);
  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(26px, 3vw, 34px)",
          fontWeight: 600,
          color: C.text,
          margin: 0,
        }}
      >
        <span ref={ref}>{count.toLocaleString("en-IN")}</span>
        {suffix}
      </p>
      <p
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: C.textMuted,
          marginTop: 6,
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const BANNER_KEY = "wsr_banner_dismissed";
const POPUP_KEY  = "wsr_popup_shown";

function openAdvisor(message?: string) {
  window.dispatchEvent(
    new CustomEvent("westside:openAdvisor", { detail: { message } })
  );
}

export default function HomepageRedesign() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [topCardIdx, setTopCardIdx] = useState(0);

  // ── Tier 1: Advisor banner ────────────────────────────────────────────────
  const [showBanner, setShowBanner] = useState(false);

  // ── Tier 2: Intent popup ──────────────────────────────────────────────────
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Banner — show unless dismissed this session
    if (!sessionStorage.getItem(BANNER_KEY)) {
      setShowBanner(true);
    }

    // Popup — show once per session after 60s OR exit intent
    if (sessionStorage.getItem(POPUP_KEY)) return;

    function triggerPopup() {
      if (sessionStorage.getItem(POPUP_KEY)) return;
      sessionStorage.setItem(POPUP_KEY, "1");
      setShowPopup(true);
    }

    const timer = setTimeout(triggerPopup, 60_000);

    function handleExitIntent(e: MouseEvent) {
      if (e.clientY <= 5) triggerPopup();
    }
    document.addEventListener("mouseleave", handleExitIntent);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleExitIntent);
    };
  }, []);

  // ── Natural language search ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchOverview, setSearchOverview] = useState<string | null>(null);
  const [searchOverviewLoading, setSearchOverviewLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  async function handleSearch(q: string) {
    const query = q.trim();
    if (!query) return;
    setActiveFilter(QUICK_FILTERS.includes(query) ? query : null);
    setSearchLoading(true);
    setSearchResults(null);
    setSearchOverview(null);
    setSearchOverviewLoading(false);
    setSearchError(null);

    // Detect conversational questions → route to Advisor
    const isQuestion =
      /^(which|what|how|should|where|why|is|are|does|can)\b/i.test(query) ||
      query.includes("?") ||
      /\bvs\b|\bversus\b|\bbest\b|\bcompare\b/i.test(query);

    try {
      // Step 1: parse
      const parseRes = await fetch(`/api/search/parse?q=${encodeURIComponent(query)}`);
      const { parsed } = await parseRes.json();

      // Step 2: build search params from parsed result
      // Always pass raw query for cross-city name matching in the API
      const params = new URLSearchParams({ q: query });
      // Use city inferred by parser (comes from micro-market's own city_id join)
      // For project name matches (Hyderabad-only projects table), default to hyderabad
      if (parsed?.city) {
        params.set("city", parsed.city);
      } else if (parsed?.projectName && !parsed?.microMarket) {
        // projectName matched from Hyderabad-only projects table → city is hyderabad
        params.set("city", "hyderabad");
      }
      // No city param = API will search all cities via advisor table
      if (parsed?.microMarket) params.set("microMarket", parsed.microMarket);
      if (parsed?.bhkConfig) params.set("bhk", parsed.bhkConfig);
      if (parsed?.developer) params.set("developer", parsed.developer);
      if (parsed?.projectName) params.set("projectName", parsed.projectName);
      if (parsed?.completionStatus) params.set("completionStatus", parsed.completionStatus);
      if (parsed?.isNewProject) params.set("isNewProject", "true");
      if (parsed?.propertyType) {
        params.set("project_type", parsed.propertyType);
        params.set("propertyTypes", parsed.propertyType);
      }

      // Step 3: execute search
      const searchRes = await fetch(`/api/search?${params}`);
      const { results, total } = await searchRes.json();

      // Step 4: no results or it's a question → open Advisor with pre-filled query
      if (!total || isQuestion) {
        window.dispatchEvent(
          new CustomEvent("westside:openAdvisor", { detail: { message: query } })
        );
        setSearchLoading(false);
        return;
      }

      const sliced = (results as any[]).slice(0, 9);
      setSearchResults(sliced);
      setTimeout(() => searchResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

      // Fetch expert summary in background (non-blocking)
      setSearchOverviewLoading(true);
      fetch("/api/search/ai-overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, results: sliced, totalCount: total }),
      })
        .then((r) => r.json())
        .then((d) => { setSearchOverview(d.overview ?? null); setSearchOverviewLoading(false); })
        .catch(() => setSearchOverviewLoading(false));
    } catch {
      setSearchError("Something went wrong. Try asking the AI Advisor instead.");
    } finally {
      setSearchLoading(false);
    }
  }

  // Cycle hero cards every 3.5s
  useEffect(() => {
    const t = setInterval(
      () => setTopCardIdx((i) => (i + 1) % HERO_CARDS.length),
      3500
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: "'Outfit', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── Global Keyframes & Utility Classes ── */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40%            { opacity: 1;    transform: scale(1); }
        }
        .hr-ticker { animation: ticker 32s linear infinite; }
        .hr-ticker:hover { animation-play-state: paused; }

        .hr-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .hr-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 52px rgba(176,141,87,0.13) !important;
          border-color: rgba(176,141,87,0.38) !important;
        }

        .hr-search:focus {
          outline: none;
          border-color: #B08D57 !important;
          box-shadow: 0 0 0 3px rgba(176,141,87,0.14);
        }
        .hr-pill {
          transition: color 0.18s, border-color 0.18s, background 0.18s;
        }
        .hr-pill:hover { color: #B08D57 !important; border-color: #B08D57 !important; }
        .hr-pill.active { color: #B08D57 !important; border-color: #B08D57 !important; }

        .hr-dot {
          display: inline-block;
          width: 6px; height: 6px; border-radius: 50%;
          background: #6A6A6E;
          animation: typingDot 1.4s ease-in-out infinite;
        }
        .hr-dot:nth-child(2) { animation-delay: 0.18s; }
        .hr-dot:nth-child(3) { animation-delay: 0.36s; }

        /* Responsive overrides */
        @media (max-width: 900px) {
          .hr-hero-grid  { grid-template-columns: 1fr !important; }
          .hr-mkt-grid   { grid-template-columns: 1fr 1fr !important; }
          .hr-proj-grid  { grid-template-columns: 1fr 1fr !important; }
          .hr-cta-grid   { grid-template-columns: 1fr !important; }
          .hr-why-grid   { grid-template-columns: 1fr !important; }
          .hr-hero-cards { display: none !important; }
        }
        @media (max-width: 600px) {
          .hr-mkt-grid   { grid-template-columns: 1fr !important; }
          .hr-proj-grid  { grid-template-columns: 1fr !important; }
          .hr-stats-flex { flex-direction: column !important; gap: 28px !important; }
          .hr-cta-btns   { flex-direction: column !important; align-items: center !important; }
        }
      `}</style>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 1. TICKER BAR                                           */}
      {/* ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: C.bgDark,
          height: 42,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="hr-ticker"
          style={{ display: "flex", whiteSpace: "nowrap" }}
        >
          {[...TICKER_MARKETS, ...TICKER_MARKETS].map((m, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0 28px",
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <span style={{ color: "#7A7A7E" }}>{m.name}</span>
              <span style={{ color: "#EAEAEA", fontWeight: 500 }}>
                {m.price}
              </span>
              <span style={{ color: "#4ADE80", fontSize: 11 }}>{m.change}</span>
              <span style={{ color: "#3A3A3E", marginLeft: 10 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 2. HERO                                                  */}
      {/* ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "68px 24px 60px", background: C.bg }}>
        <div
          className="hr-hero-grid"
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 460px",
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* Left — text + search */}
          <div>
            {/* Live badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(45,106,79,0.08)",
                border: "1px solid rgba(45,106,79,0.22)",
                borderRadius: 100,
                padding: "6px 14px",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: C.accent,
                  display: "inline-block",
                  boxShadow: "0 0 0 2px rgba(45,106,79,0.25)",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: C.accent,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                Live data across Hyderabad &amp; Goa
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(38px, 4.2vw, 56px)",
                fontWeight: 600,
                lineHeight: 1.13,
                color: C.text,
                marginBottom: 20,
              }}
            >
              The smartest way to invest in{" "}
              <em style={{ color: C.gold, fontStyle: "italic" }}>
                Hyderabad
              </em>{" "}
              &amp;{" "}
              <em style={{ color: C.gold, fontStyle: "italic" }}>
                Goa
              </em>{" "}
              real estate
            </h1>

            {/* Subtext */}
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: C.textMuted,
                marginBottom: 32,
                maxWidth: 500,
              }}
            >
              RERA-verified data, AI-powered market intelligence, and 12 years
              of on-ground expertise across 19 Hyderabad micro-markets and 6
              Goa beach markets. We don&apos;t just list properties — we decode them.
            </p>

            {/* Search bar */}
            <div style={{ position: "relative", marginBottom: 18 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                disabled={searchLoading}
                placeholder='"3BHK in Kokapet under 3 Cr" or "villa in Goa under 5 Cr"'
                className="hr-search"
                style={{
                  width: "100%",
                  padding: "14px 52px 14px 20px",
                  borderRadius: 14,
                  border: `1.5px solid ${C.border}`,
                  background: C.bgCard,
                  fontSize: 15,
                  color: C.text,
                  boxSizing: "border-box",
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  opacity: searchLoading ? 0.6 : 1,
                }}
              />
              <span
                onClick={() => handleSearch(searchQuery)}
                style={{
                  position: "absolute",
                  right: 18,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: searchLoading ? C.gold : C.textMuted,
                  fontSize: 18,
                  cursor: searchLoading ? "default" : "pointer",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {searchLoading ? "…" : "⌕"}
              </span>
            </div>

            {/* Quick filter chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => { setSearchQuery(f); handleSearch(f); }}
                  className={`hr-pill${activeFilter === f ? " active" : ""}`}
                  style={{
                    padding: "7px 15px",
                    borderRadius: 100,
                    border: `1px solid ${activeFilter === f ? C.gold : C.border}`,
                    background: "transparent",
                    fontSize: 13,
                    color: activeFilter === f ? C.gold : C.textMuted,
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Right — stacked project cards */}
          <div
            className="hr-hero-cards"
            style={{
              position: "relative",
              height: 360,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Render back-to-front so the top card is last in DOM (highest z-index) */}
            {[...HERO_CARDS]
              .map((card, idx) => ({ card, idx }))
              .reverse()
              .map(({ card, idx }) => {
                const isTop = idx === topCardIdx;
                // How far behind the top card is this card (0 = top)
                const rawOffset = (idx - topCardIdx + HERO_CARDS.length) % HERO_CARDS.length;
                // Cap visual depth at 2 — cards deeper than that hide silently behind
                const visualOffset = Math.min(rawOffset, 2);
                const isHidden = rawOffset > 2;
                return (
                  <div
                    key={card.name}
                    style={{
                      position: "absolute",
                      width: 340,
                      borderRadius: 20,
                      overflow: "hidden",
                      background: C.bgCard,
                      border: `1px solid ${
                        isTop ? "rgba(176,141,87,0.35)" : C.border
                      }`,
                      boxShadow: isTop
                        ? "0 24px 60px rgba(0,0,0,0.15)"
                        : `0 ${4 + visualOffset * 4}px 20px rgba(0,0,0,0.06)`,
                      transform: `rotate(${card.rotate}) translateY(${
                        isTop ? "-8px" : `${visualOffset * 20}px`
                      })`,
                      zIndex: isTop ? 10 : 3 - visualOffset,
                      opacity: isHidden ? 0 : 1,
                      pointerEvents: isHidden ? "none" : "auto",
                      transition: "all 0.65s cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                  >
                    {/* Hero image */}
                    <div
                      style={{
                        position: "relative",
                        height: 200,
                        background: "#D9D5CC",
                      }}
                    >
                      <Image
                        src={card.img}
                        alt={card.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="340px"
                      />
                      {/* Tag overlay */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          background: "rgba(26,26,31,0.82)",
                          backdropFilter: "blur(6px)",
                          borderRadius: 8,
                          padding: "4px 10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: C.goldLight,
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {card.tag}
                        </span>
                      </div>
                    </div>
                    {/* Card text */}
                    <div style={{ padding: "14px 16px" }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: C.text,
                          marginBottom: 3,
                        }}
                      >
                        {card.name}
                      </p>
                      <p style={{ fontSize: 12, color: C.textMuted }}>
                        {card.location}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: C.gold,
                          fontFamily: "'DM Mono', monospace",
                          marginTop: 6,
                        }}
                      >
                        {card.price}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── Tier 1: Advisor banner ──────────────────────────────── */}
      {showBanner && (
        <div
          style={{
            background: "#1A1A1F",
            borderBottom: "1px solid rgba(176,141,87,0.2)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            position: "relative",
          }}
        >
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              color: "rgba(255,255,255,0.75)",
              margin: 0,
              textAlign: "center",
            }}
          >
            Not sure where to start?{" "}
            <span style={{ color: "rgba(255,255,255,0.45)" }}>
              Describe your budget, city, or lifestyle and our advisor will match you to the right projects.
            </span>
          </p>
          <button
            onClick={() => openAdvisor("I'm not sure where to start. Can you help me find the right property?")}
            style={{
              flexShrink: 0,
              background: C.gold,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "7px 18px",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Ask the Advisor →
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem(BANNER_KEY, "1");
              setShowBanner(false);
            }}
            aria-label="Dismiss banner"
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "4px 6px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Search results ──────────────────────────────────────── */}
      {(searchLoading || searchResults !== null || searchError) && (
        <section ref={searchResultsRef} style={{ background: C.bgWarm, borderTop: `1px solid ${C.border}`, padding: "40px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            {searchLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.textMuted, fontFamily: "'Outfit', sans-serif", fontSize: 15 }}>
                <span style={{ display: "inline-block", width: 18, height: 18, border: `2px solid ${C.gold}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Searching…
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {searchError && (
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, color: C.textMuted }}>
                {searchError}{" "}
                <button onClick={() => window.dispatchEvent(new CustomEvent("westside:openAdvisor", { detail: { message: searchQuery } }))} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontSize: 14, padding: 0 }}>
                  Ask our advisor →
                </button>
              </p>
            )}
            {searchResults && searchResults.length > 0 && (
              <>
                {/* Expert summary paragraph */}
                {searchOverviewLoading && !searchOverview && (
                  <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[95, 75, 50].map((w) => (
                      <div key={w} style={{ height: 13, width: `${w}%`, borderRadius: 6, background: C.border, animation: "pulse 1.5s ease-in-out infinite" }} />
                    ))}
                    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                  </div>
                )}
                {searchOverview && (
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, lineHeight: 1.7, color: C.text, marginBottom: 28, maxWidth: 720 }}>
                    {searchOverview}
                  </p>
                )}

                {/* Result count */}
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.textMuted, marginBottom: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {searchResults.length} project{searchResults.length !== 1 ? "s" : ""} found
                </p>

                {/* Google-style project list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {searchResults.map((p: any, idx: number) => {
                    const citySlug = p.city?.url_slug ?? p.city_slug ?? "hyderabad";
                    const microMarketName = typeof p.micro_market === "string"
                      ? p.micro_market
                      : p.micro_market?.micro_market_name ?? null;
                    const developerName = p.developer_brand ?? p.developer?.developer_name ?? null;
                    const status = p.completion_status || p.status || null;
                    const metaParts = [microMarketName, developerName].filter(Boolean);
                    return (
                      <div
                        key={p.url_slug ?? p.id}
                        style={{
                          padding: "14px 0",
                          borderBottom: idx < searchResults.length - 1 ? `1px solid ${C.border}` : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                          <Link
                            href={buildProjectUrl(citySlug, p.url_slug)}
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 16,
                              fontWeight: 600,
                              color: C.gold,
                              textDecoration: "none",
                              borderBottom: `1px solid transparent`,
                              transition: "border-color 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = C.gold)}
                            onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
                          >
                            {p.project_name}
                          </Link>
                          {status && (
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, background: C.bgWarm, color: C.textMuted, padding: "2px 8px", borderRadius: 100, border: `1px solid ${C.border}` }}>
                              {status}
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: C.textMuted, marginTop: 3 }}>
                          {metaParts.join(" · ")}
                          {p.price_range_text && (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.gold, marginLeft: metaParts.length ? 10 : 0 }}>
                              {p.price_range_text}
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────── */}
      {/* 3. STATS BAR                                            */}
      {/* ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: C.bgWarm,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          padding: "40px 24px",
        }}
      >
        <div
          className="hr-stats-flex"
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "32px 24px",
          }}
        >
          {STATS.map((s) => (
            <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} />
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 4. MARKET INTELLIGENCE                                  */}
      {/* ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "76px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.gold,
                marginBottom: 12,
              }}
            >
              Market Intelligence
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(28px, 3.2vw, 42px)",
                fontWeight: 600,
                color: C.text,
              }}
            >
              Where opportunity meets conviction.
            </h2>
          </div>

          <div
            className="hr-mkt-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
            }}
          >
            {MARKETS.map((m) => (
              <Link
                key={m.name}
                href={m.href}
                style={{ textDecoration: "none" }}
                className="hr-card"
              >
                <div
                  style={{
                    background: C.bgCard,
                    borderRadius: 20,
                    border: `1px solid ${C.border}`,
                    padding: "28px 26px",
                    height: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Name + tag */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 24,
                        fontWeight: 600,
                        color: C.text,
                        margin: 0,
                      }}
                    >
                      {m.name}
                    </h3>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: m.tagColor,
                        background: m.tagBg,
                        border: `1px solid ${m.tagColor}55`,
                        borderRadius: 100,
                        padding: "4px 10px",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.tag}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.68,
                      color: C.textMuted,
                      marginBottom: 24,
                    }}
                  >
                    {m.desc}
                  </p>

                  {/* 2×2 data grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "14px 16px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: C.textMuted,
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Avg Price
                      </p>
                      <p
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 15,
                          fontWeight: 500,
                          color: C.text,
                        }}
                      >
                        {m.avgPrice}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: C.textMuted,
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        YoY Growth
                      </p>
                      <p
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 15,
                          fontWeight: 500,
                          color: m.yoyColor,
                        }}
                      >
                        {m.yoy}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: C.textMuted,
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Projects
                      </p>
                      <p
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 15,
                          fontWeight: 500,
                          color: C.text,
                        }}
                      >
                        {m.projects}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: C.textMuted,
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Velocity
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: "rgba(0,0,0,0.07)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${m.velocity}%`,
                              height: "100%",
                              background: m.tagColor,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: "'DM Mono', monospace",
                            color: C.text,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.velocity}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p
            style={{
              fontSize: 13,
              color: C.textMuted,
              fontStyle: "italic",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Expanding to Gachibowli, Tellapur, Narsingi, Jubilee Hills, Banjara Hills and more — updated weekly.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 5. FEATURED PROJECTS                                    */}
      {/* ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.bgWarm, padding: "76px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 40,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.gold,
                  marginBottom: 10,
                }}
              >
                Curated Projects
              </p>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(26px, 2.8vw, 38px)",
                  fontWeight: 600,
                  color: C.text,
                  margin: 0,
                }}
              >
                Projects worth your attention
              </h2>
            </div>
            <Link
              href="/hyderabad/projects"
              style={{
                fontSize: 14,
                color: C.gold,
                textDecoration: "none",
                border: `1px solid ${C.gold}`,
                borderRadius: 100,
                padding: "9px 22px",
                fontFamily: "'Outfit', sans-serif",
                whiteSpace: "nowrap",
                transition: "background 0.18s",
              }}
            >
              Browse all projects →
            </Link>
          </div>

          {/* 3×2 grid */}
          <div
            className="hr-proj-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {FEATURED_PROJECTS.map((p) => (
              <Link
                key={p.name}
                href={`/hyderabad/projects/${p.slug}`}
                style={{ textDecoration: "none" }}
                className="hr-card"
              >
                <div
                  style={{
                    background: C.bgCard,
                    borderRadius: 18,
                    border: `1px solid ${C.border}`,
                    overflow: "hidden",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Image / gradient area */}
                  <div
                    style={{
                      position: "relative",
                      height: 190,
                      background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`,
                      flexShrink: 0,
                    }}
                  >
                    {p.img && (
                      <Image
                        src={p.img}
                        alt={p.name}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 380px"
                      />
                    )}

                    {/* Status badge — top-left */}
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "rgba(26,26,31,0.78)",
                        backdropFilter: "blur(5px)",
                        borderRadius: 6,
                        padding: "3px 9px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: "#fff",
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                        }}
                      >
                        RERA VERIFIED
                      </span>
                    </div>

                    {/* Appreciation — top-right */}
                    {p.appreciation && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "rgba(45,106,79,0.92)",
                          borderRadius: 6,
                          padding: "3px 9px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#fff",
                            fontFamily: "'DM Mono', monospace",
                            fontWeight: 500,
                          }}
                        >
                          {p.appreciation}
                        </span>
                      </div>
                    )}

                    {/* Highlight tag — bottom-left */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 10,
                        left: 10,
                        background: "rgba(26,26,31,0.82)",
                        backdropFilter: "blur(6px)",
                        borderRadius: 8,
                        padding: "4px 10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: C.goldLight,
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {p.tag}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div
                    style={{
                      padding: "16px 18px 18px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: C.textMuted,
                        marginBottom: 7,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {p.location} · {p.config}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: C.text,
                          margin: 0,
                        }}
                      >
                        {p.name}
                      </p>
                      <span
                        style={{
                          color: C.gold,
                          fontSize: 18,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        →
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 13,
                        color: C.gold,
                        marginTop: 7,
                      }}
                    >
                      {p.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 6. AI ADVISOR CTA                                       */}
      {/* ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "76px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div
            className="hr-cta-grid"
            style={{
              background: C.bgDark,
              borderRadius: 28,
              padding: "52px 52px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 52,
              alignItems: "center",
            }}
          >
            {/* Left copy */}
            <div>
              {/* Live badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(45,106,79,0.18)",
                  border: "1px solid rgba(45,106,79,0.38)",
                  borderRadius: 100,
                  padding: "6px 14px",
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#4ADE80",
                    display: "inline-block",
                    boxShadow: "0 0 8px rgba(74,222,128,0.6)",
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "#4ADE80",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}
                >
                  AI Advisor · Live
                </span>
              </div>

              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(26px, 2.8vw, 40px)",
                  fontWeight: 600,
                  color: "#F0EDE6",
                  lineHeight: 1.22,
                  marginBottom: 18,
                }}
              >
                Ask anything about Hyderabad &amp; Goa real estate
              </h2>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.72,
                  color: "#8A8A8E",
                  marginBottom: 32,
                }}
              >
                19 Hyderabad micro-markets and 6 Goa beach markets — mapped
                with pricing, appreciation, rental yields, and buyer
                intelligence. Get instant answers, any time.
              </p>

              {/* Sample question chips */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  marginBottom: 32,
                }}
              >
                {[
                  "4BHK under 8 Cr in Kokapet",
                  "FD vs Kokapet?",
                  "Rental yields in Calangute Goa?",
                  "Best area to invest in Goa under 2 Cr?",
                ].map((q) => (
                  <div
                    key={q}
                    role="button"
                    tabIndex={0}
                    onClick={() => window.dispatchEvent(new CustomEvent("westside:openAdvisor", { detail: { message: q } }))}
                    onKeyDown={(e) => e.key === "Enter" && window.dispatchEvent(new CustomEvent("westside:openAdvisor", { detail: { message: q } }))}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "9px 14px",
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(176,141,87,0.12)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(176,141,87,0.4)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#9A9A9E",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      "{q}"
                    </span>
                  </div>
                ))}
              </div>

              <button
                style={{
                  padding: "13px 28px",
                  background: C.gold,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: "0.02em",
                  transition: "opacity 0.18s",
                }}
                onClick={() => window.dispatchEvent(new CustomEvent("westside:openAdvisor", { detail: {} }))}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
              >
                Start a Conversation →
              </button>
            </div>

            {/* Right — chat mockup */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Chat header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingBottom: 14,
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: C.gold,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}
                  >
                    AI
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#F0EDE6",
                      margin: 0,
                    }}
                  >
                    Westside AI Advisor
                  </p>
                  <p style={{ fontSize: 11, color: "#4ADE80", margin: 0 }}>
                    ● Hyderabad &amp; Goa specialist
                  </p>
                </div>
              </div>

              {/* Messages */}
              {CHAT_PREVIEW.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "86%",
                      padding: "10px 14px",
                      borderRadius:
                        msg.role === "user"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                      background:
                        msg.role === "user"
                          ? C.gold
                          : "rgba(255,255,255,0.07)",
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: msg.role === "user" ? "#fff" : "#CCC9C1",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "16px 16px 16px 4px",
                    background: "rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span className="hr-dot" />
                  <span className="hr-dot" />
                  <span className="hr-dot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 7. WHY WESTSIDE                                         */}
      {/* ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.bgWarm, padding: "76px 24px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.gold,
                marginBottom: 14,
              }}
            >
              Why Westside
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(26px, 3vw, 42px)",
                fontWeight: 600,
                color: C.text,
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              Not a portal. Not a broker.
            </h2>
            <p
              style={{
                fontSize: 18,
                color: C.textMuted,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: "italic",
              }}
            >
              A real estate intelligence firm.
            </p>
          </div>

          <div
            className="hr-why-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="hr-card"
                style={{
                  background: C.bgCard,
                  borderRadius: 20,
                  border: `1px solid ${C.border}`,
                  padding: "36px 28px",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 20,
                    color: C.gold,
                    lineHeight: 1,
                  }}
                >
                  {p.icon}
                </div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 12,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{ fontSize: 14, lineHeight: 1.72, color: C.textMuted }}
                >
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────── */}
      {/* 8. FINAL CTA                                            */}
      {/* ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: C.bg,
          padding: "92px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(28px, 3.2vw, 46px)",
              fontWeight: 600,
              color: C.text,
              lineHeight: 1.22,
              marginBottom: 18,
            }}
          >
            Stop browsing portals.
            <br />
            Start making informed decisions.
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: C.textMuted,
              marginBottom: 44,
              maxWidth: 520,
              margin: "0 auto 44px",
            }}
          >
            Our advisors have walked every corridor in Hyderabad. Get an
            honest, data-backed assessment — no obligation.
          </p>

          <div
            className="hr-cta-btns"
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 36,
            }}
          >
            <Link
              href="/contact"
              style={{
                padding: "15px 32px",
                background: C.bgDark,
                borderRadius: 14,
                color: "#fff",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                transition: "opacity 0.18s",
              }}
            >
              Get Expert Advice — Free
            </Link>
            <Link
              href="/hyderabad/projects"
              style={{
                padding: "15px 32px",
                background: "transparent",
                borderRadius: 14,
                border: `1.5px solid ${C.border}`,
                color: C.text,
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                transition: "border-color 0.18s, color 0.18s",
              }}
            >
              Browse All Projects
            </Link>
          </div>

          {/* Trust signals */}
          <div
            style={{
              display: "flex",
              gap: 28,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {["Free", "No obligation", "RERA experts", "Hyderabad & Goa specialists"].map(
              (t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 13,
                    color: C.textMuted,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ color: C.accent, fontWeight: 700 }}>✓</span>
                  {t}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Tier 2: Intent popup ────────────────────────────────── */}
      {showPopup && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowPopup(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 9998,
              backdropFilter: "blur(2px)",
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: "fixed",
              zIndex: 9999,
              bottom: 0,
              left: 0,
              right: 0,
              margin: "0 auto",
              maxWidth: 460,
              background: "#FAFAF7",
              borderRadius: "20px 20px 0 0",
              padding: "32px 28px 36px",
              boxShadow: "0 -8px 48px rgba(0,0,0,0.18)",
            }}
            // Prevent backdrop click from closing when clicking inside modal
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)", margin: "0 auto 24px" }} />

            {/* Dismiss */}
            <button
              onClick={() => setShowPopup(false)}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 18,
                right: 20,
                background: "none",
                border: "none",
                fontSize: 20,
                color: "rgba(0,0,0,0.3)",
                cursor: "pointer",
                lineHeight: 1,
                padding: "4px 6px",
              }}
            >
              ×
            </button>

            {/* Heading */}
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: C.gold,
                margin: "0 0 10px",
              }}
            >
              Westside Advisor
            </p>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 26,
                fontWeight: 600,
                color: C.text,
                margin: "0 0 8px",
                lineHeight: 1.25,
              }}
            >
              What brings you here today?
            </h3>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                color: C.textMuted,
                margin: "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              Our AI advisor gives you personalised guidance — prices, projects, investment outlook — in seconds.
            </p>

            {/* Intent chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                {
                  label: "🏙️  Looking to buy in Hyderabad",
                  message: "I'm looking to buy a property in Hyderabad. Can you help me find the right project?",
                },
                {
                  label: "🌴  Exploring Goa villas",
                  message: "I'm interested in villa investment in Goa. Where should I look?",
                },
                {
                  label: "📊  Just researching the market",
                  message: "I'm researching the real estate market. Can you give me an overview of current prices and investment opportunities?",
                },
              ].map(({ label, message }) => (
                <button
                  key={label}
                  onClick={() => {
                    setShowPopup(false);
                    openAdvisor(message);
                  }}
                  style={{
                    background: "#fff",
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 15,
                    color: C.text,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold;
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 12px rgba(176,141,87,0.15)`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                color: C.textMuted,
                textAlign: "center",
                marginTop: 18,
              }}
            >
              Or type your own question after opening the advisor
            </p>
          </div>
        </>
      )}
    </div>
  );
}
