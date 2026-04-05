"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
const FILTERS = [
  { label: "All", param: "" },
  { label: "New Launches", param: "new" },
  { label: "Under Construction", param: "construction" },
  { label: "Ready to Move", param: "ready" },
  { label: "Investment Picks", param: "investment" },
];

type ComputedStatus = "New Launch" | "Near Completion" | "Under Construction" | "Completed" | "Unknown";

type Project = {
  project_name: string;
  url_slug: string;
  current_status: string | null;
  proposed_completion_date: string | null;
  actual_completion_date: string | null;
  micro_market: string | null;
  rera_id?: string | null;
  computed_status: ComputedStatus;
  _priority?: number;
};

// Derives a consistent status from the raw RERA fields + date math
function computeStatus(
  current_status: string | null,
  proposed_completion_date: string | null,
  actual_completion_date: string | null,
): ComputedStatus {
  // Actual completion date → definitely done
  if (actual_completion_date) return "Completed";

  const s = (current_status ?? "").toLowerCase();

  // Explicit completed signals in the status string
  if (s.includes("complet") || s.includes("oc received") || s.includes("handed")) return "Completed";

  // Date math — requires proposed_completion_date
  if (!proposed_completion_date) {
    if (s.includes("new") || s.includes("upcoming")) return "New Launch";
    return "Unknown";
  }

  const today = Date.now();
  const completion = new Date(proposed_completion_date).getTime();
  const monthsDiff = (completion - today) / (1000 * 60 * 60 * 24 * 30);

  // Past completion date → treat as completed
  if (monthsDiff < 0) return "Completed";

  // "New Project" with future date: use time-to-completion to classify
  if (s.includes("new") || s.includes("upcoming")) {
    if (monthsDiff <= 12) return "Near Completion";
    return "New Launch";
  }

  // On-going / active projects
  if (monthsDiff <= 12) return "Near Completion";
  return "Under Construction";
}

function matchesFilter(computed: ComputedStatus, param: string): boolean {
  if (!param) return true;
  if (param === "new") return computed === "New Launch";
  if (param === "construction") return computed === "Under Construction" || computed === "Near Completion";
  if (param === "ready") return computed === "Completed";
  return true;
}

const STATUS_BADGE: Record<ComputedStatus, { label: string; cls: string }> = {
  "New Launch": { label: "New Launch", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-400/30" },
  "Near Completion": { label: "Near Completion", cls: "bg-violet-500/15 text-violet-400 border-violet-400/30" },
  "Under Construction": { label: "Under Construction", cls: "bg-amber-500/15 text-amber-400 border-amber-400/30" },
  "Completed": { label: "Ready to Move", cls: "bg-blue-500/15 text-blue-400 border-blue-400/30" },
  "Unknown": { label: "—", cls: "bg-white/8 text-slate-500 border-white/10" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }); }
  catch { return d; }
}

function ProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusParam = searchParams.get("status") ?? "";
  const tagParam = searchParams.get("tag") ?? "";

  const activeFilter = tagParam === "investment" ? "investment" : statusParam;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Project[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Initial load: MV data + priority set, used for filter tabs
  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: mvData } = await supabase
        .from("listing_project_detail_enriched_mv")
        .select("project_name, url_slug, current_status, proposed_completion_date, actual_completion_date, micro_market, rera_id")
        .eq("city_slug", "hyderabad")
        .limit(500);

      let investmentSlugSet = new Set<string>();
      let prioritySlugSet = new Set<string>();

      const { data: queueData } = await supabase
        .from("project_intelligence_queue")
        .select("project_id, priority, status");

      if (queueData && queueData.length > 0) {
        const p1DoneIds = queueData
          .filter((q: any) => q.priority === 1 && q.status === "done")
          .map((q: any) => q.project_id as string);
        const p1Ids = queueData
          .filter((q: any) => q.priority === 1)
          .map((q: any) => q.project_id as string);

        if (p1Ids.length > 0) {
          const { data: reraRows } = await supabase
            .from("rera_projects")
            .select("id, url_slug")
            .in("id", p1Ids.slice(0, 100));

          (reraRows as any[] ?? []).forEach((r) => {
            if (r.url_slug) investmentSlugSet.add(r.url_slug);
            if (p1DoneIds.includes(r.id) && r.url_slug) prioritySlugSet.add(r.url_slug);
          });
        }
      }

      const allProjects: Project[] = (mvData as any[] ?? []).map((p) => ({
        ...p,
        computed_status: computeStatus(p.current_status, p.proposed_completion_date, p.actual_completion_date),
        _priority: prioritySlugSet.has(p.url_slug) ? 1
          : investmentSlugSet.has(p.url_slug) ? 2
          : 4,
      }));

      allProjects.sort((a, b) => {
        if (a._priority !== b._priority) return (a._priority ?? 4) - (b._priority ?? 4);
        return a.project_name.localeCompare(b.project_name);
      });

      setProjects(allProjects);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search: debounced DB query via rera_projects ILIKE
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const term = search.trim();
    if (!term) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("rera_projects")
        .select("project_name, url_slug, current_status, proposed_completion_date")
        .eq("city_slug", "hyderabad")
        .ilike("project_name", `%${term}%`)
        .order("project_name")
        .limit(50);

      const results: Project[] = (data as any[] ?? [])
        .filter((r) => r.url_slug)
        .map((r) => ({
          project_name: r.project_name,
          url_slug: r.url_slug,
          current_status: r.current_status,
          proposed_completion_date: r.proposed_completion_date,
          actual_completion_date: null,
          micro_market: null,
          rera_id: null,
          computed_status: computeStatus(r.current_status, r.proposed_completion_date, null),
          _priority: 4,
        }));

      setSearchResults(results);
      setSearchLoading(false);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Display: search results override filter view when search is active
  const filtered = searchResults !== null
    ? searchResults
    : projects.filter((p) => {
        if (activeFilter === "investment") return (p._priority ?? 4) <= 2;
        if (activeFilter) return matchesFilter(p.computed_status, activeFilter);
        return true;
      });

  function setFilter(param: string) {
    const url = new URL(window.location.href);
    url.searchParams.delete("status");
    url.searchParams.delete("budget");
    url.searchParams.delete("tag");
    if (param === "investment") url.searchParams.set("tag", "investment");
    else if (param) url.searchParams.set("status", param);
    router.push(url.pathname + url.search);
  }

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pb-10 px-4" style={{ paddingTop: 88, background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}>
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#c8a96e" }}>
            Hyderabad · RERA Projects
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Every project.<br />Every detail.
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-xl">
            RERA-verified listings with pricing, possession dates, and AI insights.
          </p>
          <div className="relative max-w-lg">
            <input
              type="text"
              placeholder="Search projects or markets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/25"
            />
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
                activeFilter === f.param
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
                  <span className="hidden sm:block">Market</span>
                  <span>Status</span>
                  <span className="hidden sm:block">Possession</span>
                </div>
                {filtered.slice(0, 150).map((p) => {
                  const badge = STATUS_BADGE[p.computed_status];
                  return (
                    <Link
                      key={p.url_slug}
                      href={`/hyderabad/projects/${p.url_slug}`}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-4 border-b border-white/5 transition-colors hover:bg-white/4 last:border-0"
                    >
                      <span className="text-white text-sm font-medium leading-snug">
                        {p._priority === 1 && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 mb-0.5" />
                        )}
                        {p.project_name}
                      </span>
                      <span className="hidden sm:block text-slate-400 text-xs truncate">{p.micro_market || "—"}</span>
                      <span>
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </span>
                      <span className="hidden sm:block text-slate-400 text-xs">
                        {p.computed_status === "Completed"
                          ? formatDate(p.actual_completion_date ?? p.proposed_completion_date)
                          : formatDate(p.proposed_completion_date)}
                      </span>
                    </Link>
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

export default function ProjectsHubPage() {
  return (
    <Suspense fallback={<main style={{ background: "#080808", minHeight: "100vh" }} />}>
      <ProjectsContent />
    </Suspense>
  );
}
