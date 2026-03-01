"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toBudgetNumber } from "@/lib/crm/budget";
import { createClient } from "@/lib/supabase/client";

interface CampaignOption {
  id: string;
  name: string;
}

interface LeadSourceOption {
  id: string;
  name: string;
  key: string | null;
}

const defaultCampaigns: CampaignOption[] = [
  { id: "manual_upload", name: "Manual Upload" },
  { id: "meta_leads", name: "Meta Leads" },
  { id: "google_ads_search", name: "Google Ads Search" },
  { id: "landing_page", name: "Landing Page" },
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FALLBACK_MANUAL_UPLOAD_SOURCE_ID = "3f7416d2-4263-4368-8b47-c179fdf6a4c8";

export default function ManualLeadEntryPanel() {
  const [campaigns, setCampaigns] = useState<CampaignOption[]>(defaultCampaigns);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [sources, setSources] = useState<LeadSourceOption[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [manualUploadSourceId, setManualUploadSourceId] = useState<string>(FALLBACK_MANUAL_UPLOAD_SOURCE_ID);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    budgetMin: "",
    budgetMax: "",
    location: "",
    buyerType: "",
    campaignId: defaultCampaigns[0].id,
    campaignName: defaultCampaigns[0].name,
    sourceId: "",
    microMarket: "",
  });

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    const response = await fetch("/api/crm/campaigns");
    setLoadingCampaigns(false);
    if (!response.ok) return;
    const payload = await response.json().catch(() => ({}));
    if (Array.isArray(payload?.campaigns) && payload.campaigns.length > 0) {
      const list = payload.campaigns.map((item: { id: string; name: string }) => ({
        id: item.id,
        name: item.name,
      }));
      setCampaigns(list);
      setForm((prev) => ({
        ...prev,
        campaignId: list[0].id,
        campaignName: list[0].name,
      }));
    }
  };

  const loadSources = async () => {
    setLoadingSources(true);
    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("crm_lead_sources")
      .select("*")
      .order("name", { ascending: true })
      .limit(200);
    setLoadingSources(false);
    if (queryError || !Array.isArray(data)) return;

    const list = data
      .map((row: Record<string, unknown>) => {
        const id = typeof row.id === "string" ? row.id : "";
        if (!UUID_REGEX.test(id)) return null;
        const key =
          typeof row.key === "string"
            ? row.key
            : typeof row.code === "string"
              ? row.code
              : typeof row.slug === "string"
                ? row.slug
                : null;
        const name =
          typeof row.name === "string"
            ? row.name
            : typeof row.label === "string"
              ? row.label
              : key || id;
        return { id, name, key };
      })
      .filter((item): item is LeadSourceOption => Boolean(item));

    setSources(list);

    const manualSource =
      list.find((item) => item.key?.toLowerCase() === "manual_upload") ||
      list.find((item) => item.name.toLowerCase() === "manual upload") ||
      list[0] ||
      null;

    const resolvedManualUploadId =
      manualSource?.id && UUID_REGEX.test(manualSource.id) ? manualSource.id : FALLBACK_MANUAL_UPLOAD_SOURCE_ID;

    setManualUploadSourceId(resolvedManualUploadId);
    setForm((prev) => ({
      ...prev,
      sourceId: prev.sourceId && UUID_REGEX.test(prev.sourceId) ? prev.sourceId : resolvedManualUploadId,
    }));
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCampaigns();
      void loadSources();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }
    const effectiveSourceId =
      form.sourceId && UUID_REGEX.test(form.sourceId)
        ? form.sourceId
        : manualUploadSourceId && UUID_REGEX.test(manualUploadSourceId)
          ? manualUploadSourceId
          : FALLBACK_MANUAL_UPLOAD_SOURCE_ID;

    if (!UUID_REGEX.test(effectiveSourceId)) {
      setError("Lead source is missing. Please select a valid source.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const selectedCampaign = campaigns.find((item) => item.id === form.campaignId);
    const response = await fetch("/api/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        budget_min: toBudgetNumber(form.budgetMin),
        budget_max: toBudgetNumber(form.budgetMax),
        location: form.location || null,
        buyer_type: form.buyerType || null,
        source_id: effectiveSourceId,
        micro_market: form.microMarket || null,
        details: {
          campaign_id: form.campaignId,
          campaign_name: selectedCampaign?.name || form.campaignName,
          source_id: effectiveSourceId,
          micro_market: form.microMarket || null,
        },
      }),
    });
    setSubmitting(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload?.error || "Failed to create lead.");
      return;
    }
    setMessage("Lead added to CRM with attribution captured.");
    setForm((prev) => ({
      ...prev,
      name: "",
      phone: "",
      budgetMin: "",
      budgetMax: "",
      location: "",
      buyerType: "",
      microMarket: "",
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Manual lead entry</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        <Input placeholder="Lead name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
        <Input
          placeholder="Budget min"
          type="number"
          inputMode="numeric"
          value={form.budgetMin}
          onChange={(e) => setForm((prev) => ({ ...prev, budgetMin: e.target.value }))}
        />
        <Input
          placeholder="Budget max"
          type="number"
          inputMode="numeric"
          value={form.budgetMax}
          onChange={(e) => setForm((prev) => ({ ...prev, budgetMax: e.target.value }))}
        />
        <Input placeholder="Location" value={form.location} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
        <Input placeholder="Buyer type" value={form.buyerType} onChange={(e) => setForm((prev) => ({ ...prev, buyerType: e.target.value }))} />
        <Input placeholder="Micro-market" value={form.microMarket} onChange={(e) => setForm((prev) => ({ ...prev, microMarket: e.target.value }))} />

        <Select
          value={form.campaignId}
          onValueChange={(value) => {
            const selectedCampaign = campaigns.find((item) => item.id === value);
            setForm((prev) => ({
              ...prev,
              campaignId: value,
              campaignName: selectedCampaign?.name || value,
            }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCampaigns ? "Loading campaigns..." : "Select campaign"} />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={form.sourceId || "none"}
          onValueChange={(value) => setForm((prev) => ({ ...prev, sourceId: value === "none" ? "" : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingSources ? "Loading lead sources..." : "Select lead source"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select lead source</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error ? <p className="md:col-span-2 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
        {message ? <p className="md:col-span-2 text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}

        <div className="md:col-span-2">
          <Button type="button" onClick={submit} disabled={submitting}>
            {submitting ? "Saving..." : "Create attributed lead"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
