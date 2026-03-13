"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Check, ChevronRight, Home, ChevronDown } from "lucide-react";
import type { ProjectWithRelations } from "@/services/projectService";
import type { ProjectInsights } from "@/services/projectInsightsService";
import type { ProjectPageContext } from "@/services/projectService";
import { computeProjectStatus } from "@/lib/project-utils";
import { submitLead } from "@/app/actions/submit-lead";
import { optimizeSupabaseImage, getHeroImageUrl } from "@/utils/imageOptimization";
import { buildProjectUrl } from "@/lib/routes";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

// ─── Font import (Playfair Display via Google Fonts inline style) ─────────────
const PLAYFAIR_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`;

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  heroBg: "#0a0f1e",
  heroOverlay: "linear-gradient(to top, #0a0f1e 0%, #0a0f1e 40%, rgba(10,15,30,0.7) 70%, transparent 100%)",
  factsStrip: "#1a2235",
  darkSection: "#0d1424",
  lightSection: "#ffffff",
  altSection: "#f8fafc",
  positive: "#22c55e",
  warning: "#f59e0b",
  risk: "#ef4444",
};

// ─── Shared internal components ───────────────────────────────────────────────

function ReraBadge({ dark = false }: { dark?: boolean }) {
  if (dark) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] border"
        style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd", borderColor: "rgba(147,197,253,0.25)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
        RERA Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] bg-blue-50 text-blue-700 border border-blue-200">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
      RERA Verified
    </span>
  );
}

function AiBadge({ dark = false, label = "AI Analysis" }: { dark?: boolean; label?: string }) {
  if (dark) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] border"
        style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", borderColor: "rgba(196,181,253,0.25)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] bg-violet-50 text-violet-700 border border-violet-200">
      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
      {label}
    </span>
  );
}

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={open}>
        <span className="text-sm font-medium text-gray-900 pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

function InlineLeadForm({
  projectName, projectId, reraId, locationPreference, dark = true,
}: {
  projectName: string;
  projectId: string;
  reraId?: string | null;
  locationPreference?: string;
  dark?: boolean;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      await submitLead({
        name,
        phone,
        type: "PROJECT_INTEREST",
        source_page: typeof window !== "undefined" ? window.location.href : "project_page_v2",
        details: {
          source_id: "c3b72f38-171b-4ce6-a060-f40beed8bdb4",
          project_name: projectName,
          project_id: projectId,
          notes: `Enquiry for ${projectName}${reraId ? ` (RERA: ${reraId})` : ""}`,
          location_preference: locationPreference || "",
        },
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = dark
    ? "flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/40 text-sm border border-white/15 focus:outline-none focus:border-blue-400"
    : "flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 text-sm border border-gray-200 focus:outline-none focus:border-blue-400";

  if (submitted) {
    return (
      <div className="flex items-center justify-center py-2">
        <p className={`font-semibold text-sm ${dark ? "text-green-400" : "text-green-600"}`}>
          ✓ Got it! We&apos;ll call you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required className={inputCls} />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" required type="tel" className={inputCls} />
      <button type="submit" disabled={submitting}
        className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex-shrink-0 disabled:opacity-60">
        {submitting ? "..." : "Call Me"}
      </button>
    </form>
  );
}

function CountUp({ target, suffix = "", duration = 1500 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [started, target, duration]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// min_area / max_area are already stored as sqft by projectService (toSqft applied)
const fmtArea = (sqft: number) => Math.round(sqft).toLocaleString("en-IN");

const toRad = (d: number) => (d * Math.PI) / 180;
const distanceInKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const LANDMARKS = [
  { label: "Financial District", lat: 17.4186, lng: 78.3426 },
  { label: "Gachibowli", lat: 17.4401, lng: 78.3489 },
  { label: "RGIA Airport", lat: 17.2403, lng: 78.4294 },
];

const ORR_EXITS = [
  { label: "ORR Exit — Patancheru", lat: 17.5365, lng: 78.2158 },
  { label: "ORR Exit — Gandimaisamma", lat: 17.5574, lng: 78.2862 },
  { label: "ORR Exit — Miyapur", lat: 17.4978, lng: 78.3267 },
  { label: "ORR Exit — KPHB", lat: 17.4717, lng: 78.3709 },
  { label: "ORR Exit — Gachibowli", lat: 17.4342, lng: 78.3568 },
  { label: "ORR Exit — Narsingi", lat: 17.3922, lng: 78.3702 },
  { label: "ORR Exit — Rajendranagar", lat: 17.3254, lng: 78.3912 },
  { label: "ORR Exit — Shamshabad", lat: 17.2507, lng: 78.4082 },
  { label: "ORR Exit — Hayathnagar", lat: 17.3234, lng: 78.5872 },
  { label: "ORR Exit — LB Nagar", lat: 17.3484, lng: 78.5487 },
  { label: "ORR Exit — Uppal", lat: 17.4052, lng: 78.5589 },
  { label: "ORR Exit — Ghatkesar", lat: 17.4482, lng: 78.5742 },
  { label: "ORR Exit — Kompally", lat: 17.5507, lng: 78.4527 },
  { label: "ORR Exit — Medchal", lat: 17.6274, lng: 78.4537 },
];

function nearestOrrExit(lat: number, lng: number): { label: string; dist: number } {
  let best = ORR_EXITS[0];
  let bestDist = distanceInKm(lat, lng, best.lat, best.lng);
  for (const exit of ORR_EXITS.slice(1)) {
    const d = distanceInKm(lat, lng, exit.lat, exit.lng);
    if (d < bestDist) { best = exit; bestDist = d; }
  }
  return { label: best.label, dist: bestDist };
}

// ─── Goa Google Map with Places API nearby search ─────────────────────────────
// Must be a stable reference outside the component to avoid reloading the API.
const GOA_MAP_LIBS: ("places")[] = ["places"];

const GOA_MAP_CATEGORIES = [
  { type: "beach",        emoji: "🏖️" },
  { type: "school",       emoji: "🏫" },
  { type: "hospital",     emoji: "🏥" },
  { type: "supermarket",  emoji: "🛒" },
  { type: "restaurant",   emoji: "🍽️" },
] as const;

interface GoaNearbyPlace { name: string; emoji: string; distKm: number; }

function GoaGoogleMap({ lat, lng, projectName }: { lat: number; lng: number; projectName: string }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded } = useJsApiLoader({ id: "westside-gmap", googleMapsApiKey: apiKey, libraries: GOA_MAP_LIBS });
  const [nearby, setNearby] = useState<GoaNearbyPlace[]>([]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    const gp = (window as any).google?.maps?.places;
    if (!gp) return;
    const svc = new gp.PlacesService(map);
    const center = new google.maps.LatLng(lat, lng);
    const results: GoaNearbyPlace[] = [];
    let pending = GOA_MAP_CATEGORIES.length;

    GOA_MAP_CATEGORIES.forEach(({ type, emoji }) => {
      svc.nearbySearch(
        { location: center, radius: 3000, type },
        (places: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === gp.PlacesServiceStatus.OK && places?.length) {
            const top = places[0];
            const loc = top.geometry?.location;
            if (loc) {
              results.push({
                name: top.name ?? type,
                emoji,
                distKm: distanceInKm(lat, lng, loc.lat(), loc.lng()),
              });
            }
          }
          pending--;
          if (pending === 0) setNearby([...results].sort((a, b) => a.distKm - b.distKm));
        }
      );
    });
  }, [lat, lng]);

  if (!isLoaded) {
    return <div className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: 400 }} />;
  }

  return (
    <div>
      <div className="rounded-2xl overflow-hidden" style={{ height: 400 }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={{ lat, lng }}
          zoom={14}
          mapTypeId="hybrid"
          options={{
            streetViewControl: false,
            zoomControl: true,
            fullscreenControl: true,
            mapTypeControl: false,
            rotateControl: false,
          }}
          onLoad={onMapLoad}
        >
          <Marker position={{ lat, lng }} title={projectName} />
        </GoogleMap>
      </div>
      {nearby.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📍 Nearby Places</p>
          <ul className="space-y-1.5">
            {nearby.map((p) => (
              <li key={p.emoji} className="flex items-center gap-2.5 py-2 px-4 rounded-xl bg-gray-50">
                <span className="text-base flex-shrink-0">{p.emoji}</span>
                <span className="text-sm text-gray-700 flex-1">{p.name}</span>
                <span className="text-xs font-semibold text-gray-500">{p.distKm.toFixed(1)} km</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// ─── Expert Analysis Modal ────────────────────────────────────────────────────

function ExpertModal({ projectName, projectId, developerName, onClose }: {
  projectName: string; projectId: string; developerName?: string; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("buy");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    try {
      const result = await submitLead({
        name,
        phone,
        email: email || null,
        type: "PROJECT_INTEREST",
        source_page: typeof window !== "undefined" ? window.location.href : "project_page_v2_expert",
        details: { project_name: projectName, project_id: projectId, developer_name: developerName, goal },
      });
      if (!result.success) {
        setErrorMsg(result.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goals = [
    { value: "buy", label: "Looking to buy" },
    { value: "invest", label: "Checking investment potential" },
    { value: "compare", label: "Comparing options" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis on its way</h3>
            <p className="text-gray-500 text-sm">Our advisor will call you on {phone} within 24 hours.</p>
            <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl bg-gray-900 text-white font-medium text-sm">Close</button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Get Expert Analysis</h3>
            <p className="text-sm text-gray-500 mb-5">For {projectName} — free, no obligation</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div>
                <p className="text-xs text-gray-500 mb-2.5 font-medium uppercase tracking-wide">What are you looking to do?</p>
                <div className="space-y-2">
                  {goals.map(g => (
                    <label key={g.value} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <input type="radio" name="goal" value={g.value} checked={goal === g.value}
                        onChange={() => setGoal(g.value)} className="accent-indigo-600" />
                      <span className="text-sm text-gray-700">{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
              <button type="submit" disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm disabled:opacity-60 hover:bg-indigo-700 transition-colors">
                {submitting ? "Submitting…" : "Get Expert Analysis"}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">Free · No obligation · RERA experts</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LiveIntelligence {
  actual_status?: string | null;
  handover_started?: boolean | null;
  handover_notes?: string | null;
  towers_completed?: number | null;
  towers_total?: number | null;
  developer_price_min?: number | null;
  developer_price_max?: number | null;
  resale_price_min?: number | null;
  resale_price_max?: number | null;
  price_trend?: "rising" | "stable" | "falling" | "declining" | null;
  forum_sentiment?: "positive" | "neutral" | "mixed" | "negative" | null;
  key_updates?: string[] | null;
  buyer_concerns?: string[] | null;
  sources?: string[] | null;
  confidence?: "high" | "medium" | "low" | null;
  scraped_at?: string | null;
  enriched_at?: string | null;
}

interface ProjectPageV2Props {
  project: ProjectWithRelations;
  insights: ProjectInsights;
  context: ProjectPageContext;
  citySlug: string;
  projectSlug: string;
  developerProjects: Array<{
    project_name: string;
    rera_id?: string | null;
    current_status?: string | null;
    proposed_completion_date?: string | null;
    url_slug?: string | null;
    city_slug?: string | null;
  }>;
  liveIntelligence?: LiveIntelligence | null;
  microMarketDetail?: { top_schools?: any[] | null; top_hospitals?: any[] | null } | null;
  relatedProjects?: Array<{
    project_name: string;
    url_slug?: string | null;
    city?: { url_slug?: string | null } | Array<{ url_slug?: string | null }> | null;
    configuration_display?: string | null;
    total_units?: number | null;
    current_status?: string | null;
    price_range_text?: string | null;
  }>;
  nearbyMarkets?: Array<{ micro_market_name: string; url_slug: string }>;
  configDistribution?: Array<{
    unit_category?: string | null;
    total_units?: number | null;
    config_percent?: number | null;
  }>;
  otherProjectsInMarket?: Array<{
    project_name: string;
    url_slug?: string | null;
    developer_name?: string | null;
    total_units?: number | null;
    proposed_completion_date?: string | null;
    city_slug?: string | null;
  }>;
  developerBrandSlug?: string | null;
  developerBrandName?: string | null;
}

// ─── Handover notes parser ────────────────────────────────────────────────────

const PORTAL_NAMES = ["Square Yards", "99acres", "MagicBricks", "Housing.com", "NoBroker",
  "CommonFloor", "PropTiger", "MouthShut", "IndianRealEstate", "real estate board",
  "squareyards", "magicbricks", "nobroker", "proptigers", "99 acres"];

function parseHandoverBullets(raw: string): string[] {
  let cleaned = raw;
  // Remove sentences that mention portals
  for (const p of PORTAL_NAMES) {
    cleaned = cleaned.replace(new RegExp(`[^.]*${p}[^.]*\\.\\s*`, "gi"), "");
  }
  // Split by sentence boundaries or explicit bullets
  const parts = cleaned
    .split(/(?:\.\s+|\n+|•\s*)/)
    .map(s => s.replace(/^[-–•*]\s*/, "").trim())
    .filter(s => s.length > 20 && !/^(source|per|via|as per|according)/i.test(s));
  return parts.slice(0, 3);
}

// ─── Individual developer detector ───────────────────────────────────────────

const COMPANY_KEYWORDS = /pvt|ltd|llp|limited|group|developer|builders?|constructions?|infra|realty|properties|real\s*estate|corp|projects|ventures|housing|homes|spaces|estates|associates/i;

function isIndividualDeveloper(name: string | null | undefined): boolean {
  if (!name) return false;
  return !COMPANY_KEYWORDS.test(name);
}

// ─── Developer slug generator ────────────────────────────────────────────────

function developerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+private\s+limited/gi, "")
    .replace(/\s+pvt\.?\s*ltd\.?/gi, "")
    .replace(/\s+limited/gi, "")
    .replace(/\s+ltd\.?/gi, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Clean malformed JSON arrays ─────────────────────────────────────────────

function cleanArray(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map(s => String(s).replace(/^["'\\]+|["'\\]+$/g, "").trim())
      .filter(Boolean);
  }
  return [];
}

// ─── Amenity icon map ─────────────────────────────────────────────────────────

const AMENITY_ICONS: [string, string][] = [
  ["swimming pool", "🏊"], ["pool", "🏊"],
  ["gym", "💪"], ["fitness", "💪"],
  ["clubhouse", "🏛️"], ["club house", "🏛️"],
  ["garden", "🌿"], ["landscap", "🌿"], ["park", "🌿"],
  ["security", "🔒"], ["cctv", "📹"],
  ["parking", "🚗"], ["car park", "🚗"],
  ["power backup", "⚡"], ["generator", "⚡"],
  ["children", "🧒"], ["kids", "🧒"], ["play area", "🧒"],
  ["jogging", "🏃"], ["walking track", "🏃"], ["cycling", "🚴"],
  ["tennis", "🎾"], ["basketball", "🏀"], ["badminton", "🏸"],
  ["amphitheater", "🎭"], ["amphitheatre", "🎭"],
  ["library", "📚"], ["reading", "📚"],
  ["meditation", "🧘"], ["yoga", "🧘"],
  ["spa", "🧖"], ["sauna", "🧖"],
  ["wi-fi", "📶"], ["wifi", "📶"], ["internet", "📶"],
  ["guest", "🛎️"], ["party hall", "🎉"], ["banquet", "🎉"],
  ["lift", "🛗"], ["elevator", "🛗"],
  ["solar", "☀️"], ["rain water", "🌧️"], ["waste", "♻️"],
  ["sports", "⚽"],
];

function getAmenityIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of AMENITY_ICONS) {
    if (lower.includes(key)) return icon;
  }
  return "✓";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectPageV2({ project, insights, context, citySlug, projectSlug, developerProjects, liveIntelligence, microMarketDetail, relatedProjects = [], nearbyMarkets = [], configDistribution = [], otherProjectsInMarket = [], developerBrandSlug, developerBrandName }: ProjectPageV2Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reraCopied, setReraCopied] = useState(false);

  const copyRera = useCallback(async () => {
    if (!project.rera_id) return;
    await navigator.clipboard.writeText(project.rera_id);
    setReraCopied(true);
    setTimeout(() => setReraCopied(false), 2000);
  }, [project.rera_id]);

  const heroImageUrl = (() => {
    const raw = project.hero_image_url || project.main_image_url || null;
    if (!raw) return null;
    try {
      const base = getHeroImageUrl(raw);
      if (!base) return null;
      return optimizeSupabaseImage(base, { width: 1600, height: 900, quality: 85, format: "webp" });
    } catch {
      return null;
    }
  })();

  const microMarket = project.micro_market ?? null;
  const developer = project.developer ?? null;
  const stageRiskScore = insights.stageRisk?.score ?? 50;

  return (
    <>
      <style>{PLAYFAIR_IMPORT}</style>

      {/* ── 1. CINEMATIC HERO ─────────────────────────────────────────────── */}
      <section data-section="hero" className="relative flex flex-col" style={{ background: T.heroBg, overflow: "hidden" }}>
        {/* Background image */}
        {heroImageUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 scale-[1.02] animate-hero-zoom">
              <Image src={heroImageUrl} alt={project.project_name} fill className="object-cover object-center" priority sizes="100vw" />
            </div>
            <div className="absolute inset-0" style={{ background: T.heroOverlay }} />
          </div>
        )}
        {!heroImageUrl && (
          <div className="absolute inset-0" style={{
            background: `${T.heroBg} url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e293b' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        )}

        {/* Content — sits at bottom */}
        <div className="relative z-10 container mx-auto px-4 pt-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-end">
            {/* Left: Project info */}
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-4 flex-wrap">
                <Link href="/" className="hover:text-white/80 flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/${citySlug}`} className="hover:text-white/80 capitalize">{citySlug}</Link>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/${citySlug}/projects`} className="hover:text-white/80">Projects</Link>
                {microMarket?.micro_market_name && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    {(microMarket as any).url_slug ? (
                      <Link href={`/${citySlug}/${(microMarket as any).url_slug}`} className="hover:text-white/80">{microMarket.micro_market_name}</Link>
                    ) : (
                      <span className="text-white/60">{microMarket.micro_market_name}</span>
                    )}
                  </>
                )}
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/80 truncate max-w-[200px]">{project.project_name}</span>
              </nav>

              {/* RERA badge + project type badge */}
              <div className="flex items-center gap-2 mb-3">
                {project.rera_id && <ReraBadge dark />}
                {(() => {
                  // For Goa: read property_types from projects table; for other cities: use project_type from MV
                  const ptArr = citySlug === 'goa' ? cleanArray((project as any).property_types) : [];
                  const rawType = ptArr[0] || project.project_type || "";
                  const type = rawType.toLowerCase();
                  let typeLabel: string | null = null;
                  let typeColor: string | null = null;
                  if (type.includes("mixed") || type.includes("mix")) {
                    typeLabel = "Mixed Use"; typeColor = "#a78bfa";
                  } else if (type.includes("commercial")) {
                    typeLabel = "Commercial"; typeColor = "#60a5fa";
                  } else if (type.includes("plotted")) {
                    typeLabel = "Plotted"; typeColor = "#fbbf24";
                  } else if (type.includes("villa") || type.includes("row house") || type.includes("rowhouse")) {
                    typeLabel = "Villa"; typeColor = "#fb923c";
                  } else if (rawType) {
                    typeLabel = "Apartment"; typeColor = "#4ade80";
                  }
                  if (!typeLabel) return null;
                  return (
                    <span style={{ color: typeColor ?? undefined, borderColor: `${typeColor}40` }}
                      className="text-[11px] font-semibold uppercase tracking-wider border rounded-full px-2.5 py-0.5">
                      {typeLabel}
                    </span>
                  );
                })()}
              </div>

              {/* Project name */}
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900, color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.02em" }}
                className="mb-3">
                {project.project_name}
              </h1>

              {/* One-liner / BHK line */}
              <p className="text-white/70 text-base mb-5 max-w-xl">
                {citySlug === 'goa' ? (() => {
                  const configsArr = cleanArray((project as any).configurations);
                  const bhkNums = [...new Set(
                    configsArr
                      .map((c: any) => { const m = String(c).match(/^(\d+)\s*BHK/i); return m ? parseInt(m[1]) : null; })
                      .filter((n: any): n is number => n !== null)
                  )].sort((a: number, b: number) => a - b);
                  if (bhkNums.length === 0) return null;
                  const ptArr = cleanArray((project as any).property_types);
                  const ptRaw = (ptArr[0] || project.project_type || "").toLowerCase();
                  const ptSuffix = ptRaw.includes("villa") ? "Villas" : "Apartments";
                  return `${bhkNums.join(", ")} BHK ${ptSuffix}${microMarket?.micro_market_name ? ` · ${microMarket.micro_market_name}` : ""}`;
                })() : [project.configuration_display, microMarket?.micro_market_name].filter(Boolean).join(" · ")}
              </p>

              {/* Fact pills */}
              <div className="flex flex-wrap gap-2">
                {project.total_units && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/15">
                    🏢 {project.total_units.toLocaleString()} Units
                  </span>
                )}
                {project.total_floors && project.total_floors > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/15">
                    🏬 {project.total_floors > 1 ? `G + ${project.total_floors - 1}` : "Ground Only"} Floors
                  </span>
                )}
                {project.current_status && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/15">
                    🏗 {project.current_status}
                  </span>
                )}
                {(() => {
                  // Goa: configurations[] from projects table; all cities: configDistribution fallback
                  const configsArr = citySlug === 'goa' ? cleanArray((project as any).configurations) : [];
                  const bhkFromConfigs = [...new Set(
                    configsArr.map(c => { const m = String(c).match(/^(\d+)\s*BHK/i); return m ? parseInt(m[1]) : null; })
                      .filter((n): n is number => n !== null)
                  )].sort((a, b) => a - b);

                  const bhkFromDist = [...new Set(
                    configDistribution
                      .map(r => { const m = (r.unit_category || "").match(/^(\d+)\s*BHK/i); return m ? parseInt(m[1]) : null; })
                      .filter((n): n is number => n !== null)
                  )].sort((a, b) => a - b);

                  const bhkNums = bhkFromConfigs.length > 0 ? bhkFromConfigs : bhkFromDist;
                  if (bhkNums.length === 0) return null;

                  // Goa: property_types from projects table; other cities: project_type from MV
                  const ptArr = citySlug === 'goa' ? cleanArray((project as any).property_types) : [];
                  const ptRaw = (ptArr[0] || project.project_type || "").toLowerCase();
                  const ptSuffix = ptRaw.includes("villa") ? " Villas" : " Apartments";

                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/15">
                      🏠 {bhkNums.join(", ")} BHK{ptSuffix}
                    </span>
                  );
                })()}
                {(() => {
                  const sizeRange = (project as any).unit_size_range as string | null;
                  if (sizeRange) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/15">
                        📐 {sizeRange}
                      </span>
                    );
                  }
                  if (project.min_area && project.max_area) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/15">
                        📐 {project.min_area === project.max_area
                          ? `${fmtArea(project.min_area)} sqft`
                          : `${fmtArea(project.min_area)}–${fmtArea(project.max_area)} sqft`}
                      </span>
                    );
                  }
                  return null;
                })()}
                {project.possession_date_text && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/90 border border-white/15">
                    📅 {formatDate(project.possession_date_text)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Glassmorphism card */}
            <div className="self-center rounded-2xl p-5 border border-white/15"
              style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.08)", WebkitBackdropFilter: "blur(12px)" }}>
              {/* Developer */}
              <div className="flex items-center gap-3 mb-4">
                {developer?.logo_url && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                    <Image src={developer.logo_url} alt={developer.developer_name} width={40} height={40} className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">Developer</p>
                  <p className="text-white font-semibold text-sm">
                    {isIndividualDeveloper(developerBrandName || developer?.developer_name || project.developer_name)
                      ? "Independent Developer"
                      : (developerBrandName || developer?.developer_name || project.developer_name || "—")}
                  </p>
                </div>
              </div>

              {/* RERA ID */}
              {project.rera_id && (
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">RERA ID</p>
                    <p className="text-blue-300 font-mono text-xs">{project.rera_id}</p>
                  </div>
                  <button onClick={copyRera} className="p-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
                    {reraCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                  </button>
                </div>
              )}

              {/* Price */}
              {project.price_range_text && (
                <div className="mb-4">
                  <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Starting Price</p>
                  <p className="text-white font-bold text-lg">{project.price_range_text}</p>
                </div>
              )}

              {/* Lead capture form — desktop sidebar */}
              <div className="mb-1">
                <p className="text-white/50 text-[10px] uppercase tracking-wider mb-2">Interested? Get free advice</p>
                <InlineLeadForm
                  projectName={project.project_name}
                  projectId={project.id || String((project as any).project_id || "")}
                  reraId={project.rera_id}
                  locationPreference={microMarket?.micro_market_name ? `${microMarket.micro_market_name}, ${citySlug}` : citySlug}
                  dark
                />
              </div>

              {/* Trust line */}
              <p className="text-white/40 text-[10px] text-center mt-3">
                1,200+ buyers advised · 12+ years in Hyderabad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. RERA FACTS STRIP ───────────────────────────────────────────── */}
      <section data-section="rera-facts" style={{ background: T.factsStrip }}>
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white/80 text-sm font-semibold uppercase tracking-wider">RERA-Registered Project Data</h2>
            <ReraBadge dark />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Total Units</p>
              <p className="text-white font-semibold text-xl">
                {project.total_units ? <CountUp target={project.total_units} /> : "—"}
              </p>
            </div>
            <div className="rounded-xl p-4 border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Total Towers</p>
              <p className="text-white font-semibold text-xl">
                {project.total_towers ? <CountUp target={project.total_towers} /> : "—"}
              </p>
            </div>
            {project.total_floors && project.total_floors > 0 && (
              <div className="rounded-xl p-4 border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Floors</p>
                <p className="text-white font-semibold text-xl">
                  {project.total_floors > 1 ? `G + ${project.total_floors - 1}` : "G"}
                </p>
              </div>
            )}
            {[
              {
                label: "Unit Sizes",
                value: (project as any).unit_size_range
                  || ((project.min_area && project.max_area)
                    ? (project.min_area === project.max_area
                        ? `${fmtArea(project.min_area)} sqft`
                        : `${fmtArea(project.min_area)}–${fmtArea(project.max_area)} sqft`)
                    : "Contact for details"),
              },
              {
                label: "Price",
                value: (project as any).price_display_string || project.price_range_text || "Contact for details",
              },
              project.configuration_display ? { label: "Configurations", value: project.configuration_display } : null,
              { label: "RERA Status", value: project.current_status ?? "Registered" },
            ].filter(Boolean).map(({ label, value }: any) => (
              <div key={label} className="rounded-xl p-4 border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2.1 PRICING ESTIMATE ─────────────────────────────────────────── */}
      {microMarket?.price_per_sqft_min && microMarket?.price_per_sqft_max && (() => {
        const priceMin = microMarket.price_per_sqft_min!;
        const priceMax = microMarket.price_per_sqft_max!;
        const appMin = microMarket.annual_appreciation_min ?? null;
        const avgSqft = project.min_area && project.max_area ? (project.min_area + project.max_area) / 2 : null;

        const fmtLakhCrore = (lakhs: number): string => {
          if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(lakhs >= 200 ? 1 : 2).replace(/\.?0+$/, "")} Cr`;
          return `₹${Math.round(lakhs)} L`;
        };

        return (
          <section data-section="pricing-estimate" className="py-10" style={{ background: T.altSection }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Pricing Estimate</h2>
                <p className="text-sm text-gray-400 mb-6">Based on {microMarket.micro_market_name} corridor data</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Price Range */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Price Range</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{priceMin.toLocaleString("en-IN")}–{priceMax.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">per sqft</p>
                  </div>

                  {/* Card 2: Estimated Unit Cost */}
                  {avgSqft && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Estimated Unit Cost</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {fmtLakhCrore(priceMin * avgSqft / 100000)} – {fmtLakhCrore(priceMax * avgSqft / 100000)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">avg unit size {Math.round(avgSqft).toLocaleString()} sqft</p>
                    </div>
                  )}

                  {/* Card 3: Appreciation */}
                  {appMin && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Est. Appreciation</p>
                      <p className="text-2xl font-bold text-gray-900">{appMin}–{appMin + 2}% p.a.</p>
                      <p className="text-[10px] text-gray-400 mt-1">corridor CAGR estimate</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 2.15 ABOUT THE MICRO-MARKET ──────────────────────────────────── */}
      {microMarket?.micro_market_name && (microMarket.hero_hook || microMarket.price_per_sqft_min) && (() => {
        const mmSlug = (microMarket as any).url_slug as string | null;
        return (
          <section data-section="about-market" className="py-10" style={{ background: T.lightSection }}>
            <div className="container mx-auto px-4 max-w-3xl">
              <ScrollReveal>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About {microMarket.micro_market_name}</h2>
                {microMarket.hero_hook && (
                  <p className="text-gray-600 leading-relaxed text-base mb-4">{microMarket.hero_hook}</p>
                )}
                {microMarket.price_per_sqft_min && microMarket.price_per_sqft_max && (
                  <p className="text-sm text-gray-500 mb-5">
                    ₹{microMarket.price_per_sqft_min.toLocaleString("en-IN")}–{microMarket.price_per_sqft_max.toLocaleString("en-IN")}/sqft
                    {microMarket.annual_appreciation_min && (
                      <> · Est. {microMarket.annual_appreciation_min}%+ annual appreciation</>
                    )}
                  </p>
                )}
                {mmSlug && (
                  <Link href={`/${citySlug}/${mmSlug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Explore all projects in {microMarket.micro_market_name} <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 2.2 MORE IN THIS MARKET ───────────────────────────────────────── */}
      {otherProjectsInMarket.length > 0 && microMarket?.micro_market_name && (
        <section data-section="other-projects-market" className="py-10" style={{ background: T.altSection }}>
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <h2 className="text-xl font-bold text-gray-900 mb-1">More in {microMarket.micro_market_name}</h2>
              <p className="text-sm text-gray-400 mb-6">Other RERA-registered projects nearby</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherProjectsInMarket.slice(0, 3).map((op, i) => {
                  const href = op.city_slug && op.url_slug ? buildProjectUrl(op.city_slug, op.url_slug) : null;
                  const card = (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                      <p className="font-semibold text-gray-900 text-sm mb-1 leading-snug">{op.project_name}</p>
                      {op.developer_name && <p className="text-xs text-gray-400 mb-3">{op.developer_name}</p>}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        {op.total_units && <span>{op.total_units.toLocaleString()} units</span>}
                        {op.proposed_completion_date && <span>Est. {formatDate(op.proposed_completion_date)}</span>}
                      </div>
                      {href && <p className="text-xs text-indigo-600 font-medium mt-3">View Project →</p>}
                    </div>
                  );
                  return href ? <Link key={i} href={href}>{card}</Link> : <div key={i}>{card}</div>;
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── 2.3 ABOUT THIS PROJECT ────────────────────────────────────────── */}
      {project.project_overview_seo && (
        <section data-section="about" className="py-14" style={{ background: T.lightSection }}>
          <div className="container mx-auto px-4 max-w-3xl">
            <ScrollReveal>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Project</h2>
              <p className="text-gray-600 leading-relaxed text-base mb-6">{project.project_overview_seo}</p>
              {project.westside_realty_review && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 mb-6">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Westside View</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{project.westside_realty_review}</p>
                </div>
              )}
              {citySlug === 'goa' && (() => {
                const highlights = cleanArray((project as any).project_highlights);
                if (highlights.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Key Highlights</p>
                    <div className="flex flex-wrap gap-2">
                      {highlights.slice(0, 5).map((h, i) => (
                        <span key={i}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {String(h)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── 2.3 UNIT MIX ─────────────────────────────────────────────────── */}
      {(() => {
        const validRows = configDistribution.filter(
          r => r.unit_category !== "Other" && (r.total_units ?? 0) > 0
        );
        if (validRows.length === 0) return null;
        return (
          <section data-section="unit-mix" className="py-10" style={{ background: T.factsStrip }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white/80 text-sm font-semibold uppercase tracking-wider">Unit Mix</h2>
                  <ReraBadge dark />
                </div>
                <div className="space-y-3 max-w-2xl">
                  {validRows.map((row, i) => {
                    const label = row.unit_category || "—";
                    const pct = row.config_percent != null ? Math.round(row.config_percent) : 0;
                    const count = row.total_units ?? 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-white/80 text-sm font-medium w-16 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-white/60 text-xs w-10 text-right flex-shrink-0">{pct}%</span>
                        <span className="text-white/40 text-xs w-20 text-right flex-shrink-0">{count.toLocaleString()} units</span>
                      </div>
                    );
                  })}
                </div>
                {validRows[0] && (
                  <p className="text-white/40 text-xs mt-4">
                    Dominant configuration: {validRows[0].unit_category} —
                    primary buyer segment: {(validRows[0].unit_category || "").includes("3") ? "family end-users" : "young professionals"}
                  </p>
                )}
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 2.4 AMENITIES (Goa only) ─────────────────────────────────────── */}
      {citySlug === 'goa' && (() => {
        const amenities = cleanArray((project as any).amenities_json);
        if (amenities.length === 0) return null;
        return (
          <section data-section="amenities" className="py-12" style={{ background: T.lightSection }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Amenities</h2>
                <div className="flex flex-wrap gap-2.5">
                  {amenities.map((a, i) => {
                    const name = String(a);
                    const icon = getAmenityIcon(name);
                    return (
                      <span key={i}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">
                        <span>{icon}</span>
                        {name}
                      </span>
                    );
                  })}
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 2.5 LIVE MARKET INTELLIGENCE ─────────────────────────────────── */}
      {liveIntelligence && liveIntelligence.actual_status && (() => {
        const li = liveIntelligence;

        // Timestamp
        const rawDate = li.scraped_at ?? li.enriched_at;
        const daysAgo = rawDate
          ? Math.floor((Date.now() - new Date(rawDate).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const updatedLabel = daysAgo === 0 ? "Updated today" : daysAgo === 1 ? "Updated yesterday" : daysAgo != null ? `Updated ${daysAgo} days ago` : null;

        // Price helpers
        const fmtPrice = (min?: number | null, max?: number | null) => {
          if (!min && !max) return null;
          const lo = min?.toLocaleString("en-IN") ?? "—";
          const hi = max && max !== min ? `– ₹${max.toLocaleString("en-IN")}` : "";
          return `₹${lo}${hi} /sqft`;
        };
        const devPrice = fmtPrice(li.developer_price_min, li.developer_price_max);
        const resalePrice = fmtPrice(li.resale_price_min, li.resale_price_max);
        const trend = li.price_trend;
        const trendIcon = trend === "rising" ? "↑" : trend === "falling" || trend === "declining" ? "↓" : "→";
        const trendColor = trend === "rising" ? T.positive : (trend === "falling" || trend === "declining") ? T.risk : "#64748b";
        const trendLabel = trend === "rising" ? "Rising" : (trend === "falling" || trend === "declining") ? "Falling" : "Stable";

        // Status badge
        const statusMap: Record<string, { label: string; bg: string; color: string }> = {
          under_construction:      { label: "Under Construction", bg: "#fef3c7", color: "#92400e" },
          partial_handover:        { label: "Partial Handover",   bg: "#dbeafe", color: "#1d4ed8" },
          substantially_complete:  { label: "Substantially Complete", bg: "#ede9fe", color: "#6d28d9" },
          fully_handed_over:       { label: "Fully Handed Over",  bg: "#dcfce7", color: "#166534" },
        };
        const statusInfo = statusMap[li.actual_status ?? ""] ?? { label: li.actual_status ?? "Unknown", bg: "#f1f5f9", color: "#475569" };

        // Sentiment
        const sentMap: Record<string, { label: string; color: string; pct: number }> = {
          positive: { label: "Positive", color: T.positive, pct: 82 },
          mixed:    { label: "Mixed",    color: T.warning,  pct: 50 },
          neutral:  { label: "Neutral",  color: "#94a3b8",  pct: 50 },
          negative: { label: "Negative", color: T.risk,     pct: 18 },
        };
        const sent = sentMap[li.forum_sentiment ?? ""] ?? null;

        return (
          <section data-section="live-intelligence" className="py-10" style={{ background: "#f8fafc" }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>

                {/* ── Header ── */}
                <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <h2 className="text-xl font-bold text-gray-900">Live Market Intelligence</h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] bg-violet-50 text-violet-700 border border-violet-200">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                        </span>
                        AI Research
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {updatedLabel ? `${updatedLabel} · ` : ""}🟣 Web verified · AI synthesised
                    </p>
                  </div>
                  {/* Status badge — top right on desktop */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: statusInfo.bg, color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* ── Row 1: Price + Sentiment ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                  {/* Current Market Price card */}
                  {(devPrice || resalePrice) && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Current Market Price</p>
                      <div className="space-y-3">
                        {devPrice && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Developer</span>
                            <span className="text-sm font-bold text-gray-900">{devPrice}</span>
                          </div>
                        )}
                        {devPrice && resalePrice && <div className="border-t border-gray-50" />}
                        {resalePrice && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Resale</span>
                            <span className="text-sm font-bold text-gray-900">{resalePrice}</span>
                          </div>
                        )}
                      </div>
                      {trend && (
                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: trendColor }}>{trendIcon}</span>
                          <span className="text-sm font-semibold" style={{ color: trendColor }}>{trendLabel}</span>
                          <span className="text-xs text-gray-400">price trend</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Buyer Sentiment card */}
                  {sent && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Buyer Sentiment</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{ color: sent.color }}>{sent.label}</span>
                        <span className="text-xs text-gray-400">{sent.pct}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-4">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${sent.pct}%`, background: sent.color }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Negative</span>
                        <span>Positive</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Row 2: Key Updates + Buyer Concerns ── */}
                {((li.key_updates && li.key_updates.length > 0) || (li.buyer_concerns && li.buyer_concerns.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                    {/* Key Updates */}
                    {li.key_updates && li.key_updates.length > 0 && (
                      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Key Updates</p>
                        <ul className="space-y-3">
                          {li.key_updates.slice(0, 4).map((u, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                              <span className="text-sm text-gray-700 leading-snug">{u}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Buyer Concerns */}
                    {li.buyer_concerns && li.buyer_concerns.length > 0 && (
                      <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm" style={{ borderColor: "#fde68a" }}>
                        <p className="text-xs uppercase tracking-wider mb-4" style={{ color: "#92400e" }}>Buyer Concerns</p>
                        <ul className="space-y-3">
                          {li.buyer_concerns.slice(0, 3).map((c, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="text-amber-500 flex-shrink-0 text-sm mt-0.5">⚠</span>
                              <span className="text-sm text-gray-700 leading-snug">{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}


              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 3. POSSESSION TIMELINE ────────────────────────────────────────── */}
      {project.possession_date_text && (() => {
        const reraDate = formatDate(project.possession_date_text);
        const li = liveIntelligence;
        const statusMap: Record<string, { label: string; bg: string; color: string }> = {
          under_construction:     { label: "Under Construction",    bg: "#fef3c7", color: "#92400e" },
          partial_handover:       { label: "Partial Handover",      bg: "#dbeafe", color: "#1d4ed8" },
          substantially_complete: { label: "Substantially Complete", bg: "#dcfce7", color: "#166534" },
          fully_handed_over:      { label: "Fully Handed Over",     bg: "#dcfce7", color: "#166534" },
        };
        const statusInfo = li?.actual_status ? (statusMap[li.actual_status] ?? { label: li.actual_status, bg: "#f1f5f9", color: "#475569" }) : null;
        const bullets = li?.handover_notes ? parseHandoverBullets(li.handover_notes) : [];
        const hasLiveData = statusInfo || bullets.length > 0;
        return (
          <section data-section="possession" className="py-20" style={{ background: T.lightSection }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Possession Timeline</h2>
                    <ReraBadge />
                  </div>
                  <div className={`rounded-2xl border border-gray-100 shadow-sm overflow-hidden${hasLiveData ? " grid grid-cols-1 sm:grid-cols-2" : ""}`}>
                    {/* RERA date — left */}
                    <div className={`p-8 ${hasLiveData ? "border-b sm:border-b-0 sm:border-r" : ""} border-gray-100`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">POSSESSION TARGET</p>
                      <p className="text-4xl font-bold text-gray-900 mb-2">{reraDate}</p>
                      <p className="text-xs text-gray-400">
                        As registered with {citySlug === "goa" ? "Goa RERA" : citySlug === "hyderabad" ? "Telangana RERA" : "State RERA"}
                      </p>
                    </div>
                    {/* Live intelligence — right */}
                    {hasLiveData && (
                      <div className="p-8">
                        <div className="flex items-center gap-2 mb-4">
                          <AiBadge label="Live Intelligence" />
                        </div>
                        {statusInfo && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                            style={{ background: statusInfo.bg, color: statusInfo.color }}>
                            {statusInfo.label}
                          </span>
                        )}
                        {bullets.length > 0 && (
                          <ul className="space-y-2.5">
                            {bullets.map((b, i) => (
                              <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-snug">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 4. DEVELOPER TRACK RECORD ─────────────────────────────────────── */}
      {developer && isIndividualDeveloper(developer.developer_name || project.developer_name) ? (
        <section data-section="developer" className="py-8" style={{ background: T.altSection }}>
          <div className="container mx-auto px-4">
            <p className="text-sm text-gray-500">
              Developed by an independent developer · RERA registered
              {project.rera_id && ` · ${project.rera_id}`}
            </p>
          </div>
        </section>
      ) : developer && (
        <section data-section="developer" className="py-16" style={{ background: T.altSection }}>
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">About {developerBrandName || developer.developer_name}</h2>
                  <p className="text-sm text-gray-400 mt-1">Based on RERA filings &amp; developer records</p>
                </div>
                <ReraBadge />
              </div>

              {/* RERA stat cards — only render cards with actual data */}
              {(developer.total_projects != null || developer.years_in_business != null) && (() => {
                const statCards = [
                  developer.total_projects != null
                    ? { label: "Total Projects", value: <CountUp target={developer.total_projects} /> }
                    : null,
                  developer.years_in_business != null
                    ? { label: "Years Active", value: <CountUp target={developer.years_in_business} /> }
                    : null,
                  developer.total_projects != null
                    ? { label: "Est. Delivered", value: <CountUp target={Math.round(developer.total_projects * 0.6)} /> }
                    : null,
                  developer.total_projects != null
                    ? { label: "Track Record", value: developer.total_projects >= 10 ? "Established" : developer.total_projects >= 5 ? "Growing" : "Limited" }
                    : null,
                ].filter((c): c is { label: string; value: ReactNode } => c !== null);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {statCards.map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-xl font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Developer profile link — only show if we have a canonical brand slug */}
              {developerBrandSlug && (
                <Link
                  href={`/developers/${developerBrandSlug}`}
                  className="text-blue-600 text-sm font-medium hover:underline inline-block mb-8"
                >
                  View all projects by {developerBrandName || developer.developer_name} →
                </Link>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: RERA project list */}
                {developerProjects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ReraBadge />
                      <span className="text-sm font-medium text-gray-700">Active RERA Projects</span>
                    </div>
                    <div className="space-y-2.5">
                      {developerProjects.map((dp, i) => {
                        const dpStatus = computeProjectStatus(dp.current_status, dp.proposed_completion_date, null);
                        const isComplete = dpStatus.toLowerCase().includes("complet");
                        const cardContent = (
                          <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 hover:border-blue-200 transition-colors">
                            <span className="text-sm font-medium text-gray-800 truncate mr-3">{dp.project_name}</span>
                            <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                              style={{
                                background: isComplete ? "#dcfce7" : "#fef3c7",
                                color: isComplete ? "#166534" : "#92400e",
                              }}>
                              {dpStatus}
                            </span>
                          </div>
                        );
                        return dp.url_slug && dp.city_slug ? (
                          <Link key={i} href={`/${dp.city_slug}/projects/${dp.url_slug}`}>{cardContent}</Link>
                        ) : cardContent;
                      })}
                    </div>
                  </div>
                )}

                {/* Right: AI assessment */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AiBadge />
                    <span className="text-sm font-medium text-gray-700">Advisory Assessment</span>
                  </div>
                  {(developer.long_description_seo || developer.hero_description) && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-4">
                      {(developer.long_description_seo || developer.hero_description || "").substring(0, 200)}
                    </p>
                  )}
                  {/* Verdict badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
                    style={{
                      background: (developer.total_projects ?? 0) >= 10 ? "#dcfce7" : (developer.total_projects ?? 0) >= 5 ? "#dbeafe" : "#fef3c7",
                      color: (developer.total_projects ?? 0) >= 10 ? "#166534" : (developer.total_projects ?? 0) >= 5 ? "#1d4ed8" : "#92400e",
                    }}>
                    {(developer.total_projects ?? 0) >= 10 ? "✓ Established Builder" : (developer.total_projects ?? 0) >= 5 ? "↑ Growing Track Record" : "⚠ Limited Track Record"}
                  </div>

                  {/* Buyer concern note from live intelligence */}
                  {liveIntelligence?.buyer_concerns && liveIntelligence.buyer_concerns.length > 0 && (
                    <div className="mt-4 p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Buyer Note</p>
                      <p className="text-xs text-amber-800 leading-relaxed">{liveIntelligence.buyer_concerns[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── 4.5 MICRO MARKET SPOTLIGHT ───────────────────────────────────── */}
      {microMarket && microMarket.micro_market_name && (
        <section data-section="micro-market" className="py-20" style={{ background: T.lightSection }}>
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{microMarket.micro_market_name} Micro Market</h2>
                  <p className="text-sm text-gray-400 mt-1">Where this project sits in the city</p>
                </div>
                <ReraBadge />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                {/* Left: stats + description */}
                <div>
                  {/* 3 stat cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {microMarket.price_per_sqft_min && microMarket.price_per_sqft_max && (
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Price Band</p>
                        <p className="text-lg font-bold text-gray-900">
                          ₹{microMarket.price_per_sqft_min.toLocaleString("en-IN")}–{microMarket.price_per_sqft_max.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">per sqft</p>
                      </div>
                    )}
                    {microMarket.annual_appreciation_min && (
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Annual Growth</p>
                        <p className="text-lg font-bold text-gray-900">
                          {microMarket.annual_appreciation_min}–{Math.min(Math.round(microMarket.annual_appreciation_min * 1.3), 8)}%
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">CAGR estimate</p>
                      </div>
                    )}
                    {insights.stageOfDevelopment && (
                      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Project Stage</p>
                        <p className="text-lg font-bold text-gray-900 capitalize">{insights.stageOfDevelopment.replace(/-/g, " ")}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">in this corridor</p>
                      </div>
                    )}
                  </div>

                  {/* Hero hook */}
                  {microMarket.hero_hook && (
                    <p className="text-sm text-gray-600 leading-relaxed">{microMarket.hero_hook}</p>
                  )}
                </div>

                {/* Right: link to micro market page */}
                {(microMarket as any).url_slug && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Deep Dive</p>
                      <h3 className="font-semibold text-gray-900 mb-2 text-base">{microMarket.micro_market_name} Intelligence Report</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">Price trends, project comparison, infrastructure timeline and buyer analysis for this corridor.</p>
                    </div>
                    <Link href={`/${citySlug}/${(microMarket as any).url_slug}`}
                      className="mt-5 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                      View Market Intelligence <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── 5. WHY BUY / WHY PAUSE ───────────────────────────────────────── */}
      {(() => {
        // Anonymize individual developer names in AI-generated text
        const rawDevName = developerBrandName || developer?.developer_name || project.developer_name || null;
        const anonymizeText = (text: string): string => {
          if (!rawDevName || !isIndividualDeveloper(rawDevName)) return text;
          // Replace the name (and common variations) with "The developer"
          return text.replace(new RegExp(rawDevName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "The developer");
        };

        const upside = (insights.riskUpside?.upside?.slice(0, 3) ?? []).map(anonymizeText);
        const risks = (insights.riskUpside?.risks?.slice(0, 3) ?? []).map(anonymizeText);
        const fallbackUpsides = insights.idealBuyers?.slice(0, 3).map(b => `Suitable for ${b}`) ?? [];
        const fallbackRisks = insights.notIdealBuyers?.slice(0, 3).map(b => `May not suit ${b}`) ?? [];
        const reasons = upside.length > 0 ? upside : fallbackUpsides;
        const pauses = risks.length > 0 ? risks : fallbackRisks;
        if (reasons.length === 0 && pauses.length === 0) return null;
        return (
          <section data-section="why-buy" className="py-16" style={{ background: T.lightSection }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Analyst View</h2>
                  <AiBadge />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reasons to consider */}
                  {reasons.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full inline-block" style={{ background: T.positive }} />
                        Reasons to Consider
                      </h3>
                      <div className="space-y-3">
                        {reasons.map((item, i) => (
                          <div key={i} className="flex gap-3 p-4 rounded-xl border-l-[3px] bg-green-50"
                            style={{ borderLeftColor: T.positive }}>
                            <span className="text-green-600 text-base mt-0.5">✓</span>
                            <p className="text-sm text-gray-700">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Reasons to pause */}
                  {pauses.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full inline-block" style={{ background: T.warning }} />
                        Reasons to Pause
                      </h3>
                      <div className="space-y-3">
                        {pauses.map((item, i) => (
                          <div key={i} className="flex gap-3 p-4 rounded-xl border-l-[3px] bg-amber-50"
                            style={{ borderLeftColor: T.warning }}>
                            <span className="text-amber-600 text-base mt-0.5">⚠</span>
                            <p className="text-sm text-gray-700">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 6. PRICE CONTEXT ─────────────────────────────────────────────── */}
      {(() => {
        const li = liveIntelligence;
        const hasLivePrices = li && (li.developer_price_min || li.resale_price_min);
        const fmtPrice = (min?: number | null, max?: number | null) => {
          if (!min && !max) return null;
          const lo = min?.toLocaleString("en-IN") ?? "";
          const hi = max && max !== min ? ` – ₹${max.toLocaleString("en-IN")}` : "";
          return `₹${lo}${hi} /sqft`;
        };
        const devPrice = fmtPrice(li?.developer_price_min, li?.developer_price_max);
        const resalePrice = fmtPrice(li?.resale_price_min, li?.resale_price_max);
        const trend = li?.price_trend;
        const trendIcon = trend === "rising" ? "↑" : trend === "falling" || trend === "declining" ? "↓" : "→";
        const trendColor = trend === "rising" ? T.positive : (trend === "falling" || trend === "declining") ? T.risk : "#64748b";
        const trendLabel = trend === "rising" ? "Rising" : (trend === "falling" || trend === "declining") ? "Falling" : "Stable";

        // Only show when we have live data — never show stale corridor data
        if (!hasLivePrices) return null;

        // Compute updated label
        const rawDate = li?.scraped_at ?? li?.enriched_at;
        const daysAgo = rawDate ? Math.floor((Date.now() - new Date(rawDate).getTime()) / 86400000) : null;
        const updatedLabel = daysAgo === 0 ? "Updated today" : daysAgo === 1 ? "Updated yesterday" : daysAgo != null ? `Updated ${daysAgo} days ago` : null;

        return (
          <section data-section="price-context" className="py-16" style={{ background: T.altSection }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Current Pricing</h2>
                    <AiBadge label="Live Data" />
                  </div>
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    {/* Live price rows */}
                    <div className="space-y-4">
                      {devPrice && (
                        <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Developer Asking</p>
                            <p className="text-xl font-bold text-gray-900">{devPrice}</p>
                          </div>
                          {trend && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg font-bold" style={{ color: trendColor }}>{trendIcon}</span>
                              <span className="text-sm font-semibold" style={{ color: trendColor }}>{trendLabel}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {resalePrice && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Resale Market</p>
                            <p className="text-xl font-bold text-gray-900">{resalePrice}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {updatedLabel && (
                      <p className="text-[10px] text-gray-400 mt-4 pt-3 border-t border-gray-50">
                        🟣 AI market research · {updatedLabel}
                      </p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 7. LOCATION & NEIGHBOURHOOD ──────────────────────────────────── */}
      {(project.latitude && project.longitude) && (
        <section data-section="location" className="py-16" style={{ background: T.lightSection }}>
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Location &amp; Neighbourhood</h2>
              <div className={`grid grid-cols-1 gap-8 ${citySlug === "hyderabad" ? "lg:grid-cols-2" : ""}`}>
                {/* Map — Goa: interactive Google Map (hybrid) with Places API nearby
                          Hyderabad / other: Google Maps Embed iframe */}
                {citySlug === "goa" ? (
                  <GoaGoogleMap
                    lat={project.latitude!}
                    lng={project.longitude!}
                    projectName={project.project_name}
                  />
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ minHeight: 320 }}>
                    {(() => {
                      const gmKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                      const gmUrl = (project as any).google_maps_embed_url as string | null | undefined;
                      const lat = project.latitude!;
                      const lng = project.longitude!;
                      const src = gmKey
                        ? `https://www.google.com/maps/embed/v1/place?key=${gmKey}&q=${lat},${lng}&zoom=17&maptype=satellite`
                        : gmUrl
                          ? gmUrl
                          : `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.012},${lng + 0.012},${lat + 0.012}&layer=mapnik&marker=${lat},${lng}`;
                      return (
                        <iframe
                          src={src}
                          width="100%"
                          height="320"
                          style={{ border: 0, display: "block" }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`Satellite map for ${project.project_name}`}
                        />
                      );
                    })()}
                  </div>
                )}

                {/* Right col */}
                <div className="space-y-6">
                  {/* Distance intelligence — Hyderabad only (landmarks/ORR are HYD-specific) */}
                  {citySlug === "hyderabad" && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ReraBadge />
                      <span className="text-sm font-medium text-gray-700">Distance Intelligence</span>
                    </div>
                    <div className="space-y-2">
                      {LANDMARKS.map(lm => {
                        const dist = distanceInKm(project.latitude!, project.longitude!, lm.lat, lm.lng);
                        return (
                          <div key={lm.label} className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-gray-50">
                            <span className="text-sm text-gray-700">{lm.label}</span>
                            <span className="text-sm font-semibold text-gray-900">{dist.toFixed(1)} km</span>
                          </div>
                        );
                      })}
                      {(() => {
                        const orr = nearestOrrExit(project.latitude!, project.longitude!);
                        return (
                          <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-blue-50">
                            <span className="text-sm text-blue-800">{orr.label}</span>
                            <span className="text-sm font-semibold text-blue-900">{orr.dist.toFixed(1)} km</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  )}

                  {/* Nearby schools */}
                  {(() => {
                    const schools = cleanArray(microMarketDetail?.top_schools);
                    if (schools.length === 0) return null;
                    return (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🏫 Nearby Schools</p>
                        <div className="space-y-1.5">
                          {schools.slice(0, 4).map((name, i) => (
                            <div key={i} className="flex items-center gap-2.5 py-2 px-4 rounded-xl bg-gray-50">
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-sm text-gray-700">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Healthcare */}
                  {(() => {
                    const hospitals = cleanArray(microMarketDetail?.top_hospitals);
                    if (hospitals.length === 0) return null;
                    return (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🏥 Healthcare</p>
                        <div className="space-y-1.5">
                          {hospitals.slice(0, 4).map((name, i) => (
                            <div key={i} className="flex items-center gap-2.5 py-2 px-4 rounded-xl bg-gray-50">
                              <span className="text-gray-400 text-xs">•</span>
                              <span className="text-sm text-gray-700">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Neighbourhood character */}
                  {microMarket?.hero_hook && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AiBadge />
                        <span className="text-sm font-medium text-gray-700">Neighbourhood Character</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{microMarket.hero_hook.substring(0, 180)}</p>
                    </div>
                  )}

                  {/* Location highlights — Goa: projects table (location_highlights); other cities: context fallback */}
                  {citySlug === 'goa' ? (() => {
                    const items = cleanArray((project as any).location_highlights);
                    if (items.length === 0) return null;
                    return (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📍 Nearby</p>
                        <ul className="space-y-1.5">
                          {items.slice(0, 6).map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 py-2 px-4 rounded-xl bg-gray-50">
                              <span className="text-indigo-400 text-xs mt-0.5 flex-shrink-0">•</span>
                              <span className="text-sm text-gray-700">{String(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })() : (() => {
                    const items = (context.locationAdvantages && Array.isArray(context.locationAdvantages))
                      ? context.locationAdvantages as any[]
                      : [];
                    if (items.length === 0) return null;
                    return (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📍 Location Highlights</p>
                        <div className="space-y-1.5">
                          {items.slice(0, 6).map((item: any, i: number) => {
                            const text = typeof item === "string" ? item : item?.label || item?.name || "";
                            if (!text) return null;
                            return (
                              <div key={i} className="flex items-start gap-2.5 py-2 px-4 rounded-xl bg-gray-50">
                                <span className="text-indigo-400 text-xs mt-0.5 flex-shrink-0">→</span>
                                <span className="text-sm text-gray-700">{text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── 8. 5-YEAR OUTLOOK ────────────────────────────────────────────── */}
      {microMarket?.annual_appreciation_min && (
        <section data-section="outlook" className="py-16" style={{ background: T.darkSection }}>
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">5-Year Outlook</h2>
                <AiBadge dark label="AI Projection" />
              </div>

              {/* 3 metric columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  {
                    label: "5-Year Appreciation",
                    // Cap at 35% base / 40% bull — Hyderabad supply levels constrain aggressive projections
                    value: `${Math.min(Math.round(microMarket.annual_appreciation_min * 5), 35)}%–${Math.min(Math.round(microMarket.annual_appreciation_min * 1.3 * 5), 40)}%`,
                    sub: "Estimated range · capped at market reality",
                  },
                  {
                    label: "Annual CAGR",
                    value: `${microMarket.annual_appreciation_min}%–${Math.min(Math.round(microMarket.annual_appreciation_min * 1.3), 8)}%`,
                    sub: "Corridor average",
                  },
                  {
                    label: "Rental Yield",
                    value: "3.5–4.5%",
                    sub: "AI estimate · verify locally",
                  },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-2xl p-6 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-2">{label}</p>
                    <p className="text-3xl font-bold text-white mb-1">{value}</p>
                    <p className="text-white/40 text-xs">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Bull / Bear scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.riskUpside?.upside?.[0] && (
                  <div className="rounded-2xl p-5 border border-green-500/20" style={{ background: "rgba(34,197,94,0.07)" }}>
                    <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">Bull Case</p>
                    <p className="text-white/60 text-xs mb-2">If conditions improve…</p>
                    <p className="text-white text-sm">{insights.riskUpside.upside[0]}</p>
                  </div>
                )}
                {insights.riskUpside?.risks?.[0] && (
                  <div className="rounded-2xl p-5 border border-red-500/20" style={{ background: "rgba(239,68,68,0.07)" }}>
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">Bear Case</p>
                    <p className="text-white/60 text-xs mb-2">If conditions deteriorate…</p>
                    <p className="text-white text-sm">{insights.riskUpside.risks[0]}</p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── 9. COMPETITIVE LANDSCAPE ─────────────────────────────────────── */}
      {(() => {
        const sampleSize = insights.confidence?.sampleSizeValue;
        const densityLabel = insights.relativeComparison?.densityVsMarket?.label;
        const stageLabel = insights.relativeComparison?.stageVsMarket?.label;
        const posLabel = insights.relativeComparison?.positioningVsMarket?.label;
        const densitySum = insights.relativeComparison?.densityVsMarket?.summary;
        const stageSum = insights.relativeComparison?.stageVsMarket?.summary;
        const medianUnits = insights.marketBaseline?.typicalProjectScale?.totalUnitsMedian;

        // Hide if all three comparison labels are "insufficient-data" or missing
        const hasUsableDensity = densityLabel && densityLabel !== "insufficient-data";
        const hasUsableStage = stageLabel && stageLabel !== "insufficient-data";
        const hasUsablePos = posLabel && posLabel !== "insufficient-data";
        if (!hasUsableDensity && !hasUsableStage && !hasUsablePos) return null;

        const intensityDisplay = densityLabel === "denser-than-market" ? "High" : densityLabel === "less-dense-than-market" ? "Low" : "Medium";
        return (
          <section data-section="competitive" className="py-16" style={{ background: T.altSection }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">Competitive Landscape</h2>
                  <div className="flex gap-2">
                    <ReraBadge />
                    <AiBadge />
                  </div>
                </div>
                {sampleSize && (
                  <p className="text-sm text-gray-400 mb-8">{sampleSize} projects tracked in this corridor</p>
                )}

                {(() => {
                  const fmtLabel = (l?: string) => l && l !== "insufficient-data"
                    ? l.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                    : null;
                  const cards = [
                    hasUsableDensity && { label: "Competition Intensity", value: intensityDisplay, sub: densitySum },
                    hasUsableStage && { label: "Stage vs Market", value: fmtLabel(stageLabel), sub: stageSum },
                    hasUsablePos && { label: "Market Positioning", value: fmtLabel(posLabel), sub: insights.relativeComparison?.positioningVsMarket?.summary },
                  ].filter(Boolean) as { label: string; value: string | null; sub?: string }[];
                  if (cards.length === 0) return null;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {cards.map(({ label, value, sub }) => (
                        <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                          <p className="text-lg font-bold text-gray-900 mb-1">{value ?? "—"}</p>
                          {sub && <p className="text-xs text-gray-500 line-clamp-2">{sub}</p>}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* This project vs corridor */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">This Project vs Corridor</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {project.total_units && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Project Density</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {project.total_units.toLocaleString()} units
                          {medianUnits ? ` vs ${medianUnits} median` : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-500">Stage</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">{insights.stageOfDevelopment?.replace(/-/g, " ")}</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── QUICK LINKS ───────────────────────────────────────────────────── */}
      {microMarket && (microMarket as any).url_slug && (() => {
        const mmSlug = (microMarket as any).url_slug as string;
        const mmName = microMarket.micro_market_name;
        const devName = developer?.developer_name || project.developer_name || "";
        const devSlugVal = developerBrandSlug || developer?.url_slug || (devName ? developerSlug(devName) : "");

        // Extract distinct BHK configs from current project + related projects
        const allConfigStrings = [
          project.configuration_display,
          ...relatedProjects.map(rp => rp.configuration_display),
        ].filter(Boolean) as string[];

        const configSet = new Set<string>();
        for (const cs of allConfigStrings) {
          for (const part of cs.split(/[,/&]/)) {
            const trimmed = part.trim();
            if (/\d\s*BHK/i.test(trimmed)) {
              configSet.add(trimmed.replace(/\s+/g, " "));
            }
          }
        }
        const dynamicConfigs = [...configSet].sort();

        const staticLinks = [
          { label: `Ready to move in ${mmName}`, href: `/${citySlug}/${mmSlug}?status=ready` },
          { label: `Under ₹1Cr in ${mmName}`, href: `/${citySlug}/${mmSlug}?budget=under-1cr` },
          { label: `Under ₹2Cr in ${mmName}`, href: `/${citySlug}/${mmSlug}?budget=under-2cr` },
          ...(devSlugVal ? [{ label: `All projects by ${devName}`, href: `/developers/${devSlugVal}` }] : []),
          { label: `All projects in ${mmName}`, href: `/${citySlug}/${mmSlug}` },
        ];

        return (
          <section data-section="quick-links" className="py-16" style={{ background: T.altSection }}>
            <div className="container mx-auto px-4">
              <ScrollReveal>
                {/* Similar project cards */}
                {relatedProjects.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      More Projects in {mmName}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {relatedProjects.slice(0, 3).map((rp, i) => {
                        const cityArr = rp.city;
                        const citySlugRp = Array.isArray(cityArr) ? cityArr[0]?.url_slug : (cityArr as any)?.url_slug;
                        const href = citySlugRp && rp.url_slug ? buildProjectUrl(citySlugRp, rp.url_slug) : null;
                        const rpStatus = computeProjectStatus(rp.current_status, null, null);
                        const isComplete = rpStatus.toLowerCase().includes("complet");
                        const card = (
                          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                            <h3 className="font-semibold text-gray-900 text-sm mb-2 leading-snug">{rp.project_name}</h3>
                            <p className="text-xs text-gray-500 mb-3">
                              {[rp.configuration_display, rp.total_units ? `${rp.total_units.toLocaleString()} units` : null].filter(Boolean).join(" · ")}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{ background: isComplete ? "#dcfce7" : "#fef3c7", color: isComplete ? "#166534" : "#92400e" }}>
                                {rpStatus}
                              </span>
                              {href && <span className="text-xs text-blue-600 font-medium">View project →</span>}
                            </div>
                          </div>
                        );
                        return href ? <Link key={i} href={href}>{card}</Link> : <div key={i}>{card}</div>;
                      })}
                    </div>
                  </div>
                )}

                {/* Pills */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Quick Links</h2>
                  <p className="text-sm text-gray-400 mb-5">Find what you're looking for</p>
                  <div className="flex flex-wrap gap-2">
                    {dynamicConfigs.map((cfg, i) => (
                      <Link key={`cfg-${i}`}
                        href={`/${citySlug}/${mmSlug}?config=${encodeURIComponent(cfg)}`}
                        className="inline-block px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors bg-white">
                        {cfg} flats in {mmName}
                      </Link>
                    ))}
                    {staticLinks.map((lnk, i) => (
                      <Link key={`static-${i}`}
                        href={lnk.href}
                        className="inline-block px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors bg-white">
                        {lnk.label}
                      </Link>
                    ))}
                    {nearbyMarkets.map((m, i) => (
                      <Link key={`market-${i}`}
                        href={`/${citySlug}/${m.url_slug}`}
                        className="inline-block px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors bg-white">
                        All projects in {m.micro_market_name} ↗
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── FAQs ─────────────────────────────────────────────────────────── */}
      {(() => {
        const priceLine = project.price_range_text ?? "Price on Request";
        const possLine = project.possession_date_text ? formatDate(project.possession_date_text) : "As per RERA";
        const configLine = project.configuration_display ?? "Multiple configurations";
        const devName = developer?.developer_name || project.developer_name || "the developer";
        const reraAuthority = citySlug === "goa" ? "Goa RERA" : citySlug === "hyderabad" ? "Telangana RERA" : "State RERA";
        const reraPortal = citySlug === "goa" ? "rera.goa.gov.in" : "rera.telangana.gov.in";
        const reraLine = project.rera_id ?? `Registered with ${reraAuthority}`;
        const locLine = microMarket?.micro_market_name ?? citySlug;

        const faqs = [
          {
            q: `What is the price of ${project.project_name}?`,
            a: `${project.project_name} is priced at ${priceLine}. Prices vary by configuration and floor. Contact our advisors for the latest price sheet and any ongoing developer offers.`,
          },
          {
            q: `When will ${project.project_name} be delivered?`,
            a: `The official RERA-registered possession date for ${project.project_name} is ${possLine}. ${liveIntelligence?.handover_notes ? liveIntelligence.handover_notes : `Construction progress is tracked via ${reraAuthority}.`}`,
          },
          {
            q: `What configurations are available in ${project.project_name}?`,
            a: `${project.project_name} offers ${configLine}. ${project.min_area && project.max_area ? `Unit sizes range from ${fmtArea(project.min_area)} to ${fmtArea(project.max_area)} sqft.` : ""}`,
          },
          {
            q: `Who is the developer of ${project.project_name}?`,
            a: `${project.project_name} is developed by ${devName}. ${developer?.total_projects ? `They have ${developer.total_projects} RERA-registered projects.` : ""} ${developer?.years_in_business ? `The company has been active for ${developer.years_in_business}+ years.` : ""}`,
          },
          {
            q: `What is the RERA ID of ${project.project_name}?`,
            a: `The RERA registration number for ${project.project_name} is ${reraLine}. You can verify all project details on the official ${reraAuthority} portal at ${reraPortal}.`,
          },
          {
            q: `Where is ${project.project_name} located?`,
            a: `${project.project_name} is located in ${locLine}, ${project.city?.city_name || citySlug}. ${microMarket?.hero_hook ? microMarket.hero_hook.substring(0, 120) + "." : ""}`,
          },
        ];

        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": { "@type": "Answer", "text": f.a },
          })),
        };

        return (
          <section data-section="faqs" className="py-20" style={{ background: T.lightSection }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <div className="container mx-auto px-4">
              <ScrollReveal>
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
                  <div className="space-y-3">
                    {faqs.map((faq, i) => (
                      <FaqItem key={i} q={faq.q} a={faq.a} />
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })()}

      {/* ── 10. FINAL CTA ─────────────────────────────────────────────────── */}
      <section data-section="final-cta" className="py-20" style={{ background: T.heroBg }}>
        <div className="container mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, color: "#ffffff", marginBottom: "1rem" }}>
              Ready to make a decision on {project.project_name}?
            </h2>
            <p className="text-white/60 text-base mb-8 max-w-lg mx-auto">
              Our advisors have walked this corridor. Get a 30-minute honest assessment.
            </p>
            <div className="flex justify-center mb-6">
              <button onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-white text-sm bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/30">
                Get Expert Analysis — Free
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {["✓ Free", "✓ No obligation", "✓ RERA experts"].map(t => (
                <span key={t} className="text-sm text-white/40">{t}</span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── MOBILE BOTTOM BAR ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-bottom"
        style={{ background: "rgba(10,15,30,0.95)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="p-3 pb-safe">
          <InlineLeadForm
            projectName={project.project_name}
            projectId={project.id || String((project as any).project_id || "")}
            reraId={project.rera_id}
            locationPreference={microMarket?.micro_market_name ? `${microMarket.micro_market_name}, ${citySlug}` : citySlug}
            dark
          />
        </div>
      </div>

      {/* Bottom padding for mobile bar */}
      <div className="h-20 lg:hidden" />

      {/* ── EXPERT ANALYSIS MODAL ───────────────────────────────────────── */}
      {modalOpen && (
        <ExpertModal
          projectName={project.project_name}
          projectId={project.id || String((project as any).project_id || "")}
          developerName={developer?.developer_name || project.developer_name || undefined}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* ── Animations ───────────────────────────────────────────────────── */}
      <style>{`
        @keyframes hero-zoom {
          from { transform: scale(1.04); }
          to { transform: scale(1.0); }
        }
        .animate-hero-zoom {
          animation: hero-zoom 8s ease-out forwards;
        }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
        .pb-safe { padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px)); }
      `}</style>
    </>
  );
}
