"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export const revalidate = 3600;

// ─── Design System ────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type City = "hyderabad" | "goa";

type Developer = {
  brand_name: string;
  url_slug: string | null;
  total_projects: number | null;
  is_premium: boolean | null;
  institutional_grade: boolean | null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  const [activeCity, setActiveCity] = useState<City>("hyderabad");

  // ── Hyderabad state ──
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [developerCount, setDeveloperCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Goa state ──
  const [goaDevelopers, setGoaDevelopers] = useState<Developer[]>([]);
  const [goaLoading, setGoaLoading] = useState(false);
  const goaLoaded = useRef(false);

  // ── Shared ──
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"projects" | "alpha">("projects");

  // ── Initialize city from ?city= URL param ──
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("city") === "goa") {
      setActiveCity("goa");
      loadGoaDevelopers();
    }
  }, []); // intentionally empty — run once on mount

  // ── Load Hyderabad on mount ──
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    (async () => {
      setLoading(true);

      const [{ data }, { count: reraCount }, { count: devCount }] = await Promise.all([
        supabase
          .from("v_developer_brand_profile")
          .select("brand_name, url_slug, total_projects")
          .order("total_projects", { ascending: false }),
        supabase
          .from("rera_projects")
          .select("id", { count: "exact", head: true })
          .eq("city_slug", "hyderabad"),
        supabase
          .from("developers")
          .select("id", { count: "exact", head: true }),
      ]);

      setProjectCount(reraCount);
      setDeveloperCount(devCount);

      const allDevs = ((data as Developer[] | null) ?? []) as Developer[];

      // Filter to only Hyderabad developers via promoter→entity→brand chain
      try {
        const CHUNK = 100;

        const { data: hydRows } = await supabase
          .from("rera_projects")
          .select("id")
          .eq("city_slug", "hyderabad")
          .limit(10000);
        const hydIds = ((hydRows ?? []) as { id: string }[]).map((r) => r.id).filter(Boolean);

        const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
        const allPromoterRows: { organization_name: string | null; organization_name_normalized: string | null }[] = [];
        for (let i = 0; i < hydIds.length; i += CHUNK) {
          const { data: chunk } = await supabase
            .from("rera_promoters")
            .select("organization_name, organization_name_normalized")
            .in("rera_project_id", hydIds.slice(i, i + CHUNK));
          if (chunk) allPromoterRows.push(...(chunk as typeof allPromoterRows));
        }
        const orgNames = [
          ...new Set(
            allPromoterRows
              .map((r) => r.organization_name_normalized ?? (r.organization_name ? norm(r.organization_name) : null))
              .filter((n): n is string => !!n)
          ),
        ];

        const allEntityRows: { brand_id: string | null }[] = [];
        for (let i = 0; i < orgNames.length; i += CHUNK) {
          const { data: chunk } = await supabase
            .from("developer_brand_entities")
            .select("brand_id")
            .in("legal_entity_name_normalized", orgNames.slice(i, i + CHUNK));
          if (chunk) allEntityRows.push(...(chunk as typeof allEntityRows));
        }
        const hydBrandIds = [...new Set(allEntityRows.map((r) => r.brand_id).filter((id): id is string => !!id))];

        const allBrandRows: { url_slug: string | null }[] = [];
        for (let i = 0; i < hydBrandIds.length; i += CHUNK) {
          const { data: chunk } = await supabase
            .from("developer_brands")
            .select("url_slug")
            .in("id", hydBrandIds.slice(i, i + CHUNK));
          if (chunk) allBrandRows.push(...(chunk as typeof allBrandRows));
        }
        const validSlugs = new Set(allBrandRows.map((r) => r.url_slug).filter((s): s is string => !!s));

        if (validSlugs.size > 0) {
          setDevelopers(allDevs.filter((d) => d.url_slug && validSlugs.has(d.url_slug)));
        } else {
          setDevelopers(allDevs);
        }
      } catch {
        setDevelopers(allDevs);
      }

      setLoading(false);
    })();
  }, []);

  // ── Load Goa developers ──
  async function loadGoaDevelopers() {
    if (goaLoaded.current) return;
    goaLoaded.current = true;
    setGoaLoading(true);
    try {
      const res = await fetch("/api/developers/goa");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = (await res.json()) as { developers?: Developer[] };
      setGoaDevelopers(json.developers ?? []);
    } catch {
      // fail silently
    } finally {
      setGoaLoading(false);
    }
  }

  function handleCitySwitch(city: City) {
    setActiveCity(city);
    setQuery("");
    if (city === "goa") loadGoaDevelopers();
  }

  // ── Derived ──
  const activeDevelopers = activeCity === "hyderabad" ? developers : goaDevelopers;
  const isLoading = loading || (activeCity === "goa" && goaLoading);

  let filtered = query.trim()
    ? activeDevelopers.filter((d) => d.brand_name.toLowerCase().includes(query.toLowerCase()))
    : activeDevelopers;

  if (sort === "alpha") {
    filtered = [...filtered].sort((a, b) => a.brand_name.localeCompare(b.brand_name));
  }

  const subtitleLine =
    activeCity === "goa"
      ? "Delivery history and portfolio data for every major Goa developer."
      : "Delivery history and portfolio data for every major Hyderabad developer.";

  return (
    <>
      <style>{`
        .dev-grid-card {
          display: block;
          background: ${C.bgCard};
          border: 1px solid ${C.border};
          border-radius: 16px;
          padding: 22px 20px;
          text-decoration: none;
          transition: all 0.18s ease;
        }
        .dev-grid-card:hover {
          border-color: rgba(176,141,87,0.35);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.07);
        }
        .dev-grid-card:hover .dev-card-arrow { color: ${C.gold}; }
        .dev-search-input:focus { outline: none; border-color: rgba(176,141,87,0.4); }
        @media (max-width: 640px) {
          .dev-hero-metrics { gap: 20px !important; }
          .dev-sort-row { flex-direction: column; gap: 12px !important; }
        }
      `}</style>

      <main style={{ background: C.bg, fontFamily: "'Outfit', sans-serif", color: C.text }}>

        {/* ── Hero (Dark) ─────────────────────────────────────────────────── */}
        <section
          style={{
            background: C.bgDark,
            paddingTop: 96,
            paddingBottom: 72,
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          <div style={{ maxWidth: 960, margin: "0 auto" }}>

            {/* Eyebrow */}
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: C.gold,
                marginBottom: 14,
              }}
            >
              Developer Intelligence
            </p>

            {/* H1 */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 600,
                color: "#fff",
                margin: "0 0 14px",
                lineHeight: 1.1,
              }}
            >
              Know your builder
              <br />
              before you sign.
            </h1>

            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 16,
                color: "rgba(255,255,255,0.45)",
                margin: "0 0 44px",
                maxWidth: 480,
                lineHeight: 1.65,
              }}
            >
              {subtitleLine}
            </p>

            {/* Metric pills */}
            {!loading && (
              <div
                className="dev-hero-metrics"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 32,
                  paddingTop: 28,
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {activeCity === "hyderabad" ? (
                  <>
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "clamp(28px, 3vw, 40px)",
                          fontWeight: 600,
                          color: C.goldLight,
                          margin: 0,
                          lineHeight: 1.1,
                        }}
                      >
                        {developerCount != null ? `${developerCount}+` : "500+"}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.16em",
                          color: "rgba(255,255,255,0.35)",
                          marginTop: 6,
                        }}
                      >
                        Builders Tracked
                      </p>
                    </div>
                    {projectCount != null && (
                      <div style={{ textAlign: "center" }}>
                        <p
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "clamp(28px, 3vw, 40px)",
                            fontWeight: 600,
                            color: C.goldLight,
                            margin: 0,
                            lineHeight: 1.1,
                          }}
                        >
                          {projectCount.toLocaleString("en-IN")}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.16em",
                            color: "rgba(255,255,255,0.35)",
                            marginTop: 6,
                          }}
                        >
                          RERA Projects
                        </p>
                      </div>
                    )}
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "clamp(28px, 3vw, 40px)",
                          fontWeight: 600,
                          color: C.goldLight,
                          margin: 0,
                          lineHeight: 1.1,
                        }}
                      >
                        12 Yrs
                      </p>
                      <p
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.16em",
                          color: "rgba(255,255,255,0.35)",
                          marginTop: 6,
                        }}
                      >
                        Market Expertise
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "clamp(28px, 3vw, 40px)",
                          fontWeight: 600,
                          color: C.goldLight,
                          margin: 0,
                          lineHeight: 1.1,
                        }}
                      >
                        {goaDevelopers.length > 0 ? `${goaDevelopers.length}+` : "359+"}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.16em",
                          color: "rgba(255,255,255,0.35)",
                          marginTop: 6,
                        }}
                      >
                        Builders Tracked
                      </p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "clamp(28px, 3vw, 40px)",
                          fontWeight: 600,
                          color: C.goldLight,
                          margin: 0,
                          lineHeight: 1.1,
                        }}
                      >
                        400+
                      </p>
                      <p
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.16em",
                          color: "rgba(255,255,255,0.35)",
                          marginTop: 6,
                        }}
                      >
                        Active Projects
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Developer Grid (Light) ────────────────────────────────────────── */}
        <section style={{ background: C.bg, padding: "64px 24px 80px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>

            {/* City Tabs + Sort row */}
            <div
              className="dev-sort-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              {/* City tabs */}
              <div style={{ display: "flex", gap: 8 }}>
                {(["hyderabad", "goa"] as City[]).map((city) => {
                  const active = activeCity === city;
                  return (
                    <button
                      key={city}
                      onClick={() => handleCitySwitch(city)}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 999,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: active ? C.gold : "transparent",
                        color: active ? "#fff" : C.textMuted,
                        border: `1px solid ${active ? C.gold : C.border}`,
                      }}
                    >
                      {city === "hyderabad" ? "Hyderabad" : "Goa"}
                    </button>
                  );
                })}
              </div>

              {/* Sort */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: C.textMuted,
                  }}
                >
                  Sort:
                </span>
                {(["projects", "alpha"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 999,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      background: sort === s ? C.text : "transparent",
                      color: sort === s ? "#fff" : C.textMuted,
                      border: `1px solid ${sort === s ? C.text : C.border}`,
                    }}
                  >
                    {s === "projects" ? "By Projects" : "A–Z"}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 28 }}>
              <svg
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 16,
                  height: 16,
                  color: C.textMuted,
                  pointerEvents: "none",
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder={`Search ${activeCity === "hyderabad" ? "Hyderabad" : "Goa"} developers…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="dev-search-input"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.bgCard,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "12px 44px 12px 44px",
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  color: C.text,
                  transition: "border-color 0.15s",
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    color: C.textMuted,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Result count */}
            {!isLoading && activeDevelopers.length > 0 && (
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 12,
                  color: C.textMuted,
                  marginBottom: 20,
                }}
              >
                {query
                  ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${query}"`
                  : `${activeDevelopers.length} developers`}
              </p>
            )}

            {/* Grid */}
            {isLoading ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 96,
                      borderRadius: 16,
                      background: "rgba(0,0,0,0.04)",
                      animation: "pulse 1.8s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : activeDevelopers.length === 0 ? (
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  color: C.textMuted,
                  textAlign: "center",
                  padding: "80px 0",
                }}
              >
                No developers found.
              </p>
            ) : filtered.length === 0 ? (
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  color: C.textMuted,
                  textAlign: "center",
                  padding: "80px 0",
                }}
              >
                No developers match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {filtered.map((d) => {
                  const href = d.url_slug ? `/developers/${d.url_slug}` : "#";
                  return (
                    <Link key={d.brand_name} href={href} className="dev-grid-card">
                      {/* Top row: name + badge */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                            fontSize: 14,
                            color: C.text,
                            lineHeight: 1.4,
                            margin: 0,
                            paddingRight: 8,
                          }}
                        >
                          {d.brand_name}
                        </p>
                        {d.institutional_grade && (
                          <span
                            style={{
                              flexShrink: 0,
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              fontFamily: "'Outfit', sans-serif",
                              background: "rgba(45,106,79,0.1)",
                              color: "#2D6A4F",
                              border: "1px solid rgba(45,106,79,0.25)",
                            }}
                          >
                            Top
                          </span>
                        )}
                        {!d.institutional_grade && d.is_premium && (
                          <span
                            style={{
                              flexShrink: 0,
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              fontFamily: "'Outfit', sans-serif",
                              background: "rgba(176,141,87,0.1)",
                              color: C.gold,
                              border: `1px solid rgba(176,141,87,0.25)`,
                            }}
                          >
                            Premium
                          </span>
                        )}
                      </div>

                      {/* Project count */}
                      {d.total_projects != null && d.total_projects > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, serif",
                              fontSize: 26,
                              fontWeight: 600,
                              color: C.gold,
                              margin: 0,
                              lineHeight: 1.1,
                            }}
                          >
                            {d.total_projects}
                          </p>
                          <p
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 11,
                              color: C.textMuted,
                              margin: 0,
                            }}
                          >
                            {activeCity === "goa" ? "Projects in Goa" : "Projects"}
                          </p>
                        </div>
                      )}

                      {/* Arrow */}
                      <p
                        className="dev-card-arrow"
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 12,
                          color: C.textMuted,
                          margin: 0,
                          transition: "color 0.15s",
                        }}
                      >
                        View portfolio →
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Bottom CTA (Dark) ─────────────────────────────────────────────── */}
        <section
          style={{
            background: C.bgDark,
            padding: "72px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: C.gold,
                marginBottom: 16,
              }}
            >
              Westside Advisor
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 600,
                color: "#fff",
                margin: "0 0 14px",
                lineHeight: 1.2,
              }}
            >
              Not sure which developer to trust?
            </h2>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                color: "rgba(255,255,255,0.45)",
                margin: "0 0 32px",
                lineHeight: 1.7,
              }}
            >
              Our advisors have tracked every major builder in Hyderabad for 12+ years. Free, honest take — no obligation.
            </p>
            <Link
              href="/contact"
              style={{
                display: "inline-block",
                padding: "13px 34px",
                borderRadius: 999,
                background: `linear-gradient(135deg, ${C.goldLight}, #A88040)`,
                color: "#0a0a0a",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: "0 4px 24px rgba(176,141,87,0.25)",
              }}
            >
              Talk to an Advisor — Free
            </Link>
          </div>
        </section>

      </main>
    </>
  );
}
