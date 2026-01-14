"use server";

import { agentRecruitmentService } from "@/services/agentRecruitmentService";
import type { AgentApplicationData } from "@/services/agentRecruitmentService";

export interface SubmitAgentApplicationResponse {
  success: boolean;
  error?: string;
}

export async function submitAgentApplication(
  applicationData: AgentApplicationData
): Promise<SubmitAgentApplicationResponse> {
  try {
    await agentRecruitmentService.submitApplication(applicationData);
    return { success: true };
  } catch (error) {
    console.error("[submitAgentApplication] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit application",
    };
  }
}
