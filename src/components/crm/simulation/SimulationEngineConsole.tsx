"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type RunSummary = {
  leadsGenerated: number;
  leadsAssigned: number;
  tasksCreated: number;
  missedFollowups: number;
  siteVisits: number;
  negotiations: number;
  closures: number;
  behaviorEvents: number;
  whatsappReplies: number;
  whatsappFollowups: number;
  failures: number;
};

type RunResult = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  summary: RunSummary;
  logs: Array<{ at: string; level: "info" | "error"; message: string }>;
};

type ActivityLog = {
  id: string;
  activity_type: string;
  notes: string | null;
  created_at: string | null;
};

type SchemaSnapshot = {
  fetchedAt: string;
  behaviorTable: "crm_lead_behaviour" | "crm_behavior_events" | null;
  tables: Record<
    string,
    {
      exists: boolean;
      requiredColumns: string[];
      columns: Record<string, { dataType: string; nullable: boolean; required: boolean }>;
    }
  >;
};

const percentDefaults = {
  sourceMeta: 45,
  sourceGoogle: 35,
  sourcePortal: 20,
  buyerEndUser: 65,
  buyerInvestor: 35,
  budgetLow: 35,
  budgetMid: 45,
  budgetHigh: 20,
  agentHigh: 25,
  agentMedium: 55,
  agentLow: 20,
};

export default function SimulationEngineConsole() {
  const [days, setDays] = useState(30);
  const [timeTravelMinutes, setTimeTravelMinutes] = useState(3);
  const [leadsPerDay, setLeadsPerDay] = useState(20);
  const [locations, setLocations] = useState("Kokapet, Narsingi, Financial District, Gachibowli");
  const [missedFollowupRate, setMissedFollowupRate] = useState(25);

  const [siteVisitRate, setSiteVisitRate] = useState(50);
  const [negotiationRate, setNegotiationRate] = useState(35);
  const [closureRate, setClosureRate] = useState(18);

  const [pricingViewRate, setPricingViewRate] = useState(45);
  const [brochureDownloadRate, setBrochureDownloadRate] = useState(28);
  const [repeatVisitRate, setRepeatVisitRate] = useState(40);

  const [waReplyRate, setWaReplyRate] = useState(30);
  const [waFollowupRate, setWaFollowupRate] = useState(55);

  const [pcts, setPcts] = useState(percentDefaults);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [history, setHistory] = useState<ActivityLog[]>([]);
  const [schemaSnapshot, setSchemaSnapshot] = useState<SchemaSnapshot | null>(null);

  const totalProjection = useMemo(() => days * leadsPerDay, [days, leadsPerDay]);

  const loadHistory = async () => {
    const response = await fetch("/api/crm/simulation", { method: "GET" });
    const payload = await response.json().catch(() => ({}));
    setHistory((payload?.logs as ActivityLog[]) || []);
    setSchemaSnapshot((payload?.schema as SchemaSnapshot) || null);
  };

  const runSimulation = async () => {
    setRunning(true);
    setError(null);
    const response = await fetch("/api/crm/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        days,
        timeTravelMinutes,
        leadsPerDay,
        locations: locations
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        budgetDistribution: { low: pcts.budgetLow, mid: pcts.budgetMid, high: pcts.budgetHigh },
        buyerTypeDistribution: { end_user: pcts.buyerEndUser, investor: pcts.buyerInvestor },
        sourceDistribution: { meta: pcts.sourceMeta, google: pcts.sourceGoogle, portal: pcts.sourcePortal },
        agentProductivityDistribution: { high: pcts.agentHigh, medium: pcts.agentMedium, low: pcts.agentLow },
        missedFollowupRate,
        funnel: { siteVisitRate, negotiationRate, closureRate },
        behavior: { pricingViewRate, brochureDownloadRate, repeatVisitRate },
        whatsapp: { replyRate: waReplyRate, followupRate: waFollowupRate },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    setRunning(false);
    if (!response.ok || !payload?.success) {
      setError(payload?.error || "Simulation failed.");
      return;
    }
    setResult(payload.result as RunResult);
    await loadHistory();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Simulation controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value || 1))} placeholder="Days" />
          <Input
            type="number"
            value={timeTravelMinutes}
            onChange={(e) => setTimeTravelMinutes(Number(e.target.value || 1))}
            placeholder="Time travel minutes"
          />
          <Input type="number" value={leadsPerDay} onChange={(e) => setLeadsPerDay(Number(e.target.value || 1))} placeholder="Leads/day" />
          <Textarea
            className="md:col-span-3"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="Locations (comma separated)"
          />
          <Input
            type="number"
            value={missedFollowupRate}
            onChange={(e) => setMissedFollowupRate(Number(e.target.value || 0))}
            placeholder="Missed follow-up %"
          />
          <Input type="number" value={siteVisitRate} onChange={(e) => setSiteVisitRate(Number(e.target.value || 0))} placeholder="Site visit %" />
          <Input
            type="number"
            value={negotiationRate}
            onChange={(e) => setNegotiationRate(Number(e.target.value || 0))}
            placeholder="Negotiation %"
          />
          <Input type="number" value={closureRate} onChange={(e) => setClosureRate(Number(e.target.value || 0))} placeholder="Closure %" />
          <Input
            type="number"
            value={pricingViewRate}
            onChange={(e) => setPricingViewRate(Number(e.target.value || 0))}
            placeholder="Pricing view %"
          />
          <Input
            type="number"
            value={brochureDownloadRate}
            onChange={(e) => setBrochureDownloadRate(Number(e.target.value || 0))}
            placeholder="Brochure download %"
          />
          <Input
            type="number"
            value={repeatVisitRate}
            onChange={(e) => setRepeatVisitRate(Number(e.target.value || 0))}
            placeholder="Repeat visit %"
          />
          <Input type="number" value={waReplyRate} onChange={(e) => setWaReplyRate(Number(e.target.value || 0))} placeholder="WhatsApp reply %" />
          <Input
            type="number"
            value={waFollowupRate}
            onChange={(e) => setWaFollowupRate(Number(e.target.value || 0))}
            placeholder="WhatsApp follow-up %"
          />
          <div className="md:col-span-3 flex items-center justify-between rounded-md border p-3 text-sm">
            <span>Projected lead volume</span>
            <Badge variant={totalProjection > 10000 ? "destructive" : "secondary"}>{totalProjection} leads</Badge>
          </div>
          <div className="md:col-span-3 grid gap-2 sm:grid-cols-3">
            <Input
              type="number"
              value={pcts.sourceMeta}
              onChange={(e) => setPcts((prev) => ({ ...prev, sourceMeta: Number(e.target.value || 0) }))}
              placeholder="Meta %"
            />
            <Input
              type="number"
              value={pcts.sourceGoogle}
              onChange={(e) => setPcts((prev) => ({ ...prev, sourceGoogle: Number(e.target.value || 0) }))}
              placeholder="Google %"
            />
            <Input
              type="number"
              value={pcts.sourcePortal}
              onChange={(e) => setPcts((prev) => ({ ...prev, sourcePortal: Number(e.target.value || 0) }))}
              placeholder="Portal %"
            />
          </div>
          <div className="md:col-span-3">
            <Button type="button" disabled={running} onClick={runSimulation}>
              {running ? "Running simulation..." : "Run simulation"}
            </Button>
            <Button type="button" variant="outline" className="ml-2" disabled={running} onClick={loadHistory}>
              Refresh logs
            </Button>
          </div>
          {error ? <p className="md:col-span-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
        </CardContent>
      </Card>

      {result ? (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Run summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(result.summary).map(([key, value]) => (
                <div key={key} className="rounded border p-2 text-sm">
                  <p className="text-slate-500 dark:text-slate-400">{key}</p>
                  <p className="text-lg font-semibold">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Current run logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.logs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No logs captured in this run.</p>
              ) : (
                result.logs.slice(-40).reverse().map((row, idx) => (
                  <div key={`${row.at}-${idx}`} className="rounded border p-2 text-xs">
                    <p className="font-medium">{row.level.toUpperCase()}</p>
                    <p className="text-slate-500 dark:text-slate-400">{new Date(row.at).toLocaleString()}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">{row.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Logging dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {schemaSnapshot ? (
            <div className="rounded border p-2 text-xs">
              <p className="font-medium">Schema cache</p>
              <p className="text-slate-500 dark:text-slate-400">
                fetched: {new Date(schemaSnapshot.fetchedAt).toLocaleString()} · behavior table:{" "}
                {schemaSnapshot.behaviorTable || "missing"}
              </p>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                {Object.entries(schemaSnapshot.tables).map(([table, info]) => (
                  <p key={table}>
                    {table}: {info.exists ? "present" : "missing"} · required: {info.requiredColumns.length}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No simulation logs yet.</p>
          ) : (
            history.slice(0, 80).map((row) => (
              <div key={row.id} className="rounded border p-2 text-xs">
                <p className="font-medium">{row.activity_type}</p>
                <p className="text-slate-500 dark:text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</p>
                <p className="mt-1 whitespace-pre-wrap break-words">{row.notes || "-"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
