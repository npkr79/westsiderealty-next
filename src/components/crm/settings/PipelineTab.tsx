"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browserClient";

interface StageRow {
  id: string;
  name: string;
  position: number;
  is_active: boolean | null;
}

type Toast = { msg: string; type: "success" | "error" } | null;

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

export default function PipelineTab() {
  const supabase = getBrowserClient();
  const [stages, setStages] = useState<StageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === "success" ? 3000 : 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_lead_stages")
      .select("id, name, position, is_active")
      .order("position");
    if (error) { showToast("Failed to load stages: " + error.message, "error"); }
    setStages((data as StageRow[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const saveRename = async (stageId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) { setEditingStageId(null); return; }
    setSaving(true);
    const { error } = await supabase
      .from("crm_lead_stages")
      .update({ name: trimmed })
      .eq("id", stageId);
    setSaving(false);
    setEditingStageId(null);
    if (error) { showToast("Failed to rename: " + error.message, "error"); return; }
    showToast("Stage renamed.", "success");
    void load();
  };

  const addStage = async () => {
    const trimmed = newStageName.trim();
    if (!trimmed) return;
    setSaving(true);
    const maxPosition = stages.length > 0 ? Math.max(...stages.map(s => s.position)) : 0;
    const { error } = await supabase.from("crm_lead_stages").insert({
      name: trimmed,
      position: maxPosition + 1,
      is_active: true,
    });
    setSaving(false);
    if (error) { showToast("Failed to add stage: " + error.message, "error"); return; }
    showToast("Stage added.", "success");
    setNewStageName("");
    setShowAddForm(false);
    void load();
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

      <p style={sectionHeader}>Pipeline Stages</p>
      <div style={cardWrapper}>
        {loading ? (
          <div style={{ padding: "24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>Loading...</div>
        ) : (
          <>
            {stages.length === 0 ? (
              <div style={{ padding: "24px", fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "center" }}>
                No stages configured.
              </div>
            ) : (
              stages.map((stage, idx) => (
                <div
                  key={stage.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px",
                    borderBottom: idx < stages.length - 1
                      ? "0.5px solid var(--color-border-tertiary)"
                      : "none",
                  }}
                >
                  {/* Position number */}
                  <span style={{
                    fontSize: "13px", color: "var(--color-text-tertiary)",
                    width: "24px", textAlign: "center", flexShrink: 0,
                  }}>
                    {stage.position}
                  </span>

                  {/* Name or inline edit */}
                  {editingStageId === stage.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => void saveRename(stage.id)}
                      onKeyDown={e => {
                        if (e.key === "Enter") void saveRename(stage.id);
                        if (e.key === "Escape") setEditingStageId(null);
                      }}
                      style={{
                        flex: 1, fontSize: "14px", fontWeight: 500,
                        border: "0.5px solid var(--color-border-info)",
                        borderRadius: "var(--border-radius-md)",
                        padding: "4px 8px",
                        background: "var(--color-background-primary)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  ) : (
                    <span style={{
                      flex: 1, fontSize: "14px", fontWeight: 500,
                      color: "var(--color-text-primary)",
                    }}>
                      {stage.name}
                    </span>
                  )}

                  {/* Active badge */}
                  <span style={{
                    padding: "2px 8px", borderRadius: "var(--border-radius-md)",
                    fontSize: "11px", fontWeight: 500,
                    background: stage.is_active ? "var(--color-background-success)" : "var(--color-background-secondary)",
                    color: stage.is_active ? "var(--color-text-success)" : "var(--color-text-secondary)",
                    flexShrink: 0,
                  }}>
                    {stage.is_active ? "Active" : "Inactive"}
                  </span>

                  {/* Rename button */}
                  {editingStageId !== stage.id && (
                    <span
                      onClick={() => { setEditingStageId(stage.id); setEditName(stage.name); }}
                      style={{
                        fontSize: "12px", color: "var(--color-text-secondary)",
                        cursor: "pointer", flexShrink: 0,
                        textDecoration: "underline", textUnderlineOffset: "2px",
                      }}
                    >
                      Rename
                    </span>
                  )}
                  {editingStageId === stage.id && saving && (
                    <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", flexShrink: 0 }}>
                      Saving...
                    </span>
                  )}
                </div>
              ))
            )}

            {/* Add stage inline form */}
            {showAddForm && (
              <div style={{
                padding: "12px 14px",
                borderTop: "0.5px solid var(--color-border-tertiary)",
                background: "var(--color-background-secondary)",
                display: "flex", gap: "8px", alignItems: "center",
              }}>
                <span style={{
                  fontSize: "13px", color: "var(--color-text-tertiary)",
                  width: "24px", textAlign: "center", flexShrink: 0,
                }}>
                  {stages.length > 0 ? Math.max(...stages.map(s => s.position)) + 1 : 1}
                </span>
                <input
                  autoFocus
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") void addStage();
                    if (e.key === "Escape") setShowAddForm(false);
                  }}
                  placeholder="Stage name..."
                  style={{
                    flex: 1, fontSize: "14px", fontWeight: 500,
                    border: "0.5px solid var(--color-border-info)",
                    borderRadius: "var(--border-radius-md)",
                    padding: "4px 8px",
                    background: "var(--color-background-primary)",
                    color: "var(--color-text-primary)",
                  }}
                />
                <button
                  onClick={() => void addStage()}
                  disabled={saving || !newStageName.trim()}
                  style={{
                    fontSize: "12px", padding: "4px 12px",
                    border: "none", borderRadius: "var(--border-radius-md)",
                    background: "var(--color-background-info)",
                    color: "var(--color-text-info)", cursor: "pointer", fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {saving ? "Adding..." : "Add"}
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewStageName(""); }}
                  style={{
                    fontSize: "12px", padding: "4px 10px",
                    border: "0.5px solid var(--color-border-secondary)",
                    borderRadius: "var(--border-radius-md)",
                    background: "transparent",
                    color: "var(--color-text-secondary)", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
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
          + Add Stage
        </button>
      )}

      <div style={{
        padding: "12px 16px", fontSize: "12px",
        color: "var(--color-text-secondary)",
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
      }}>
        Stages cannot be deleted — deletion would break existing leads. Rename or deactivate instead.
      </div>
    </div>
  );
}
