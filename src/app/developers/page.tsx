"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type City = "hyderabad" | "goa";

type Developer = {
  brand_name: string;
  url_slug: string | null;
  total_projects: number | null;
  institutional_grade?: boolean | null;
};

function makeSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function DevelopersPage() {
  const [activeCity, setActiveCity] = useState<City>("hyderabad");
  const [hydDevelopers, setHydDevelopers] = useState<Developer[]>([]);
  const [goaDevelopers, setGoaDevelopers] = useState<Developer[]>([]);
  const [query, setQuery] = useState("");

  const [hydProjectCount, setHydProjectCount] = useState<number | null>(null);
  const [hydDeveloperCount, setHydDeveloperCount] = useState<number | null>(null);
  const [goaProjectCount, setGoaProjectCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [goaLoading, setGoaLoading] = useState(false);
  const goaLoaded = useRef(false);

  // Load Hyderabad data on mount
  useEffect(() => {
    const supabase = makeSupabase();
    (async () => {
      setLoading(true);
      const [{ data }, { count: reraCount }, { count: devCount }] = await Promise.all([
        supabase
          .from("v_developer_brand_profile")
          .select("brand_name, url_slug, total_projects, institutional_grade")
          .order("total_projects", { ascending: false }),
        supabase
          .from("rera_projects")
          .select("id", { count: "exact", head: true })
          .eq("city_slug", "hyderabad"),
        supabase
          .from("developers")
          .select("id", { count: "exact", head: true }),
      ]);
      setHydDevelopers(((data as Developer[]) ?? []) as Developer[]);
      setHydProjectCount(reraCount);
      setHydDeveloperCount(devCount);
      setLoading(false);
    })();
  }, []);

  async function loadGoaDevelopers() {
    if (goaLoaded.current) return;
    goaLoaded.current = true;
    const supabase = makeSupabase();
    setGoaLoading(true);
    try {
      // Step 1: all Goa rera_projects — get IDs and count
      const { data: goaRows, count: goaCount } = await supabase
        .from("rera_projects")
        .select("id", { count: "exact" })
        .eq("city_slug", "goa");

      setGoaProjectCount(goaCount);
      const goaIds = ((goaRows as { id: string }[]) ?? []).map((r) => r.id).filter(Boolean);
      if (!goaIds.length) return;

      // Step 2: developer_project_brand_map for those projects
      const { data: mapRows } = await supabase
        .from("developer_project_brand_map")
        .select("brand_id, project_id")
        .in("project_id", goaIds);

      // Count projects per brand
      const countByBrand: Record<string, number> = {};
      for (const row of (mapRows as { brand_id: string; project_id: string }[]) ?? []) {
        if (!row.brand_id) continue;
        countByBrand[row.brand_id] = (countByBrand[row.brand_id] ?? 0) + 1;
      }
      const brandIds = Object.keys(countByBrand);
      if (!brandIds.length) return;

      // Step 3: developer_brands for name + slug
      const { data: brandRows } = await supabase
        .from("developer_brands")
        .select("id, brand_name, url_slug, institutional_grade")
        .in("id", brandIds);

      const devs: Developer[] = ((brandRows as (Developer & { id: string })[]) ?? [])
        .filter((b) => b.brand_name)
        .map((b) => ({
          brand_name: b.brand_name,
          url_slug: b.url_slug ?? null,
          total_projects: countByBrand[b.id] ?? 0,
          institutional_grade: b.institutional_grade ?? null,
        }))
        .sort((a, b) => (b.total_projects ?? 0) - (a.total_projects ?? 0));

      setGoaDevelopers(devs);
    } finally {
      setGoaLoading(false);
    }
  }

  function handleCitySwitch(city: City) {
    setActiveCity(city);
    setQuery("");
    if (city === "goa") loadGoaDevelopers();
  }

  const developers = activeCity === "hyderabad" ? hydDevelopers : goaDevelopers;
  const isLoading = loading || (activeCity === "goa" && goaLoading);

  const filtered = query.trim()
    ? developers.filter((d) => d.brand_name.toLowerCase().includes(query.toLowerCase()))
    : developers;

  const subtitle =
    activeCity === "goa"
      ? "Delivery history and portfolio data for every major Goa developer."
      : "Delivery history and portfolio data for every major Hyderabad developer.";

  const cityLabel = activeCity === "hyderabad" ? "Hyderabad" : "Goa";

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
                  <div className="rounded-xl border border-white/10 px-5 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-2xl font-bold text-white">{hydDeveloperCount != null ? `${hydDeveloperCount}+` : "500+"}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">Builders tracked</p>
                  </div>
                  {hydProjectCount != null && (
                    <div className="rounded-xl border border-white/10 px-5 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-2xl font-bold text-white">{hydProjectCount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">RERA projects in Hyderabad</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-white/10 px-5 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <p className="text-2xl font-bold text-white">359+</p>
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

          {/* City filter tabs */}
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
              placeholder={`Search ${cityLabel} developers...`}
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
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-center py-20">
              {query ? `No ${cityLabel} developers match "${query}".` : `No ${cityLabel} developers found.`}
            </p>
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
                        <span
                          className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", borderColor: "rgba(34,197,94,0.25)" }}
                        >
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
          )}
        </div>
      </section>
    </main>
  );
}
