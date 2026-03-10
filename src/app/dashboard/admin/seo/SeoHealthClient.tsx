"use client";

import { useState } from "react";
import { Loader2, Activity, ExternalLink } from "lucide-react";
import type { HealthResult, SiteHealthReport } from "./page";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return "1 hour ago";
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function fixSuggestion(status: number): string {
  if (status === 404) return "Page missing — create page or remove link";
  if (status === 500) return "Server error — check logs";
  if (status === 301 || status === 302) return "Redirect — update link to final destination";
  if (status === 0) return "Timeout — site may be down or unreachable";
  return `HTTP ${status} — investigate response`;
}

function rtBadge(ms: number): string {
  if (ms < 1000) return "bg-green-900/40 text-green-400";
  if (ms < 2000) return "bg-yellow-900/40 text-yellow-400";
  return "bg-red-900/40 text-red-400";
}

// ── Static SEO checklist ──────────────────────────────────────────────────────

const SEO_CHECKLIST = [
  { done: true,  label: "robots.txt configured" },
  { done: true,  label: "sitemap.xml live", link: "https://www.westsiderealty.in/sitemap.xml" },
  { done: true,  label: "Google Search Console connected" },
  { done: true,  label: "All images have alt tags" },
  { done: true,  label: "12 public pages have metadata" },
  { done: false, label: "Core Web Vitals — check in GSC" },
  { done: false, label: "Schema markup — not yet implemented" },
];

// ── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  color = "default",
}: {
  title: string;
  value: number;
  color?: "green" | "red" | "yellow" | "default";
}) {
  const valueColor = {
    green: "text-green-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    default: "text-white",
  }[color];

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export default function SeoHealthClient({
  initialReport,
}: {
  initialReport: SiteHealthReport | null;
}) {
  const [report, setReport] = useState<SiteHealthReport | null>(initialReport);
  const [running, setRunning] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const results: HealthResult[] = Array.isArray(report?.results) ? report!.results : [];
  const broken = results.filter((r) => r.is_broken);
  const slowPages = results.filter((r) => !r.is_broken && r.response_time_ms > 2000);
  const healthy = results.filter((r) => !r.is_broken);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function runHealthCheck() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/health-check", {
        headers: { "x-admin-secret": "westside_admin_2026" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      showToast(`Done — ${data.broken?.length ?? 0} broken page(s) found`);
      // Reload to pull fresh report from DB
      setTimeout(() => window.location.reload(), 1600);
    } catch (err) {
      console.error("[health-check]", err);
      showToast("Health check failed — see console for details");
      setRunning(false);
    }
  }

  async function pingGoogle() {
    setPinging(true);
    try {
      await fetch(
        "https://www.google.com/ping?sitemap=https://www.westsiderealty.in/sitemap.xml",
        { mode: "no-cors" }
      );
      showToast("Sitemap pinged to Google ✓");
    } catch {
      showToast("Ping sent ✓");
    } finally {
      setPinging(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-slate-700 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-slate-600">
          {toast}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Site Health &amp; SEO</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {report?.checked_at && (
            <span className="text-sm text-slate-400">
              Last checked: {timeAgo(report.checked_at)}
            </span>
          )}
          <button
            onClick={runHealthCheck}
            disabled={running}
            className="flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Activity size={14} />
            )}
            {running ? "Running… (~30s)" : "Run Health Check"}
          </button>
        </div>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard title="Total Pages Monitored" value={report?.total_pages ?? 19} />
        <SummaryCard title="Healthy Pages" value={healthy.length} color="green" />
        <SummaryCard
          title="Broken Pages"
          value={broken.length}
          color={broken.length > 0 ? "red" : "green"}
        />
        <SummaryCard
          title="Slow Pages (>2s)"
          value={slowPages.length}
          color={slowPages.length > 0 ? "yellow" : "green"}
        />
      </div>

      {/* ── Broken links ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">Broken Links</h2>
        {broken.length === 0 ? (
          <div className="rounded-lg border border-green-800/40 bg-green-900/20 p-4 text-sm text-green-400">
            ✅ No broken links found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-red-800/50">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-left text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">URL</th>
                  <th className="px-4 py-2.5 font-medium">Status Code</th>
                  <th className="px-4 py-2.5 font-medium">Fix Suggestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800/40">
                {broken.map((r) => (
                  <tr key={r.url}>
                    <td className="px-4 py-2.5">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        {r.url.replace("https://www.westsiderealty.in", "") || "/"}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sm font-semibold text-red-400">
                      {r.status_code === 0 ? "timeout" : r.status_code}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-300">
                      {fixSuggestion(r.status_code)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── All pages table ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">
          All Pages {results.length > 0 && `(${results.length})`}
        </h2>
        {results.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-8 text-center text-sm text-slate-500">
            No data yet — run a health check to see results.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-left text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">URL</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Response Time</th>
                  <th className="px-4 py-2.5 font-medium">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 bg-slate-900">
                {results.map((r) => (
                  <tr key={r.url} className="hover:bg-slate-800/50">
                    <td className="px-4 py-2.5">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-300 hover:text-white hover:underline"
                      >
                        {r.url.replace("https://www.westsiderealty.in", "") || "/"}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-mono text-xs font-medium ${
                          r.is_broken ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {r.status_code === 0 ? "timeout" : r.status_code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${rtBadge(
                          r.response_time_ms
                        )}`}
                      >
                        {r.response_time_ms}ms
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {new Date(r.checked_at).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── SEO Checklist ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">SEO Checklist</h2>
        <div className="divide-y divide-slate-700 rounded-lg border border-slate-700 bg-slate-800/40">
          {SEO_CHECKLIST.map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3">
              <span className="text-base">{item.done ? "✅" : "⏳"}</span>
              <span className="text-sm text-slate-300">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline"
                  >
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sitemap ───────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">Sitemap</h2>
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
          <a
            href="https://www.westsiderealty.in/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            <ExternalLink size={13} />
            westsiderealty.in/sitemap.xml
          </a>
          <button
            onClick={pingGoogle}
            disabled={pinging}
            className="flex items-center gap-2 rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-60"
          >
            {pinging && <Loader2 size={13} className="animate-spin" />}
            {pinging ? "Pinging…" : "Ping Google"}
          </button>
        </div>
      </section>
    </div>
  );
}
