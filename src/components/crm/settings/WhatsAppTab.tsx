"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browserClient";

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
  padding: "16px",
};

export default function WhatsAppTab() {
  const supabase = getBrowserClient();
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === "success" ? 3000 : 5000);
  };

  const loadTokenCount = useCallback(async () => {
    setTokenLoading(true);
    const { count } = await supabase
      .from("crm_push_tokens")
      .select("*", { count: "exact", head: true });
    setTokenCount(count ?? 0);
    setTokenLoading(false);
  }, [supabase]);

  useEffect(() => { void loadTokenCount(); }, [loadTokenCount]);

  const clearAllTokens = async () => {
    setClearing(true);
    // Delete all rows — neq on a non-matching UUID is the safe Supabase pattern for "delete all"
    const { error } = await supabase
      .from("crm_push_tokens")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    setClearing(false);
    setClearConfirm(false);
    if (error) { showToast("Failed to clear tokens: " + error.message, "error"); return; }
    showToast("All push tokens cleared.", "success");
    void loadTokenCount();
  };

  // Phone number ID from env (must be NEXT_PUBLIC_ to be available client-side)
  const phoneNumberId = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID ?? null;
  const maskedId = phoneNumberId
    ? `...${phoneNumberId.slice(-4)}`
    : null;

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

      {/* Section 1 — Connection status */}
      <p style={sectionHeader}>WhatsApp Business Connection</p>
      <div style={cardWrapper}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                Phone Number ID
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                {maskedId
                  ? <>Configured — <code style={{ fontSize: "11px", background: "var(--color-background-secondary)", padding: "1px 5px", borderRadius: "3px" }}>{maskedId}</code></>
                  : <span style={{ color: "var(--color-text-danger)" }}>NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID not set</span>
                }
              </div>
            </div>
            <span style={{
              padding: "3px 10px", borderRadius: "var(--border-radius-md)",
              fontSize: "12px", fontWeight: 500,
              background: phoneNumberId ? "var(--color-background-success)" : "var(--color-background-danger)",
              color: phoneNumberId ? "var(--color-text-success)" : "var(--color-text-danger)",
            }}>
              {phoneNumberId ? "Configured" : "Not configured"}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            To update credentials, set <code style={{ fontSize: "11px", background: "var(--color-background-secondary)", padding: "1px 5px", borderRadius: "3px" }}>NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID</code> in your environment.{" "}
            <a
              href="https://developers.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-text-info)", textDecoration: "none" }}
            >
              Configure in Meta Developer Portal →
            </a>
          </div>
        </div>
      </div>

      {/* Section 2 — DB Webhook */}
      <p style={sectionHeader}>Supabase DB Webhook</p>
      <div style={cardWrapper}>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "12px", marginTop: 0 }}>
          Push notifications are powered by a Supabase Database Webhook. If you are not receiving
          push notifications, verify the webhook is configured in{" "}
          <strong>Supabase Dashboard → Database → Webhooks</strong>.
        </p>
        <pre style={{
          fontSize: "11px", lineHeight: "1.7",
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          padding: "12px 14px", margin: 0, overflowX: "auto",
          color: "var(--color-text-primary)",
        }}>
{`URL:    https://www.westsiderealty.in/api/crm/push/new-lead
Events: INSERT, UPDATE
Table:  crm_leads
Auth:   Bearer <CRON_SECRET>`}
        </pre>
      </div>

      {/* Section 3 — Push tokens */}
      <p style={sectionHeader}>Push Notification Tokens</p>
      <div style={cardWrapper}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
              {tokenLoading
                ? "Loading..."
                : `${tokenCount ?? 0} device${tokenCount === 1 ? "" : "s"} registered for push notifications`
              }
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Each CRM user device registers a token when they log in and grant notification permission.
            </div>
          </div>

          {clearConfirm ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-danger)" }}>
                This will log out all devices from push notifications. Continue?
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => void clearAllTokens()}
                  disabled={clearing}
                  style={{
                    fontSize: "12px", padding: "5px 12px",
                    border: "none", borderRadius: "var(--border-radius-md)",
                    background: "var(--color-background-danger)",
                    color: "var(--color-text-danger)", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  {clearing ? "Clearing..." : "Confirm clear"}
                </button>
                <button
                  onClick={() => setClearConfirm(false)}
                  style={{
                    fontSize: "12px", padding: "5px 12px",
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
              onClick={() => setClearConfirm(true)}
              disabled={tokenLoading || tokenCount === 0}
              style={{
                fontSize: "12px", padding: "6px 14px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                background: "transparent",
                color: "var(--color-text-danger)", cursor: "pointer",
                opacity: (tokenLoading || tokenCount === 0) ? 0.4 : 1,
              }}
            >
              Clear all tokens
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
