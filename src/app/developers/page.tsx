import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DevelopersSearchPlaceholder from "@/components/developers/DevelopersSearchPlaceholder";

export const metadata: Metadata = {
  title: "Developer Intelligence Index - Telangana",
  description:
    "Structured ranking of RERA registered developers by asset class and project lifecycle.",
};

interface RankedDeveloper {
  developer_slug?: string | null;
  developer_name?: string | null;
  developer_type?: "brand" | "independent" | string | null;
  total_projects?: number | null;
  active_projects?: number | null;
  completed_projects?: number | null;
  residential_projects?: number | null;
  plotted_projects?: number | null;
  commercial_projects?: number | null;
  score?: number | string | null;
}

interface RankingsRpcData {
  residential?: RankedDeveloper[] | null;
  residential_top?: RankedDeveloper[] | null;
  plotted_top?: RankedDeveloper[] | null;
  commercial_top?: RankedDeveloper[] | null;
  meta?: Record<string, unknown> | null;
}

const asDevelopers = (value: unknown): RankedDeveloper[] =>
  Array.isArray(value) ? (value as RankedDeveloper[]) : [];

const RPC_TIMEOUT_MS = 7000;

async function fetchDeveloperRankings() {
  const supabase = await createClient();

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`RPC timeout after ${RPC_TIMEOUT_MS}ms`));
      }, RPC_TIMEOUT_MS);
    });

    const rpcPromise = supabase.rpc("get_developer_rankings");
    const result = await Promise.race([rpcPromise, timeoutPromise]);
    return result as Awaited<typeof rpcPromise>;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown RPC error";
    return {
      data: null,
      error: {
        code: "FETCH_FAILED",
        message,
      },
    };
  }
}

function DeveloperCard({ developer, index }: { developer: RankedDeveloper; index: number }) {
  const slug = String(developer.developer_slug ?? "").trim();
  const name = String(developer.developer_name ?? "Unknown Developer");
  const type = String(developer.developer_type ?? "independent").toLowerCase();
  const total = Number(developer.total_projects ?? 0);
  const active = Number(developer.active_projects ?? 0);
  const completed = Number(developer.completed_projects ?? 0);
  const score = developer.score ?? "—";
  const isBrand = type === "brand";
  const href = slug ? `/developers/${slug}` : "/developers";

  return (
    <article
      key={`${slug || name}-${index}`}
      className="rounded-xl border border-white/5 bg-[#111827] p-4 transition hover:-translate-y-0.5 hover:border-blue-300/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.10)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white leading-tight">{name}</h3>
        <span
          className={`rounded-md px-2 py-1 text-xs ${
            isBrand ? "bg-blue-500/15 text-blue-200" : "bg-slate-500/20 text-slate-200"
          }`}
        >
          {isBrand ? "Brand" : "Independent"}
        </span>
      </div>

      <p className="mt-2 text-xs text-white/55">Score: {score}</p>

      <div className="mt-5">
        <div className="text-3xl font-bold text-white">{total}</div>
        <div className="text-xs uppercase tracking-wide text-white/50">Total Projects</div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="text-emerald-300">Active {active}</span>
        <span className="text-white/45">|</span>
        <span className="text-white/60">Completed {completed}</span>
      </div>

      <div className="mt-5">
        <Link href={href} className="text-sm text-white/85 transition hover:text-white">
          View Intelligence →
        </Link>
      </div>
    </article>
  );
}

export default async function DevelopersDirectoryPage() {
  const { data, error } = await fetchDeveloperRankings();

  console.log("=== DEVELOPERS PAGE RPC NAME ===");
  console.log("RPC FUNCTION:", "get_developer_rankings");
  console.log("=== DEVELOPERS PAGE RAW DATA ===");
  console.log(JSON.stringify(data, null, 2));
  console.log("Residential:", (data as RankingsRpcData | null)?.residential);
  console.log("Residential Top:", (data as RankingsRpcData | null)?.residential_top);
  console.log("Full Response Keys:", Object.keys((data as Record<string, unknown>) || {}));

  if (error) {
    console.warn(
      `[DevelopersDirectory] get_developer_rankings failed (code: ${error.code ?? "unknown"}): ${
        error.message ?? "Unknown error"
      }`
    );
  }

  const rankings = (data ?? {}) as RankingsRpcData;
  const residentialTop = asDevelopers(rankings.residential_top);
  const plottedTop = asDevelopers(rankings.plotted_top);
  const commercialTop = asDevelopers(rankings.commercial_top);

  const hasAnyData =
    residentialTop.length > 0 || plottedTop.length > 0 || commercialTop.length > 0;

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F9FAFB]">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-[#0f1c35] to-slate-900 p-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold">
                Developer Intelligence Index - Telangana
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-white/70">
                Structured ranking of RERA registered developers by asset class and project lifecycle.
              </p>
            </div>

            <div className="grid gap-3 rounded-xl border border-white/10 bg-[#111827]/80 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/65">Total Residential Leaders</span>
                <span className="font-semibold text-white">{residentialTop.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/65">Total Plotted Leaders</span>
                <span className="font-semibold text-white">{plottedTop.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/65">Total Commercial Leaders</span>
                <span className="font-semibold text-white">{commercialTop.length}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Market Leaders by Asset Class</h2>

          {!hasAnyData ? (
            <div className="mt-8 rounded-xl border border-white/10 bg-[#111827] p-8 text-white/70">
              No ranking data available.
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-8">
                <div className="border-b border-white/10 pb-5">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    Residential Market Leaders
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/60">
                    Developers with sustained delivery across key residential micro-markets.
                  </p>
                </div>
                <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {residentialTop.map((developer, index) => (
                    <DeveloperCard
                      key={`${developer.developer_slug ?? developer.developer_name ?? "residential"}-${index}`}
                      developer={developer}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-8">
                <div className="border-b border-white/10 pb-5">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    Plotted Development Specialists
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/60">
                    Specialists in land-led communities and plotted development ecosystems.
                  </p>
                </div>
                <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {plottedTop.map((developer, index) => (
                    <DeveloperCard
                      key={`${developer.developer_slug ?? developer.developer_name ?? "plotted"}-${index}`}
                      developer={developer}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0F172A] p-8">
                <div className="border-b border-white/10 pb-5">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    Commercial Market Leaders
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/60">
                    Institutional-grade developers shaping Hyderabad&apos;s commercial corridors.
                  </p>
                </div>
                <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {commercialTop.map((developer, index) => (
                    <DeveloperCard
                      key={`${developer.developer_slug ?? developer.developer_name ?? "commercial"}-${index}`}
                      developer={developer}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-20 rounded-2xl border border-white/10 bg-[#0F172A] p-8">
          <h2 className="text-2xl font-semibold">Explore All Developers</h2>
          <DevelopersSearchPlaceholder
            allDevelopers={[...residentialTop, ...plottedTop, ...commercialTop]}
          />
        </section>
      </main>
    </div>
  );
}
