"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface QueueRow {
  id: string;
  lead_id: string | null;
  status: string | null;
  scheduled_at: string | null;
  attempts: number | null;
  error_message?: string | null;
  last_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface QueueSummary {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  successRatePct: number;
}

const statusBadgeVariant = (status: string | null): "default" | "secondary" | "outline" | "destructive" => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "default";
  if (normalized === "processing") return "secondary";
  if (normalized === "failed") return "destructive";
  return "outline";
};

export default function JourneyQueueMonitor() {
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const loadMonitor = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/crm/journeys/monitor?limit=300", { method: "GET" });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(payload?.error || "Failed to load journey queue monitor.");
      return;
    }
    setSummary((payload?.summary as QueueSummary) || null);
    setRows(((payload?.rows as QueueRow[]) || []).slice(0, 300));
  }, []);

  const runWorkerNow = useCallback(async () => {
    setRunning(true);
    setError(null);
    const response = await fetch("/api/crm/journeys/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 200 }),
    });
    setRunning(false);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload?.error || "Failed to run journey worker.");
      return;
    }
    loadMonitor();
  }, [loadMonitor]);

  useEffect(() => {
    loadMonitor();
  }, [loadMonitor]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadMonitor();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadMonitor]);

  const failedRows = useMemo(() => rows.filter((row) => String(row.status || "").toLowerCase() === "failed"), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => void runWorkerNow()} disabled={running}>
          {running ? "Running worker..." : "Run worker now"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{summary?.total ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Pending</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{summary?.pending ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Processing</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{summary?.processing ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Completed</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-emerald-600 dark:text-emerald-300">{summary?.completed ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Failed</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-rose-600 dark:text-rose-300">{summary?.failed ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Success rate</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{summary?.successRatePct ?? 100}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Journey queue monitor</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading queue...</p> : null}
          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
          {!loading && rows.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No queue rows found.</p> : null}
          {rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Queue ID</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell className="font-mono text-xs">{row.lead_id || "-"}</TableCell>
                    <TableCell><Badge variant={statusBadgeVariant(row.status)}>{row.status || "unknown"}</Badge></TableCell>
                    <TableCell>{row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : "-"}</TableCell>
                    <TableCell>{row.attempts ?? 0}</TableCell>
                    <TableCell className="max-w-[420px] truncate">{row.error_message || row.last_error || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent failures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {failedRows.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No failed rows.</p>
          ) : (
            failedRows.slice(0, 10).map((row) => (
              <div key={row.id} className="rounded-md border p-2 text-sm">
                <p className="font-medium">{row.id}</p>
                <p className="text-slate-600 dark:text-slate-300">{row.error_message || row.last_error || "Unknown failure"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

