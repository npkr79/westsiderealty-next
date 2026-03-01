"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type RawRow = Record<string, unknown>;

interface LeadSmartShortlistTabProps {
  leadId: string;
  leadPhone: string;
  currentUserId: string;
}

interface InvestorPreferences {
  id: string | null;
  assetClass: string | null;
  location: string | null;
  ticketMin: number | null;
  ticketMax: number | null;
}

interface SmartProjectRow {
  id: string;
  name: string;
  location: string;
  developer: string;
  assetClass: string;
  ticketMin: number | null;
  ticketMax: number | null;
  yieldPct: number | null;
  irrPct: number | null;
  score: number;
}

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalize = (value: string | null | undefined): string =>
  String(value || "").trim().toLowerCase();

const formatInrRange = (minValue: number | null, maxValue: number | null): string => {
  const format = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  if (minValue && maxValue) return `${format(minValue)} - ${format(maxValue)}`;
  if (maxValue) return format(maxValue);
  if (minValue) return format(minValue);
  return "-";
};

const hasOverlap = (
  prefMin: number | null,
  prefMax: number | null,
  projectMin: number | null,
  projectMax: number | null
): boolean => {
  if (!prefMin && !prefMax) return false;
  const minA = prefMin ?? prefMax ?? 0;
  const maxA = prefMax ?? prefMin ?? Number.MAX_SAFE_INTEGER;
  const minB = projectMin ?? projectMax ?? 0;
  const maxB = projectMax ?? projectMin ?? Number.MAX_SAFE_INTEGER;
  return minA <= maxB && minB <= maxA;
};

export default function LeadSmartShortlistTab({ leadId, leadPhone, currentUserId }: LeadSmartShortlistTabProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<SmartProjectRow[]>([]);
  const [preferences, setPreferences] = useState<InvestorPreferences>({
    id: null,
    assetClass: null,
    location: null,
    ticketMin: null,
    ticketMax: null,
  });
  const [assetFilter, setAssetFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      let preferenceRow: RawRow | null = null;
      const preferenceQueries = [
        supabase.from("crm_investor_preferences").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("crm_investor_preferences").select("*").eq("crm_lead_id", leadId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ];
      for (const query of preferenceQueries) {
        const { data, error: prefError } = await query;
        if (!prefError && data) {
          preferenceRow = data as RawRow;
          break;
        }
      }

      const nextPreferences: InvestorPreferences = {
        id: preferenceRow ? asText(preferenceRow.id) : null,
        assetClass:
          (preferenceRow && (asText(preferenceRow.asset_class) || asText(preferenceRow.asset_type))) ||
          null,
        location:
          (preferenceRow && (asText(preferenceRow.location) || asText(preferenceRow.location_preference) || asText(preferenceRow.micro_market))) ||
          null,
        ticketMin:
          (preferenceRow && (asNumber(preferenceRow.ticket_min) || asNumber(preferenceRow.budget_min))) ||
          null,
        ticketMax:
          (preferenceRow && (asNumber(preferenceRow.ticket_max) || asNumber(preferenceRow.budget_max))) ||
          null,
      };
      setPreferences(nextPreferences);

      const listingVariants = [
        { table: "raw_projects", select: "id,project_name,micro_market,property_type,min_price,max_price,developer_name,rental_yield,irr", order: "updated_at" },
        { table: "projects", select: "id,name,location,asset_type,min_ticket,max_ticket,developer,yield,irr", order: "updated_at" },
      ] as const;

      let listingRows: RawRow[] = [];
      for (const variant of listingVariants) {
        const query = supabase.from(variant.table).select(variant.select).limit(1500);
        const { data, error: listingError } = await query;
        if (!listingError) {
          listingRows = ((data as RawRow[]) || []).map((row) => ({ ...row, __table: variant.table }));
          if (listingRows.length > 0) break;
        }
      }

      if (!listingRows.length) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const prefAsset = normalize(nextPreferences.assetClass);
      const prefLocation = normalize(nextPreferences.location);

      const scored = listingRows
        .map((row) => {
          const assetClass = asText(row.asset_type) || asText(row.property_type) || "Unknown";
          const location = asText(row.location) || asText(row.micro_market) || "Unknown";
          const ticketMin = asNumber(row.min_ticket) || asNumber(row.min_price);
          const ticketMax = asNumber(row.max_ticket) || asNumber(row.max_price);
          const assetMatch = prefAsset ? normalize(assetClass).includes(prefAsset) || prefAsset.includes(normalize(assetClass)) : false;
          const locationMatch = prefLocation ? normalize(location).includes(prefLocation) || prefLocation.includes(normalize(location)) : false;
          const ticketMatch = hasOverlap(nextPreferences.ticketMin, nextPreferences.ticketMax, ticketMin, ticketMax);
          const score = (assetMatch ? 40 : 0) + (locationMatch ? 30 : 0) + (ticketMatch ? 30 : 0);

          return {
            id: asText(row.id) || crypto.randomUUID(),
            name: asText(row.project_name) || asText(row.name) || "Unnamed project",
            location,
            developer: asText(row.developer_name) || asText(row.developer) || "Unknown developer",
            assetClass,
            ticketMin,
            ticketMax,
            yieldPct: asNumber(row.rental_yield) || asNumber(row.yield),
            irrPct: asNumber(row.irr),
            score,
          } satisfies SmartProjectRow;
        })
        .sort((a, b) => b.score - a.score);

      setProjects(scored);
      setLoading(false);
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [leadId, supabase]);

  const assetOptions = useMemo(
    () => Array.from(new Set(projects.map((row) => row.assetClass))).sort((a, b) => a.localeCompare(b)),
    [projects]
  );
  const locationOptions = useMemo(
    () => Array.from(new Set(projects.map((row) => row.location))).sort((a, b) => a.localeCompare(b)),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((row) => {
      if (assetFilter !== "all" && row.assetClass !== assetFilter) return false;
      if (locationFilter !== "all" && row.location !== locationFilter) return false;
      if (ticketFilter === "low" && ((row.ticketMax ?? 0) > 10000000 || !row.ticketMax)) return false;
      if (ticketFilter === "mid" && (row.ticketMax === null || row.ticketMax < 10000000 || row.ticketMax > 30000000)) return false;
      if (ticketFilter === "high" && ((row.ticketMax ?? 0) < 30000000)) return false;
      return true;
    });
  }, [assetFilter, locationFilter, projects, ticketFilter]);

  const summary = useMemo(() => {
    const classMap = new Map<string, number>();
    const locationMap = new Map<string, number>();
    for (const project of filteredProjects) {
      classMap.set(project.assetClass, (classMap.get(project.assetClass) || 0) + 1);
      locationMap.set(project.location, (locationMap.get(project.location) || 0) + 1);
    }
    return {
      mostViewedAssetClass: Array.from(classMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
      mostViewedLocation: Array.from(locationMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
      totalProjectsViewed: filteredProjects.filter((project) => project.score > 0).length,
      shortlistedProjects: filteredProjects.filter((project) => project.score >= 70).length,
    };
  }, [filteredProjects]);

  const savePreferences = async () => {
    setSavingPreferences(true);
    setActionMessage(null);
    const payload = {
      lead_id: leadId,
      asset_class: preferences.assetClass,
      location: preferences.location,
      ticket_min: preferences.ticketMin,
      ticket_max: preferences.ticketMax,
      updated_by: currentUserId,
      updated_at: new Date().toISOString(),
    };
    const { error: upsertError } = preferences.id
      ? await supabase.from("crm_investor_preferences").update(payload).eq("id", preferences.id)
      : await supabase.from("crm_investor_preferences").insert({ ...payload, created_by: currentUserId }).select("id").maybeSingle();
    setSavingPreferences(false);
    if (upsertError) {
      setActionMessage(upsertError.message || "Failed to save preferences.");
      return;
    }
    setActionMessage("Preferences updated.");
    setShowRefine(false);
  };

  const addToShortlist = async (project: SmartProjectRow) => {
    const shortlistCandidates = [
      {
        lead_id: leadId,
        project_id: project.id,
        match_score: project.score,
        created_by: currentUserId,
      },
      {
        lead_id: leadId,
        listing_id: project.id,
        score: project.score,
        created_by: currentUserId,
      },
    ];
    let inserted = false;
    for (const payload of shortlistCandidates) {
      const { error: insertError } = await supabase.from("crm_shortlist_projects").insert(payload);
      if (!insertError) {
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      await supabase.from("crm_lead_activities").insert({
        lead_id: leadId,
        activity_type: "shortlist_add",
        notes: `Added ${project.name} to shortlist (score ${project.score}).`,
        created_by: currentUserId,
      });
    }
    setActionMessage(`Added ${project.name} to shortlist.`);
  };

  const shareViaWhatsApp = async (project: SmartProjectRow) => {
    const response = await fetch("/api/crm/whatsapp/inbox/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        phone: leadPhone,
        mode: "text",
        message: `Recommended project: ${project.name} in ${project.location} by ${project.developer}. Ticket: ${formatInrRange(project.ticketMin, project.ticketMax)}.`,
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setActionMessage(payload?.error || "Failed to share on WhatsApp.");
      return;
    }
    setActionMessage(`Shared ${project.name} on WhatsApp.`);
  };

  const createDeal = async (project: SmartProjectRow) => {
    const dealCandidates = [
      {
        lead_id: leadId,
        name: `${project.name} - Advisory Deal`,
        status: "open",
        value: project.ticketMax ?? project.ticketMin ?? null,
        assigned_to: currentUserId,
      },
      {
        lead_id: leadId,
        deal_name: `${project.name} - Advisory Deal`,
        stage: "open",
        amount: project.ticketMax ?? project.ticketMin ?? null,
        owner_id: currentUserId,
      },
    ];
    for (const payload of dealCandidates) {
      const { error: dealError } = await supabase.from("crm_deals").insert(payload);
      if (!dealError) {
        setActionMessage(`Deal created for ${project.name}.`);
        return;
      }
    }
    setActionMessage("Unable to create deal for this project.");
  };

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading smart shortlist...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Most viewed asset class</p><p className="text-lg font-semibold">{summary.mostViewedAssetClass}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Most viewed location</p><p className="text-lg font-semibold">{summary.mostViewedLocation}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Total projects viewed</p><p className="text-3xl font-semibold">{summary.totalProjectsViewed}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs uppercase text-slate-500">Shortlisted projects</p><p className="text-3xl font-semibold">{summary.shortlistedProjects}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Preference-based project matching</CardTitle>
            <Button type="button" variant="outline" onClick={() => setShowRefine((prev) => !prev)}>
              Refine preferences
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showRefine ? (
            <div className="grid gap-2 md:grid-cols-4">
              <Input
                placeholder="Asset class"
                value={preferences.assetClass || ""}
                onChange={(e) => setPreferences((prev) => ({ ...prev, assetClass: e.target.value || null }))}
              />
              <Input
                placeholder="Location"
                value={preferences.location || ""}
                onChange={(e) => setPreferences((prev) => ({ ...prev, location: e.target.value || null }))}
              />
              <Input
                type="number"
                placeholder="Ticket min"
                value={preferences.ticketMin || ""}
                onChange={(e) => setPreferences((prev) => ({ ...prev, ticketMin: e.target.value ? Number(e.target.value) : null }))}
              />
              <Input
                type="number"
                placeholder="Ticket max"
                value={preferences.ticketMax || ""}
                onChange={(e) => setPreferences((prev) => ({ ...prev, ticketMax: e.target.value ? Number(e.target.value) : null }))}
              />
              <div className="md:col-span-4">
                <Button type="button" onClick={() => void savePreferences()} disabled={savingPreferences}>
                  {savingPreferences ? "Saving..." : "Save preferences"}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 md:grid-cols-3">
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger><SelectValue placeholder="Asset class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All asset classes</SelectItem>
                {assetOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locationOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ticketFilter} onValueChange={setTicketFilter}>
              <SelectTrigger><SelectValue placeholder="Ticket size" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ticket sizes</SelectItem>
                <SelectItem value="low">Up to 1 Cr</SelectItem>
                <SelectItem value="mid">1 Cr to 3 Cr</SelectItem>
                <SelectItem value="high">3 Cr+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {actionMessage ? <p className="text-sm text-slate-600 dark:text-slate-300">{actionMessage}</p> : null}
      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{project.name}</CardTitle>
                <Badge variant={project.score >= 70 ? "default" : "secondary"}>{project.score}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-slate-500 dark:text-slate-400">Location:</span> {project.location}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Developer:</span> {project.developer}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Asset class:</span> {project.assetClass}</p>
              <p><span className="text-slate-500 dark:text-slate-400">Ticket:</span> {formatInrRange(project.ticketMin, project.ticketMax)}</p>
              <p>
                <span className="text-slate-500 dark:text-slate-400">Yield / IRR:</span>{" "}
                {(project.yieldPct ? `${project.yieldPct}%` : "-") + " / " + (project.irrPct ? `${project.irrPct}%` : "-")}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => void addToShortlist(project)}>Add to shortlist</Button>
                <Button size="sm" variant="outline" onClick={() => void shareViaWhatsApp(project)}>Share via WhatsApp</Button>
                <Button size="sm" onClick={() => void createDeal(project)}>Create deal</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

