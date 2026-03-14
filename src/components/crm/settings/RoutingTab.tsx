"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browserClient";

interface RoutingRule {
  id: string;
  source_type: string | null;
  source_name: string | null;
  project_id: string | null;
  agent_id: string | null;
  is_active: boolean | null;
}

interface AgentOption {
  id: string;
  full_name: string | null;
}

type Toast = { msg: string; type: "success" | "error" } | null;

const SOURCE_LABELS: Record<string, string> = {
  website:           "Website",
  meta_ads:          "Meta Ads",
  google_ads:        "Google Ads",
  facebook_lead_ads: "Facebook Lead Ads",
  referral:          "Referral",
  manual:            "Manual",
  landing_page:      "Landing Page",
};

const SOURCE_OPTIONS = Object.keys(SOURCE_LABELS);

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

const inputStyle: React.CSSProperties = {
  fontSize: "13px", padding: "7px 10px",
  border: "0.5px solid var(--color-border-secondary)",
  borderRadius: "var(--border-radius-md)",
  background: "var(--color-background-secondary)",
  color: "var(--color-text-primary)", width: "100%",
};

export default function RoutingTab() {
  const supabase = getBrowserClient();
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ sourceType: "website", sourceName: "", agentId: "" });

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === "success" ? 3000 : 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: ruleData }, { data: agentData }] = await Promise.all([
      supabase
        .from("crm_source_ownership")
        .select("id, source_type, source_name, project_id, agent_id, is_active")
        .order("source_type"),
      supabase
        .from("crm_users")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name"),
    ]);
    setRules((ruleData as RoutingRule[]) ?? []);
    setAgents((agentData as AgentOption[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const handleAddRule = async () => {
    if (!form.agentId) { showToast("Please select an agent.", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("crm_source_ownership").insert({
      source_type: form.sourceType,
      source_name: form.sourceName.trim() || null,
      agent_id: form.agentId,
      is_active: true,
    });
    setSaving(false);
    if (error) { showToast("Failed to add rule: " + error.message, "error"); return; }
    showToast("Routing rule added.", "success");
    setShowAddForm(false);
    setForm({ sourceType: "website", sourceName: "", agentId: "" });
    void load();
  };

  const handleDelete = async (ruleId: string) => {
    const { error } = await supabase
      .from("crm_source_ownership")
      .delete()
      .eq("id", ruleId);
    setDeleteConfirmId(null);
    if (error) { showToast("Failed to delete rule: " + error.message, "error"); return; }
    showToast("Rule deleted.", "success");
    void load();
  };

  const getAgentName = (agentId: string | null) =>
    agents.find(a => a.id === agentId)?.full_name ?? agentId ?? "—";

  const cellStyle: React.CSSProperties = {
    padding: "12px 16px", fontSize: "13px",
    color: "var(--color-text-primary)",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    verticalAlign: "middle",
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 16px", fontSize: "11px", fontWeight: 500,
    color: "var(--color-text-tertiary)", textTransform: "uppercase",
    letterSpacing: "0.05em", textAlign: "left",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
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

      <p style={sectionHeader}>Lead Routing Rules</p>
      <div style={cardWrapper}>
        {loading ? (
          <div style={{ padding: "24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>Loading...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Source Type", "Source Name", "Project", "Assigned Agent", "Active", "Actions"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...cellStyle, textAlign: "center", color: "var(--color-text-secondary)" }}>
                      No routing rules yet.
                    </td>
                  </tr>
                ) : rules.map(rule => (
                  <tr key={rule.id}>
                    <td style={cellStyle}>
                      <span style={{ fontWeight: 500 }}>
                        {SOURCE_LABELS[rule.source_type ?? ""] ?? rule.source_type ?? "—"}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, color: "var(--color-text-secondary)" }}>
                      {rule.source_name || <span style={{ opacity: 0.5 }}>Any</span>}
                    </td>
                    <td style={{ ...cellStyle, color: "var(--color-text-secondary)" }}>
                      {rule.project_id || <span style={{ opacity: 0.5 }}>Any</span>}
                    </td>
                    <td style={cellStyle}>{getAgentName(rule.agent_id)}</td>
                    <td style={cellStyle}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "var(--border-radius-md)",
                        fontSize: "11px", fontWeight: 500,
                        background: rule.is_active ? "var(--color-background-success)" : "var(--color-background-secondary)",
                        color: rule.is_active ? "var(--color-text-success)" : "var(--color-text-secondary)",
                      }}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      {deleteConfirmId === rule.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <span style={{ fontSize: "11px", color: "var(--color-text-danger)" }}>
                            Delete this routing rule? Leads matching this rule will go to pending queue.
                          </span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => void handleDelete(rule.id)}
                              style={{
                                fontSize: "11px", padding: "3px 10px",
                                border: "none", borderRadius: "var(--border-radius-md)",
                                background: "var(--color-background-danger)",
                                color: "var(--color-text-danger)", cursor: "pointer", fontWeight: 500,
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              style={{
                                fontSize: "11px", padding: "3px 10px",
                                border: "0.5px solid var(--color-border-secondary)",
                                borderRadius: "var(--border-radius-md)",
                                background: "transparent",
                                color: "var(--color-text-secondary)", cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(rule.id)}
                          style={{
                            fontSize: "12px", padding: "4px 10px",
                            border: "0.5px solid var(--color-border-secondary)",
                            borderRadius: "var(--border-radius-md)",
                            background: "transparent",
                            color: "var(--color-text-danger)", cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Rule Form */}
        {showAddForm && (
          <div style={{
            padding: "16px",
            borderTop: "0.5px solid var(--color-border-tertiary)",
            background: "var(--color-background-secondary)",
          }}>
            <p style={{ ...sectionHeader, marginTop: 0 }}>New Routing Rule</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Source Type
                </label>
                <select
                  value={form.sourceType}
                  onChange={e => setForm(f => ({ ...f, sourceType: e.target.value }))}
                  style={inputStyle}
                >
                  {SOURCE_OPTIONS.map(s => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Source Name
                </label>
                <input
                  value={form.sourceName}
                  onChange={e => setForm(f => ({ ...f, sourceName: e.target.value }))}
                  placeholder="Leave blank for any"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Assign to Agent
                </label>
                <select
                  value={form.agentId}
                  onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select agent...</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name || a.id}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => void handleAddRule()}
                disabled={saving}
                style={{
                  fontSize: "13px", padding: "7px 16px",
                  border: "none", borderRadius: "var(--border-radius-md)",
                  background: "var(--color-background-info)",
                  color: "var(--color-text-info)", cursor: "pointer", fontWeight: 500,
                }}
              >
                {saving ? "Saving..." : "Add Rule"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  fontSize: "13px", padding: "7px 16px",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  background: "transparent",
                  color: "var(--color-text-secondary)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            fontSize: "13px", padding: "8px 16px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            background: "transparent",
            color: "var(--color-text-primary)", cursor: "pointer",
            marginBottom: "1.5rem",
          }}
        >
          + Add Rule
        </button>
      )}

      {/* Fallback section */}
      <p style={sectionHeader}>Fallback</p>
      <div style={{
        padding: "14px 16px", fontSize: "13px",
        color: "var(--color-text-secondary)",
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
      }}>
        Unmatched leads go to the pending queue in{" "}
        <a href="/routing" style={{ color: "var(--color-text-info)", textDecoration: "none" }}>
          /routing
        </a>.
      </div>
    </div>
  );
}
