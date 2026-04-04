"use server";

import { submitLead, type SubmitLeadResponse } from "./submit-lead";

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
