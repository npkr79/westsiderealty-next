"use client";

import { useState } from "react";
import TeamTab from "@/components/crm/settings/TeamTab";
import RoutingTab from "@/components/crm/settings/RoutingTab";
import AutomationsTab from "@/components/crm/settings/AutomationsTab";
import PipelineTab from "@/components/crm/settings/PipelineTab";
import WhatsAppTab from "@/components/crm/settings/WhatsAppTab";

const TABS = [
  { id: "team",        label: "Team" },
  { id: "routing",     label: "Lead Routing" },
  { id: "automations", label: "Automations" },
  { id: "pipeline",    label: "Pipeline Stages" },
  { id: "whatsapp",    label: "WhatsApp" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("team");

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{
          fontSize: "11px", fontWeight: 500,
          color: "var(--color-text-tertiary)",
          textTransform: "uppercase", letterSpacing: "0.18em",
          margin: 0,
        }}>
          CRM
        </p>
        <h1 style={{
          fontSize: "24px", fontWeight: 600,
          color: "var(--color-text-primary)",
          marginTop: "4px", marginBottom: 0,
        }}>
          Settings
        </h1>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: "flex", gap: "4px", padding: "4px",
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-lg)",
        marginBottom: "1.5rem", overflowX: "auto",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--border-radius-md)",
              border: "none", cursor: "pointer", fontSize: "13px",
              fontWeight: activeTab === tab.id ? 500 : 400,
              background: activeTab === tab.id
                ? "var(--color-background-primary)"
                : "transparent",
              color: activeTab === tab.id
                ? "var(--color-text-primary)"
                : "var(--color-text-secondary)",
              whiteSpace: "nowrap",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "team"        && <TeamTab />}
      {activeTab === "routing"     && <RoutingTab />}
      {activeTab === "automations" && <AutomationsTab />}
      {activeTab === "pipeline"    && <PipelineTab />}
      {activeTab === "whatsapp"    && <WhatsAppTab />}
    </div>
  );
}
