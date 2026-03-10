"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Developer = {
  brand_name: string;
  url_slug: string | null;
  total_projects: number | null;
  is_premium: boolean | null;
  institutional_grade: boolean | null;
};

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [query, setQuery] = useState("");
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [developerCount, setDeveloperCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

      setDevelopers(((data as any[]) ?? []) as Developer[]);
      setProjectCount(reraCount);
      setDeveloperCount(devCount);
      setLoading(false);
    })();
  }, []);

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
          <p className="text-slate-400 text-lg max-w-xl">
            Delivery history and portfolio data for every major Hyderabad developer.
          </p>
          {!loading && (
            <div className="flex flex-wrap gap-4 mt-10">
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
            </div>
          )}
        </div>
      </section>

      {/* Developer grid */}
      <section className="px-4 py-8 pb-20">
        <div className="container mx-auto max-w-5xl">
          {/* Search */}
          <div className="mb-6 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search developers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/4 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400/40 transition-colors"
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

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : developers.length === 0 ? (
            <p className="text-slate-500 text-center py-20">No developers found.</p>
          ) : (
            <>
              {(() => {
                const filtered = query.trim()
                  ? developers.filter((d) => d.brand_name.toLowerCase().includes(query.toLowerCase()))
                  : developers;
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
                              <p className="text-xs text-slate-500">Projects</p>
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
