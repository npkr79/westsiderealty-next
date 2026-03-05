import { requireCrmUser } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

interface LinkHealthRow {
  run_id: string;
  url_type: string;
  slug: string;
  full_url: string;
  http_status: number | null;
  is_broken: boolean;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

function typeBadge(type: string) {
  const colors: Record<string, string> = {
    developer: "bg-purple-100 text-purple-700",
    market: "bg-blue-100 text-blue-700",
    project: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${colors[type] ?? "bg-slate-100 text-slate-600"}`}>
      {type}
    </span>
  );
}

export default async function LinkHealthPage() {
  await requireCrmUser(["admin"]);

  const supabase = createServiceClient();

  // Get latest run_id
  const { data: latestRun } = await supabase
    .from("link_health_log")
    .select("run_id, checked_at")
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let rows: LinkHealthRow[] = [];
  if (latestRun?.run_id) {
    const { data } = await supabase
      .from("link_health_log")
      .select("*")
      .eq("run_id", latestRun.run_id)
      .order("is_broken", { ascending: false });
    rows = (data ?? []) as LinkHealthRow[];
  }

  const broken = rows.filter((r) => r.is_broken);
  const healthy = rows.filter((r) => !r.is_broken);
  const lastRunDate = latestRun?.checked_at
    ? new Date(latestRun.checked_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Site Health</p>
        <h1 className="mt-1 text-2xl font-semibold">Link Health Checker</h1>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-sm text-slate-500">
          Last run:{" "}
          <span className="font-medium text-slate-800">{lastRunDate ?? "Never"}</span>
        </div>
        <div className="text-sm text-slate-500">
          Total checked:{" "}
          <span className="font-medium text-slate-800">{rows.length}</span>
        </div>
        <div className="text-sm text-slate-500">
          Broken:{" "}
          {broken.length > 0 ? (
            <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-700">
              {broken.length}
            </span>
          ) : (
            <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-700">
              0
            </span>
          )}
        </div>

        {/* Run now button */}
        <form action="/api/cron/link-checker" method="POST" className="ml-auto">
          <button
            type="submit"
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 active:bg-slate-900"
          >
            Run now
          </button>
        </form>
      </div>

      {/* No data state */}
      {rows.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No runs yet. Click &quot;Run now&quot; to check all links.
        </div>
      )}

      {/* Broken links */}
      {broken.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-red-600">Broken links ({broken.length})</h2>
          <div className="overflow-hidden rounded-lg border border-red-200">
            <table className="w-full text-sm">
              <thead className="bg-red-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">URL</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Time (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 bg-white">
                {broken.map((row) => (
                  <tr key={row.slug + row.url_type} className="hover:bg-red-50">
                    <td className="px-3 py-2">{typeBadge(row.url_type)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.slug}</td>
                    <td className="px-3 py-2">
                      <a
                        href={row.full_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-xs text-blue-600 underline"
                      >
                        {row.full_url}
                      </a>
                    </td>
                    <td className="px-3 py-2 font-semibold text-red-600">
                      {row.http_status === 0 ? "timeout" : row.http_status}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{row.response_time_ms ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full results (collapsible) */}
      {rows.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-600 hover:text-slate-900">
            All results ({rows.length} URLs)
          </summary>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="w-6 px-3 py-2" />
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Time (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {[...broken, ...healthy].map((row) => (
                  <tr key={row.slug + row.url_type} className={row.is_broken ? "bg-red-50" : undefined}>
                    <td className="px-3 py-1.5 text-center text-base">
                      {row.is_broken ? "✗" : "✓"}
                    </td>
                    <td className="px-3 py-1.5">{typeBadge(row.url_type)}</td>
                    <td className="px-3 py-1.5 font-mono text-xs text-slate-700">
                      <a
                        href={row.full_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline"
                      >
                        {row.slug}
                      </a>
                    </td>
                    <td className={`px-3 py-1.5 font-medium ${row.is_broken ? "text-red-600" : "text-green-600"}`}>
                      {row.http_status === 0 ? "timeout" : row.http_status}
                    </td>
                    <td className="px-3 py-1.5 text-slate-400">{row.response_time_ms ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
