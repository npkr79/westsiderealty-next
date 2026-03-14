"use client";

import { useEffect, useState } from "react";

interface AutomationConfig {
  key: string;
  enabled: boolean;
  template_name: string;
  language_code: string;
}

type Toast = { msg: string; type: "success" | "error" } | null;

const AUTOMATION_LABELS: Record<string, string> = {
  instant_greeting:        "Instant WhatsApp greeting to lead",
  new_lead_greeting:       "New lead greeting (journey)",
  post_assignment_intro:   "Agent introduction after assignment",
  site_visit_reminder:     "Site visit reminder",
  no_response_followup_48h: "48h no-response follow-up",
};

const AUTOMATION_DESCRIPTIONS: Record<string, string> = {
  instant_greeting:        "Sent immediately when a lead submits any form. Fires before the agent calls.",
  new_lead_greeting:       "Sent via journey worker (2-min delay). Disable if instant_greeting is on.",
  post_assignment_intro:   "Sent when a lead is assigned to an agent.",
  site_visit_reminder:     "Sent when a site visit is scheduled.",
  no_response_followup_48h: "Re-engagement message if lead has not replied in 48 hours.",
};

const INSTANT_GREETING_DEFAULT: AutomationConfig = {
  key: "instant_greeting",
  enabled: true,
  template_name: "westside_greeting_v2",
  language_code: "en",
};

const ORDER = [
  "instant_greeting",
  "new_lead_greeting",
  "post_assignment_intro",
  "site_visit_reminder",
  "no_response_followup_48h",
];

const sectionHeader: React.CSSProperties = {
  fontSize: "11px", fontWeight: 500,
  color: "var(--color-text-tertiary)",
  textTransform: "uppercase", letterSpacing: "0.05em",
  marginBottom: "10px", marginTop: "1.5rem",
};

const cardWrapper: React.CSSProperties = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)",
  overflow: "hidden", marginBottom: "1rem",
};

export default function AutomationsTab() {
  const [configs, setConfigs] = useState<AutomationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === "success" ? 3000 : 5000);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/crm/whatsapp/automation/config");
        const { config } = await res.json();
        const apiConfigs: AutomationConfig[] = Array.isArray(config) ? config : [];

        // Merge: ensure instant_greeting is always present
        const hasInstant = apiConfigs.some(c => c.key === "instant_greeting");
        const merged = hasInstant ? apiConfigs : [INSTANT_GREETING_DEFAULT, ...apiConfigs];

        // Sort by ORDER
        merged.sort((a, b) => {
          const ai = ORDER.indexOf(a.key);
          const bi = ORDER.indexOf(b.key);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        setConfigs(merged);
      } catch {
        showToast("Failed to load automation config.", "error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const updateConfig = (key: string, patch: Partial<AutomationConfig>) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, ...patch } : c));
  };

  const save = async (config: AutomationConfig) => {
    setSavingKey(config.key);
    try {
      const res = await fetch("/api/crm/whatsapp/automation/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: config.key,
          enabled: config.enabled,
          template_name: config.template_name,
          language_code: config.language_code || "en",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Save failed.");
      }
      showToast("Saved.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed.", "error");
    } finally {
      setSavingKey(null);
    }
  };

  const toggleAutomation = async (key: string, newEnabled: boolean) => {
    const config = configs.find(c => c.key === key);
    if (!config) return;
    const updated = { ...config, enabled: newEnabled };
    updateConfig(key, { enabled: newEnabled });
    await save(updated);
  };

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", top: "16px", right: "16px", zIndex: 100,
          padding: "10px 16px", borderRadius: "var(--border-radius-md)",
          background: toast.type === "success" ? "var(--color-background-success)" : "var(--color-background-danger)",
          color: toast.type === "success" ? "var(--color-text-success)" : "var(--color-text-danger)",
          fontSize: "13px", fontWeight: 500, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast.msg}
        </div>
      )}

      <p style={sectionHeader}>WhatsApp Automations</p>
      <div style={cardWrapper}>
        {loading ? (
          <div style={{ padding: "24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>Loading...</div>
        ) : (
          configs.map((config, idx) => (
            <div
              key={config.key}
              style={{
                padding: "16px",
                borderBottom: idx < configs.length - 1
                  ? "0.5px solid var(--color-border-tertiary)"
                  : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    {AUTOMATION_LABELS[config.key] ?? config.key}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "10px" }}>
                    {AUTOMATION_DESCRIPTIONS[config.key] ?? ""}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Template:</span>
                    <input
                      value={config.template_name}
                      onChange={e => updateConfig(config.key, { template_name: e.target.value })}
                      onBlur={() => void save(config)}
                      style={{
                        fontSize: "12px", padding: "3px 8px",
                        border: "0.5px solid var(--color-border-secondary)",
                        borderRadius: "var(--border-radius-md)",
                        background: "var(--color-background-secondary)",
                        color: "var(--color-text-primary)",
                        width: "220px",
                      }}
                    />
                    {savingKey === config.key && (
                      <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Saving...</span>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <div
                  onClick={() => void toggleAutomation(config.key, !config.enabled)}
                  style={{
                    width: "36px", height: "20px", borderRadius: "10px",
                    cursor: "pointer", flexShrink: 0, marginLeft: "16px",
                    background: config.enabled ? "#1D9E75" : "var(--color-border-secondary)",
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: "2px",
                    left: config.enabled ? "18px" : "2px",
                    width: "16px", height: "16px", borderRadius: "50%",
                    background: "#fff", transition: "left 0.2s",
                  }} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{
        padding: "12px 16px", fontSize: "12px",
        color: "var(--color-text-secondary)",
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
      }}>
        Template names must match exactly what is approved in your Meta WhatsApp Business account.
        Changes take effect on the next lead submission.
      </div>
    </div>
  );
}
