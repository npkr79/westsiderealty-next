"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface AutomationItem {
  key: string;
  enabled: boolean;
  template_name: string;
  language_code?: string;
}

export default function WhatsAppAutomationPanel() {
  const [items, setItems] = useState<AutomationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/crm/whatsapp/automation/config", { method: "GET" });
    setLoading(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload?.error || "Failed to load automation config.");
      return;
    }
    const payload = await response.json();
    setItems((payload?.config || []) as AutomationItem[]);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConfig();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const updateLocal = (key: string, patch: Partial<AutomationItem>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const saveItem = async (item: AutomationItem) => {
    setSavingKey(item.key);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/crm/whatsapp/automation/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    setSavingKey(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload?.error || "Failed to save automation item.");
      return;
    }
    setMessage(`Saved ${item.key}`);
  };

  const runAutomationNow = async () => {
    setRunning(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/crm/whatsapp/automation/run", { method: "POST" });
    setRunning(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload?.error || "Failed to run automations.");
      return;
    }
    const payload = await response.json();
    setMessage(
      `Automation run complete: site_visit_reminder=${payload.siteVisitRemindersSent}, no_response_followup_48h=${payload.noResponseFollowupsSent}`
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">WhatsApp automation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading automation config...</p> : null}
        {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}

        {items.map((item) => (
          <div key={item.key} className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.key}</p>
              <Checkbox
                checked={item.enabled}
                onCheckedChange={(checked) => updateLocal(item.key, { enabled: Boolean(checked) })}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={item.template_name}
                onChange={(e) => updateLocal(item.key, { template_name: e.target.value })}
                placeholder="Template name"
              />
              <Input
                value={item.language_code || "en"}
                onChange={(e) => updateLocal(item.key, { language_code: e.target.value })}
                placeholder="Language code"
              />
            </div>
            <Button type="button" variant="outline" onClick={() => saveItem(item)} disabled={savingKey === item.key}>
              {savingKey === item.key ? "Saving..." : "Save"}
            </Button>
          </div>
        ))}

        <Button type="button" onClick={runAutomationNow} disabled={running}>
          {running ? "Running..." : "Run scheduled automations now"}
        </Button>
      </CardContent>
    </Card>
  );
}
