"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

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

  // ── Hyderabad state (original, unchanged) ──
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [developerCount, setDeveloperCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Goa state ──
  const [goaDevelopers, setGoaDevelopers] = useState<Developer[]>([]);
  const [goaProjectCount, setGoaProjectCount] = useState<number | null>(null);
  const [goaLoading, setGoaLoading] = useState(false);
  const goaLoaded = useRef(false);

  // ── Shared ──
  const [query, setQuery] = useState("");

  // ── Load Hyderabad on mount ──
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    (async () => {
      setLoading(true);

      // Original 3 queries — unchanged
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

      const allDevs = ((data as any[]) ?? []) as Developer[];

      // Bug 1 fix: filter to only developers who have a Hyderabad project
      // via rera_projects → rera_promoters → developer_brand_entities → developer_brands
      try {
        const CHUNK = 100;

        // Step A: Hyderabad project IDs
        const { data: hydRows } = await supabase
          .from("rera_projects")
          .select("id")
          .eq("city_slug", "hyderabad")
          .limit(10000);
        const hydIds = ((hydRows ?? []) as { id: string }[]).map(r => r.id).filter(Boolean);
        console.log("[Hyd] Step A - project IDs:", hydIds.length);

        // Step B: rera_promoters for those projects → org name (chunked)
        // Select both columns; prefer organization_name_normalized, fall back to lowercased organization_name
        const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
        const allPromoterRows: { organization_name: string | null; organization_name_normalized: string | null }[] = [];
        for (let i = 0; i < hydIds.length; i += CHUNK) {
          const { data: chunk, error: chunkErr } = await supabase
            .from("rera_promoters")
            .select("organization_name, organization_name_normalized")
            .in("rera_project_id", hydIds.slice(i, i + CHUNK));
          if (chunkErr) console.warn("[Hyd] rera_promoters chunk error:", chunkErr.message);
          if (chunk) allPromoterRows.push(...(chunk as typeof allPromoterRows));
        }
        const orgNames = [...new Set(
          allPromoterRows
            .map(r => r.organization_name_normalized ?? (r.organization_name ? norm(r.organization_name) : null))
            .filter((n): n is string => !!n)
        )];
        console.log("[Hyd] Step B - rera_promoters rows:", allPromoterRows.length, "unique org names:", orgNames.length);

        // Step C: developer_brand_entities matching those org names → brand_ids (chunked)
        const allEntityRows: { brand_id: string | null }[] = [];
        for (let i = 0; i < orgNames.length; i += CHUNK) {
          const { data: chunk } = await supabase
            .from("developer_brand_entities")
            .select("brand_id")
            .in("legal_entity_name_normalized", orgNames.slice(i, i + CHUNK));
          if (chunk) allEntityRows.push(...(chunk as typeof allEntityRows));
        }
        const hydBrandIds = [...new Set(allEntityRows.map(r => r.brand_id).filter((id): id is string => !!id))];
        console.log("[Hyd] Step C - entity rows:", allEntityRows.length, "brand IDs:", hydBrandIds.length);

        // Step D: developer_brands → url_slugs for those brand_ids (chunked)
        const allBrandRows: { url_slug: string | null }[] = [];
        for (let i = 0; i < hydBrandIds.length; i += CHUNK) {
          const { data: chunk } = await supabase
            .from("developer_brands")
            .select("url_slug")
            .in("id", hydBrandIds.slice(i, i + CHUNK));
          if (chunk) allBrandRows.push(...(chunk as typeof allBrandRows));
        }
        const validSlugs = new Set(allBrandRows.map(r => r.url_slug).filter((s): s is string => !!s));
        console.log("[Hyd] Step D - valid Hyderabad brand slugs:", validSlugs.size);

        if (validSlugs.size > 0) {
          setDevelopers(allDevs.filter(d => d.url_slug && validSlugs.has(d.url_slug)));
        } else {
          // Fallback: show all if filter chain returned nothing (avoids blank page)
          console.warn("[Hyd] Filter chain returned 0 slugs — showing unfiltered list");
          setDevelopers(allDevs);
        }
      } catch (err) {
        console.error("[Hyd] Filter chain error:", err);
        setDevelopers(allDevs); // fallback to unfiltered
      }

      setLoading(false);
    })();
  }, []);

  // ── Load Goa developers via server-side API route (bypasses RLS on rera_promoters) ──
  async function loadGoaDevelopers() {
    if (goaLoaded.current) return;
    goaLoaded.current = true;
    setGoaLoading(true);
    try {
      const res = await fetch("/api/developers/goa");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setGoaDevelopers(json.developers ?? []);
      setGoaProjectCount(json.projectCount ?? null);
    } catch (err) {
      console.error("[Goa] loadGoaDevelopers error:", err);
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

  const filtered = query.trim()
    ? activeDevelopers.filter((d) => d.brand_name.toLowerCase().includes(query.toLowerCase()))
    : activeDevelopers;

  const subtitle =
    activeCity === "goa"
      ? "Delivery history and portfolio data for every major Goa developer."
      : "Delivery history and portfolio data for every major Hyderabad developer.";

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pb-16 px-4" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#c8a96e" }}>
            Developer Intelligence
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Know your builder<br />before you sign.
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">{subtitle}</p>

          {/* Stats */}
          {!loading && (
            <div className="flex flex-wrap gap-4 mt-10">
              {activeCity === "hyderabad" ? (
                <>
                  <div className="rounded-xl border border-white/10 bg-white/4 px-5 py-3">
                    <p className="text-2xl font-bold text-white">{developerCount != null ? `${developerCount}+` : "500+"}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">Builders tracked</p>
                  </div>
                  {projectCount != null && (
                    <div className="rounded-xl border border-white/10 bg-white/4 px-5 py-3">
                      <p className="text-2xl font-bold text-white">{projectCount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">RERA projects in Hyderabad</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-white/10 px-5 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-2xl font-bold text-white">
                      {goaDevelopers.length > 0 ? `${goaDevelopers.length}+` : "359+"}
                    </p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">Builders tracked</p>
                  </div>
                  <div className="rounded-xl border border-white/10 px-5 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-2xl font-bold text-white">
                      {goaProjectCount != null ? goaProjectCount.toLocaleString("en-IN") : "463"}
                    </p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">RERA projects in Goa</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Developer grid */}
      <section className="px-4 py-8 pb-20">
        <div className="container mx-auto max-w-5xl">

          {/* City tabs */}
          <div className="flex gap-2 mb-6">
            {(["hyderabad", "goa"] as City[]).map((city) => {
              const active = activeCity === city;
              return (
                <button
                  key={city}
                  onClick={() => handleCitySwitch(city)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150"
                  style={
                    active
                      ? { background: "#c8a96e", color: "#080808", border: "1px solid #c8a96e" }
                      : { background: "transparent", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.12)" }
                  }
                >
                  {city === "hyderabad" ? "Hyderabad" : "Goa"}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="mb-6 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${activeCity === "hyderabad" ? "Hyderabad" : "Goa"} developers...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/40 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : activeDevelopers.length === 0 ? (
            <p className="text-slate-500 text-center py-20">No developers found.</p>
          ) : (
            <>
              {(() => {
                return filtered.length === 0 ? (
                  <p className="text-slate-500 text-center py-20">No developers match &ldquo;{query}&rdquo;.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((d) => {
                      const href = d.url_slug ? `/developers/${d.url_slug}` : "#";
                      return (
                        <Link
                          key={d.brand_name}
                          href={href}
                          className="group rounded-2xl border border-white/8 p-5 transition-all duration-200 hover:border-amber-400/25 hover:-translate-y-0.5"
                          style={{ background: "#111" }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-white font-semibold leading-snug pr-2">{d.brand_name}</p>
                            {d.institutional_grade && (
                              <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", borderColor: "rgba(34,197,94,0.25)" }}>
                                Top
                              </span>
                            )}
                          </div>
                          {d.total_projects != null && d.total_projects > 0 && (
                            <div className="mb-3">
                              <p className="text-white font-bold text-lg">{d.total_projects}</p>
                              <p className="text-xs text-slate-500">
                                {activeCity === "goa" ? "Projects in Goa" : "Projects"}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-slate-600 group-hover:text-amber-400/60 transition-colors">
                            View portfolio →
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
