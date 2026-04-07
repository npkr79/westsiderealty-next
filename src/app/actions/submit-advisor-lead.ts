"use server";

import { submitLead, type SubmitLeadResponse } from "./submit-lead";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export interface AdvisorLeadData {
  name: string;
  phone: string;
  email?: string;
  source_page: string;
  conversation_id: string;
  projects_discussed: string[];
  intent_signals: string[];
  budget_mentioned?: string;
}

export async function submitAdvisorLead(
  data: AdvisorLeadData
): Promise<SubmitLeadResponse> {
  const projectList = data.projects_discussed.join(", ");

  // Mark the conversation as lead_captured in Supabase (fire-and-forget)
  if (data.conversation_id) {
    try {
      const supabase = createServiceClient();
      await supabase
        .from("advisor_conversations")
        .update({
          lead_captured: true,
          lead_captured_at: new Date().toISOString(),
          status: "lead_captured",
        })
        .eq("id", data.conversation_id);
    } catch (e) {
      console.error("[submit-advisor-lead] failed to update conversation:", e);
    }
  }

  return submitLead({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    type: "PROJECT_INTEREST",
    source_page: data.source_page,
    details: {
      notes: [
        "Lead via AI Advisor chat.",
        projectList ? `Projects discussed: ${projectList}.` : null,
        data.budget_mentioned ? `Budget mentioned: ${data.budget_mentioned}.` : null,
        `Signals: ${data.intent_signals.join(", ")}.`,
      ]
        .filter(Boolean)
        .join(" "),
      location_preference: "Kokapet / Neopolis",
      triggerContext: "ai_advisor_chat",
    },
    attribution_metadata: {
      lead_source: "ai_advisor_chat",
      advisor_conversation_id: data.conversation_id,
      projects_discussed: data.projects_discussed,
      intent_signals: data.intent_signals,
      budget_mentioned: data.budget_mentioned ?? null,
    },
  });
}
