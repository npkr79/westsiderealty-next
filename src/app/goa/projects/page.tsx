"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type ComputedStatus = "New Launch" | "Near Completion" | "Under Construction" | "Completed" | "Unknown";

type Project = {
  project_name: string;
  url_slug: string | null;
  current_status: string | null;
  proposed_completion_date: string | null;
  actual_completion_date: string | null;
  micro_market: string | null;
  computed_status: ComputedStatus;
};

function computeStatus(
  current_status: string | null,
  proposed_completion_date: string | null,
  actual_completion_date: string | null,
): ComputedStatus {
  if (actual_completion_date) return "Completed";
  const s = (current_status ?? "").toLowerCase();
  if (s.includes("complet") || s.includes("oc received") || s.includes("handed")) return "Completed";
  if (!proposed_completion_date) {
    if (s.includes("new") || s.includes("upcoming")) return "New Launch";
    return "Unknown";
  }
  const today = Date.now();
  const completion = new Date(proposed_completion_date).getTime();
  const monthsDiff = (completion - today) / (1000 * 60 * 60 * 24 * 30);
  if (monthsDiff < 0) return "Completed";
  if (s.includes("new") || s.includes("upcoming")) {
    return monthsDiff <= 12 ? "Near Completion" : "New Launch";
  }
  return monthsDiff <= 12 ? "Near Completion" : "Under Construction";
}

const STATUS_BADGE: Record<ComputedStatus, { label: string; bg: string; color: string; border: string }> = {
  "New Launch":         { label: "New Launch",         bg: "rgba(34,197,94,0.12)",   color: "#4ade80", border: "rgba(34,197,94,0.3)" },
  "Near Completion":    { label: "Near Completion",    bg: "rgba(168,85,247,0.12)",  color: "#c084fc", border: "rgba(168,85,247,0.3)" },
  "Under Construction": { label: "Under Construction", bg: "rgba(245,158,11,0.12)",  color: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  "Completed":          { label: "Ready to Move",      bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  "Unknown":            { label: "—",                  bg: "rgba(255,255,255,0.06)", color: "#64748b", border: "rgba(255,255,255,0.1)" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }); }
  catch { return d; }
}

const FILTERS = [
  { label: "All",               param: "" },
  { label: "New Launches",      param: "new" },
  { label: "Under Construction",param: "construction" },
  { label: "Ready to Move",     param: "ready" },
];

function matchesFilter(computed: ComputedStatus, param: string): boolean {
  if (!param) return true;
  if (param === "new") return computed === "New Launch";
  if (param === "construction") return computed === "Under Construction" || computed === "Near Completion";
  if (param === "ready") return computed === "Completed";
  return true;
}

function GoaProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get("status") ?? "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchResults, setSearchResults] = useState<Project[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("rera_projects")
        .select("project_name, url_slug, current_status, proposed_completion_date, actual_completion_date, micro_market")
        .eq("city_slug", "goa")
        .order("project_name")
        .limit(1000);

      const all: Project[] = (data as any[] ?? []).map((p) => ({
        ...p,
        computed_status: computeStatus(p.current_status, p.proposed_completion_date, p.actual_completion_date),
      }));
      setProjects(all);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = search.trim();
    if (!term) { setSearchResults(null); setSearchLoading(false); return; }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("rera_projects")
        .select("project_name, url_slug, current_status, proposed_completion_date, actual_completion_date, micro_market")
        .eq("city_slug", "goa")
        .ilike("project_name", `%${term}%`)
        .order("project_name")
        .limit(100);
      const results: Project[] = (data as any[] ?? []).map((p) => ({
        ...p,
        computed_status: computeStatus(p.current_status, p.proposed_completion_date, p.actual_completion_date),
      }));
      setSearchResults(results);
      setSearchLoading(false);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = searchResults !== null
    ? searchResults
    : projects.filter((p) => matchesFilter(p.computed_status, statusParam));

  function setFilter(param: string) {
    const url = new URL(window.location.href);
    url.searchParams.delete("status");
    if (param) url.searchParams.set("status", param);
    router.push(url.pathname + url.search);
  }

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pb-10 px-4" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#c8a96e" }}>
            Goa · RERA Projects
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Every project.<br />Every detail.
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-xl">
            RERA-verified listings across Goa with pricing and possession details.
          </p>

          {/* Nav links */}
          <div className="flex flex-wrap gap-4 mb-2">
            <Link href="/goa" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              ← Goa Home
            </Link>
            <span className="text-slate-700">·</span>
            <Link href="/developers?city=goa" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Goa Developers
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-lg mt-6">
            <input
              type="text"
              placeholder="Search Goa projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/25"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter pills */}
      <div className="border-b border-white/5 px-4">
        <div className="container mx-auto max-w-5xl flex gap-2 overflow-x-auto scrollbar-hide pb-0">
          {FILTERS.map((f) => (
            <button
              key={f.param}
              onClick={() => setFilter(f.param)}
              className="flex-shrink-0 rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide transition-all duration-150 mb-4"
              style={
                statusParam === f.param
                  ? { background: "#c8a96e", color: "#0a0a0a" }
                  : { background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project list */}
      <section className="px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          {loading || searchLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-center py-20">
              {search.trim() ? `No projects matching "${search.trim()}"` : "No projects found."}
            </p>
          ) : (
            <>
              <p className="text-slate-500 text-xs mb-4">
                {search.trim() ? `${filtered.length} results for "${search.trim()}"` : `${filtered.length} projects`}
              </p>
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 border-b border-white/8"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <span>Project</span>
                  <span className="hidden sm:block">Location</span>
                  <span>Status</span>
                  <span className="hidden sm:block">Possession</span>
                </div>
                {filtered.slice(0, 200).map((p, i) => {
                  const badge = STATUS_BADGE[p.computed_status];
                  const href = p.url_slug ? `/goa/projects/${p.url_slug}` : null;
                  const row = (
                    <div
                      key={p.url_slug ?? i}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-4 border-b border-white/5 last:border-0 transition-colors hover:bg-white/4"
                    >
                      <span className="text-white text-sm font-medium leading-snug">{p.project_name}</span>
                      <span className="hidden sm:block text-slate-400 text-xs truncate">{p.micro_market || "—"}</span>
                      <span>
                        <span
                          className="inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                        >
                          {badge.label}
                        </span>
                      </span>
                      <span className="hidden sm:block text-slate-400 text-xs">
                        {p.computed_status === "Completed"
                          ? formatDate(p.actual_completion_date ?? p.proposed_completion_date)
                          : formatDate(p.proposed_completion_date)}
                      </span>
                    </div>
                  );
                  return href ? (
                    <Link key={p.url_slug ?? i} href={href} className="block">
                      {row}
                    </Link>
                  ) : (
                    <div key={i}>{row}</div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function GoaProjectsPage() {
  return (
    <Suspense fallback={<main style={{ background: "#080808", minHeight: "100vh" }} />}>
      <GoaProjectsContent />
    </Suspense>
  );
}
