"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toBudgetNumber } from "@/lib/crm/budget";
import { createClient } from "@/lib/supabase/client";

interface InvestorLeadIntakeModalProps {
  disabled?: boolean;
  onCreated?: () => void;
}

type StepIndex = 0 | 1 | 2 | 3;

const stepLabels = ["Basic", "Investment intent", "Capital profiling", "Timeline"] as const;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface LeadSourceOption {
  id: string;
  name: string;
}

const initialForm = {
  name: "",
  phone: "",
  email: "",
  source_id: "",
  buyer_type: "",
  property_type: "",
  location_preference: "",
  budget_min: "",
  budget_max: "",
  capital_size: "",
  ticket_size: "",
  investment_style: "",
  risk_appetite: "",
  timeline: "",
  wealth_bracket: "",
  notes: "",
};

export default function InvestorLeadIntakeModal({ disabled, onCreated }: InvestorLeadIntakeModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<StepIndex>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [sourceOptions, setSourceOptions] = useState<LeadSourceOption[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(form.phone.trim());
    return true;
  }, [form.phone, step]);

  const next = () =>
    setStep((prev) => {
      if (prev === 0) return 1;
      if (prev === 1) return 2;
      return 3;
    });
  const back = () =>
    setStep((prev) => {
      if (prev === 3) return 2;
      if (prev === 2) return 1;
      return 0;
    });

  const reset = () => {
    setForm(initialForm);
    setStep(0);
    setError(null);
    setMessage(null);
  };

  const loadSources = async () => {
    setLoadingSources(true);
    const { data, error: queryError } = await supabase
      .from("crm_lead_sources")
      .select("id,name")
      .order("name", { ascending: true })
      .limit(200);
    setLoadingSources(false);
    if (queryError || !Array.isArray(data)) return;

    const options = data
      .map((row: { id: string | null; name: string | null }) => {
        const id = typeof row.id === "string" ? row.id : "";
        const name = typeof row.name === "string" ? row.name : "";
        if (!UUID_REGEX.test(id) || !name) return null;
        return { id, name };
      })
      .filter((item): item is LeadSourceOption => Boolean(item));

    setSourceOptions(options);
    if (!options.length) return;

    const manualUpload =
      options.find((item) => item.name.toLowerCase() === "manual upload") ||
      options[0];

    setForm((prev) => ({
      ...prev,
      source_id: UUID_REGEX.test(prev.source_id) ? prev.source_id : manualUpload.id,
    }));
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadSources();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, supabase]);

  const submit = async () => {
    if (!form.phone.trim()) {
      setError("Phone is required.");
      return;
    }
    if (!UUID_REGEX.test(form.source_id)) {
      setError("Please select a valid source.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);

    const budgetMin = toBudgetNumber(form.budget_min);
    const budgetMax = toBudgetNumber(form.budget_max);

    const response = await fetch("/api/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        source_id: form.source_id,
        budget_min: budgetMin,
        budget_max: budgetMax,
        location_preference: form.location_preference || null,
        property_type: form.property_type || null,
        buyer_type: form.buyer_type || null,
        timeline: form.timeline || null,
        wealth_bracket: form.wealth_bracket || null,
        investment_style: form.investment_style || null,
        risk_appetite: form.risk_appetite || null,
        notes: form.notes || null,
        attribution_metadata: {},
      }),
    });
    setSaving(false);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload?.error || "Unable to create lead.");
      return;
    }
    setMessage("Lead created successfully.");
    onCreated?.();
    window.setTimeout(() => {
      reset();
      setOpen(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild>
        <Button type="button" disabled={disabled}>Create Lead</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Institutional Investor Intake</DialogTitle>
          <DialogDescription>Create premium lead profile with capital intent signals.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {stepLabels.map((label, index) => (
              <div key={label} className="space-y-1">
                <div className={`h-1 rounded-full transition-all ${index <= step ? "bg-slate-900 dark:bg-slate-100" : "bg-slate-200 dark:bg-slate-700"}`} />
                <p className={`text-xs ${index === step ? "font-semibold" : "text-slate-500 dark:text-slate-400"}`}>{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4">
            {step === 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Source</Label>
                  <Select value={form.source_id || "none"} onValueChange={(value) => setForm((prev) => ({ ...prev, source_id: value === "none" ? "" : value }))}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{loadingSources ? "Loading sources..." : "Select source"}</SelectItem>
                      {sourceOptions.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Buyer type</Label>
                  <Input value={form.buyer_type} onChange={(e) => setForm((prev) => ({ ...prev, buyer_type: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Property type</Label>
                  <Input value={form.property_type} onChange={(e) => setForm((prev) => ({ ...prev, property_type: e.target.value }))} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Location preference</Label>
                  <Input value={form.location_preference} onChange={(e) => setForm((prev) => ({ ...prev, location_preference: e.target.value }))} />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Budget min</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={form.budget_min}
                    onChange={(e) => setForm((prev) => ({ ...prev, budget_min: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Budget max</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={form.budget_max}
                    onChange={(e) => setForm((prev) => ({ ...prev, budget_max: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Capital size</Label>
                  <Input value={form.capital_size} onChange={(e) => setForm((prev) => ({ ...prev, capital_size: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Ticket size</Label>
                  <Input value={form.ticket_size} onChange={(e) => setForm((prev) => ({ ...prev, ticket_size: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Investment style</Label>
                  <Input value={form.investment_style} onChange={(e) => setForm((prev) => ({ ...prev, investment_style: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Risk appetite</Label>
                  <Input value={form.risk_appetite} onChange={(e) => setForm((prev) => ({ ...prev, risk_appetite: e.target.value }))} />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Timeline</Label>
                  <Input value={form.timeline} onChange={(e) => setForm((prev) => ({ ...prev, timeline: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Wealth bracket</Label>
                  <Input value={form.wealth_bracket} onChange={(e) => setForm((prev) => ({ ...prev, wealth_bracket: e.target.value }))} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0 || saving}>Back</Button>
            {step < 3 ? (
              <Button type="button" onClick={next} disabled={!canNext || saving}>Next</Button>
            ) : (
              <Button type="button" onClick={submit} disabled={saving}>
                {saving ? "Creating..." : "Create institutional lead"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

