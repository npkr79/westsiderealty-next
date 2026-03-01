"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RawRow = Record<string, unknown>;

interface AutomationLogRow {
  id: string;
  leadId: string | null;
  leadName: string;
  triggerName: string;
  status: string;
  errorMessage: string | null;
  createdAt: string | null;
}

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asIso = (value: unknown): string | null => {
  const text = asText(value);
  if (!text) return null;
  const dt = new Date(text);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
};

const normalizeStatus = (value: string | null): "success" | "failure" | "other" => {
  const text = String(value || "").toLowerCase();
  if (/success|sent|completed|ok/.test(text)) return "success";
  if (/fail|error|rejected/.test(text)) return "failure";
  return "other";
};

const toDateInputValue = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AutomationMonitorTable() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [rows, setRows] = useState<AutomationLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failure">("all");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const now = new Date();
    setDateFrom(toDateInputValue(now));
    setDateTo(toDateInputValue(now));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const variants = [
        "id,lead_id,trigger_name,status,error_message,created_at",
        "id,lead_id,automation_key,status,error_message,created_at",
        "id,lead_id,trigger_name,execution_status,error_message,created_at",
        "id,lead_id,trigger_name,status,error,created_at",
        "*",
      ];

      let logs: RawRow[] = [];
      let queryError: string | null = null;
      for (const selectClause of variants) {
        const { data, error: loadError } = await supabase
          .from("crm_automation_logs")
          .select(selectClause)
          .order("created_at", { ascending: false })
          .limit(2000);
        if (!loadError) {
          logs = (data as RawRow[]) || [];
          queryError = null;
          break;
        }
        queryError = loadError.message || "Unable to load automation logs.";
        if (!/column .* does not exist/i.test(queryError)) break;
      }

      if (queryError) {
        setError(queryError);
        setLoading(false);
        return;
      }

      const leadIds = Array.from(
        new Set(
          logs
            .map((row) => asText(row.lead_id) || asText(row.crm_lead_id))
            .filter((id): id is string => Boolean(id))
        )
      );

      const leadNameById = new Map<string, string>();
      if (leadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from("crm_leads_view")
          .select("id,name")
          .in("id", leadIds);
        for (const lead of (leadsData as RawRow[]) || []) {
          const id = asText(lead.id);
          if (!id) continue;
          leadNameById.set(id, asText(lead.name) || id);
        }
      }

      const mapped = logs.map((row) => {
        const leadId = asText(row.lead_id) || asText(row.crm_lead_id);
        const triggerName =
          asText(row.trigger_name) ||
          asText(row.automation_key) ||
          asText(row.trigger) ||
          asText(row.event_name) ||
          "Unknown trigger";
        const status =
          asText(row.status) ||
          asText(row.execution_status) ||
          asText(row.result) ||
          "unknown";
        const errorMessage =
          asText(row.error_message) ||
          asText(row.error) ||
          asText(row.failure_reason);
        const createdAt =
          asIso(row.created_at) ||
          asIso(row.executed_at) ||
          asIso(row.updated_at);
        return {
          id: asText(row.id) || crypto.randomUUID(),
          leadId,
          leadName: leadId ? leadNameById.get(leadId) || leadId : "Unknown lead",
          triggerName,
          status,
          errorMessage,
          createdAt,
        } satisfies AutomationLogRow;
      });

      setRows(mapped.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
      setLoading(false);
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [supabase]);

  const filteredRows = useMemo(() => {
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return rows.filter((row) => {
      const status = normalizeStatus(row.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (triggerFilter.trim() && !row.triggerName.toLowerCase().includes(triggerFilter.trim().toLowerCase())) return false;
      if (leadSearch.trim() && !row.leadName.toLowerCase().includes(leadSearch.trim().toLowerCase())) return false;

      if (row.createdAt && (fromDate || toDate)) {
        const createdAt = new Date(row.createdAt);
        if (fromDate && createdAt < fromDate) return false;
        if (toDate && createdAt > toDate) return false;
      }
      return true;
    });
  }, [dateFrom, dateTo, leadSearch, rows, statusFilter, triggerFilter]);

  const todaySummary = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayRows = rows.filter((row) => {
      if (!row.createdAt) return false;
      const created = new Date(row.createdAt);
      return created >= start && created <= end;
    });
    const failures = todayRows.filter((row) => normalizeStatus(row.status) === "failure");
    const failurePct = todayRows.length > 0 ? (failures.length / todayRows.length) * 100 : 0;

    const failingMap = new Map<string, number>();
    for (const row of failures) {
      failingMap.set(row.triggerName, (failingMap.get(row.triggerName) || 0) + 1);
    }
    const mostFailing = Array.from(failingMap.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      totalToday: todayRows.length,
      failuresToday: failures.length,
      failurePct,
      mostFailingTrigger: mostFailing ? `${mostFailing[0]} (${mostFailing[1]})` : "None",
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Total triggers today</p><p className="text-3xl font-semibold">{todaySummary.totalToday}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Failures today</p><p className="text-3xl font-semibold text-rose-600 dark:text-rose-300">{todaySummary.failuresToday}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Failure %</p><p className="text-3xl font-semibold">{todaySummary.failurePct.toFixed(1)}%</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Most failing trigger</p><p className="text-lg font-semibold">{todaySummary.mostFailingTrigger}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Automation logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-5">
            <Select value={statusFilter} onValueChange={(value: "all" | "success" | "failure") => setStatusFilter(value)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Trigger name" value={triggerFilter} onChange={(e) => setTriggerFilter(e.target.value)} />
            <Input placeholder="Lead search" value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
          {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading automation logs...</p> : null}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead name</TableHead>
                  <TableHead>Trigger name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error message</TableHead>
                  <TableHead>Created time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>No automation logs found.</TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const statusKind = normalizeStatus(row.status);
                    return (
                      <TableRow
                        key={row.id}
                        className={row.leadId ? "cursor-pointer" : ""}
                        onClick={() => {
                          if (row.leadId) router.push(`/leads/${row.leadId}`);
                        }}
                      >
                        <TableCell className="font-medium">{row.leadName}</TableCell>
                        <TableCell>{row.triggerName}</TableCell>
                        <TableCell>
                          {statusKind === "failure" ? (
                            <Badge className="border-transparent bg-rose-600 text-white hover:bg-rose-600">failure</Badge>
                          ) : (
                            <Badge variant="secondary">{row.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{row.errorMessage || "-"}</TableCell>
                        <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

