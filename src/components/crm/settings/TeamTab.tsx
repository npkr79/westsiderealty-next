"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browserClient";

interface CrmUserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean | null;
  role_id: string | null;
  crm_roles: { name: string } | { name: string }[] | null;
}

interface CrmRoleRow {
  id: string;
  name: string;
}

type Toast = { msg: string; type: "success" | "error" } | null;

const getRoleName = (crm_roles: CrmUserRow["crm_roles"]): string => {
  if (!crm_roles) return "—";
  if (Array.isArray(crm_roles)) return crm_roles[0]?.name ?? "—";
  return crm_roles.name ?? "—";
};

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  admin:           { bg: "var(--color-background-danger)",  color: "var(--color-text-danger)" },
  sales_head:      { bg: "var(--color-background-danger)",  color: "var(--color-text-danger)" },
  team_lead:       { bg: "var(--color-background-warning)", color: "var(--color-text-warning)" },
  agent:           { bg: "var(--color-background-info)",    color: "var(--color-text-info)" },
  marketing:       { bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
  analyst:         { bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
  channel_partner: { bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
};

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

export default function TeamTab() {
  const supabase = getBrowserClient();
  const [users, setUsers] = useState<CrmUserRow[]>([]);
  const [roles, setRoles] = useState<CrmRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === "success" ? 3000 : 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: userData }, { data: roleData }] = await Promise.all([
      supabase
        .from("crm_users")
        .select("id, full_name, is_active, phone, role_id, crm_roles(name)")
        .order("full_name"),
      supabase.from("crm_roles").select("id, name").order("name"),
    ]);
    setUsers((userData as CrmUserRow[]) ?? []);
    setRoles((roleData as CrmRoleRow[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  const handleChangeRole = async (userId: string) => {
    if (!selectedRoleId) return;
    setSavingId(userId);
    const { error } = await supabase
      .from("crm_users")
      .update({ role_id: selectedRoleId })
      .eq("id", userId);
    setSavingId(null);
    setChangingRoleId(null);
    if (error) { showToast("Failed to update role: " + error.message, "error"); return; }
    showToast("Role updated.", "success");
    void load();
  };

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    setSavingId(userId);
    const { error } = await supabase
      .from("crm_users")
      .update({ is_active: !currentlyActive })
      .eq("id", userId);
    setSavingId(null);
    if (error) { showToast("Failed to update status: " + error.message, "error"); return; }
    showToast(currentlyActive ? "User deactivated." : "User activated.", "success");
    void load();
  };

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

      <p style={sectionHeader}>Team Members</p>
      <div style={cardWrapper}>
        {loading ? (
          <div style={{ padding: "24px", fontSize: "13px", color: "var(--color-text-secondary)" }}>Loading...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Role", "Phone", "Status", "Actions"].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...cellStyle, textAlign: "center", color: "var(--color-text-secondary)" }}>
                      No team members found.
                    </td>
                  </tr>
                ) : users.map(user => {
                  const roleName = getRoleName(user.crm_roles);
                  const badge = ROLE_BADGE[roleName] ?? ROLE_BADGE.channel_partner;
                  const isChangingRole = changingRoleId === user.id;

                  return (
                    <tr key={user.id}>
                      <td style={cellStyle}>
                        <span style={{ fontWeight: 500 }}>{user.full_name || "Unnamed"}</span>
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "var(--border-radius-md)",
                          fontSize: "11px", fontWeight: 500,
                          background: badge.bg, color: badge.color,
                        }}>
                          {roleName}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: "var(--color-text-secondary)" }}>
                        {user.phone || "—"}
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "var(--border-radius-md)",
                          fontSize: "11px", fontWeight: 500,
                          background: user.is_active ? "var(--color-background-success)" : "var(--color-background-secondary)",
                          color: user.is_active ? "var(--color-text-success)" : "var(--color-text-secondary)",
                        }}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          {isChangingRole ? (
                            <>
                              <select
                                value={selectedRoleId}
                                onChange={e => setSelectedRoleId(e.target.value)}
                                style={{
                                  fontSize: "12px", padding: "4px 8px",
                                  border: "0.5px solid var(--color-border-secondary)",
                                  borderRadius: "var(--border-radius-md)",
                                  background: "var(--color-background-secondary)",
                                  color: "var(--color-text-primary)", cursor: "pointer",
                                }}
                              >
                                <option value="">Select role...</option>
                                {roles.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => void handleChangeRole(user.id)}
                                disabled={!selectedRoleId || savingId === user.id}
                                style={{
                                  fontSize: "12px", padding: "4px 10px",
                                  border: "none", borderRadius: "var(--border-radius-md)",
                                  background: "var(--color-background-info)",
                                  color: "var(--color-text-info)", cursor: "pointer", fontWeight: 500,
                                }}
                              >
                                {savingId === user.id ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={() => setChangingRoleId(null)}
                                style={{
                                  fontSize: "12px", padding: "4px 10px",
                                  border: "0.5px solid var(--color-border-secondary)",
                                  borderRadius: "var(--border-radius-md)",
                                  background: "transparent",
                                  color: "var(--color-text-secondary)", cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setChangingRoleId(user.id); setSelectedRoleId(user.role_id ?? ""); }}
                              style={{
                                fontSize: "12px", padding: "4px 10px",
                                border: "0.5px solid var(--color-border-secondary)",
                                borderRadius: "var(--border-radius-md)",
                                background: "transparent",
                                color: "var(--color-text-secondary)", cursor: "pointer",
                              }}
                            >
                              Change Role ▾
                            </button>
                          )}
                          <button
                            onClick={() => void handleToggleActive(user.id, Boolean(user.is_active))}
                            disabled={savingId === user.id}
                            style={{
                              fontSize: "12px", padding: "4px 10px",
                              border: "0.5px solid var(--color-border-secondary)",
                              borderRadius: "var(--border-radius-md)",
                              background: "transparent",
                              color: user.is_active ? "var(--color-text-danger)" : "var(--color-text-success)",
                              cursor: "pointer",
                            }}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{
        padding: "12px 16px", fontSize: "12px",
        color: "var(--color-text-secondary)",
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
      }}>
        To add a new team member, contact your system administrator or use the Supabase dashboard.
        User creation requires Supabase Auth provisioning.
      </div>
    </div>
  );
}
