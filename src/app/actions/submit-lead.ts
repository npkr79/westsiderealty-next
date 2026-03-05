"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { routeLeadByOwnership } from "@/services/crmLeadRoutingService";
import { extractLeadAttribution } from "@/lib/crm/leadAttribution";
import { mapBehaviorToLead } from "@/services/behaviorLeadMappingService";
import { toBudgetNumber } from "@/lib/crm/budget";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";

export type LeadType = 
  | "PROJECT_INTEREST"
  | "SELLER_VALUATION"
  | "BUYER_REQUIREMENT"
  | "LANDOWNER_SHARE"
  | "GENERAL_CONTACT"
  | "GOA_PROPERTY"
  | "DEVELOPER_INQUIRY";

export interface SubmitLeadData {
  name: string;
  phone: string;
  email?: string | null;
  type: LeadType;
  source_page: string;
  details?: Record<string, unknown>;
}

export interface SubmitLeadResponse {
  success: boolean;
  error?: string;
}

/**
 * Master server action to submit all leads to the centralized leads table
 */
export async function submitLead(formData: SubmitLeadData): Promise<SubmitLeadResponse> {
  try {
    // Validate required fields
    if (!formData.name || !formData.phone) {
      return {
        success: false,
        error: "Name and phone number are required",
      };
    }

    // Basic phone validation (should be at least 10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return {
        success: false,
        error: "Please enter a valid phone number (at least 10 digits)",
      };
    }

    // Normalize phone number (keep only digits, limit to reasonable length)
    const normalizedPhone = phoneDigits.slice(0, 15);

    // Get Supabase client
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Prepare data for insertion - ONLY include fields that exist in the leads table
    const insertData: {
      name: string;
      phone: string;
      email: string | null;
      type: string;
      source_page: string;
      details: Record<string, unknown>;
      source_type?: string | null;
      source_name?: string | null;
      project_id?: string | null;
      assignment_status?: string | null;
      assigned_to?: string | null;
      assigned_agent_id?: string | null;
      interest_details?: string | null;
      status?: string | null;
      stage?: string | null;
      priority?: string | null;
      lead_source?: string | null;
    } = {
      name: formData.name.trim(),
      phone: normalizedPhone,
      email: formData.email?.trim() || null,
      type: formData.type,
      source_page: formData.source_page || "unknown",
      details: formData.details || {},
    };

    const details = formData.details || {};
    const attribution = extractLeadAttribution({
      sourcePage: formData.source_page,
      details,
    });
    const possibleAgentId =
      details.assignedAgentId ||
      details.assigned_agent_id ||
      details.agentId ||
      details.agent_id ||
      null;

    const projectName =
      details.projectName ||
      details.project_name ||
      details.project ||
      details.projectTitle ||
      null;

    const interestMessage =
      details.interest_details ||
      (projectName ? `Interested in ${projectName}.` : null) ||
      details.message ||
      null;

    insertData.interest_details = typeof interestMessage === "string" ? interestMessage : null;
    insertData.lead_source =
      (typeof details.source === "string" ? details.source : null) ||
      (typeof details.lead_source === "string" ? details.lead_source : null) ||
      attribution.source_name;
    insertData.source_type = attribution.source_type;
    insertData.source_name = attribution.source_name;
    insertData.project_id =
      (typeof details.project_id === "string" ? details.project_id : null) ||
      (typeof details.projectId === "string" ? details.projectId : null) ||
      null;
    insertData.assignment_status = "pending";

    if (possibleAgentId) {
      const { data: agent } = await supabase
        .from("raw_agents")
        .select("id, name")
        .eq("id", possibleAgentId)
        .single();

      insertData.assigned_agent_id = agent?.id || possibleAgentId;
      insertData.assigned_to = agent?.name || null;
    }

    // Log the insert payload for debugging (excluding sensitive data)
    console.log("Inserting lead with payload:", {
      ...insertData,
      phone: "***", // Mask phone for privacy
      email: insertData.email ? "***" : null,
    });

    // Insert into leads table with explicit error handling
    let error: { message?: string; code?: string; details?: string; hint?: string } | null = null;
    try {
      const { error: insertError } = await supabase.from("leads").insert(insertData);
      if (insertError?.code === "42501" || /permission denied/i.test(String(insertError?.message ?? ""))) {
        const { error: serviceError } = await serviceClient.from("leads").insert(insertData);
        error = serviceError;
      } else {
        error = insertError;
      }
    } catch (dbError: unknown) {
      const dbMessage = dbError instanceof Error ? dbError.message : "Database error occurred. Please try again.";
      // Catch any unexpected errors during the insert operation
      console.error("Unexpected error during Supabase insert:", {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : undefined,
      });
      return {
        success: false,
        error: dbMessage,
      };
    }

    if (error) {
      // Enhanced error logging for database/trigger errors
      console.error("Supabase insert error - Full error object:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        // PostgreSQL error codes:
        // 42703 = undefined_column
        // P0001 = raise_exception (trigger error)
      });

      // Check if this is a trigger-related error
      if (error.message?.includes("has no field") || error.message?.includes("agent_id")) {
        return {
          success: false,
          error: "Database configuration error detected. Please contact support.",
        };
      }

      return {
        success: false,
        error: error.message || "Failed to submit lead. Please try again.",
      };
    }

    // Mirror to crm_leads with attribution for CRM routing and marketing analytics.
    const crmLeadPayload = {
      name: formData.name.trim(),
      phone: normalizedPhone,
      email: formData.email?.trim() || null,
      source_id: attribution.source_name,
      budget_min: toBudgetNumber(details.budget_min ?? details.budget),
      budget_max: toBudgetNumber(details.budget_max ?? details.budget),
      location_preference:
        (typeof details.location_preference === "string" ? details.location_preference : null) ||
        (typeof details.location === "string" ? details.location : null),
      property_type: typeof details.property_type === "string" ? details.property_type : null,
      buyer_type: typeof details.buyer_type === "string" ? details.buyer_type : null,
      timeline: typeof details.timeline === "string" ? details.timeline : null,
      wealth_bracket: typeof details.wealth_bracket === "string" ? details.wealth_bracket : null,
      investment_style: typeof details.investment_style === "string" ? details.investment_style : null,
      risk_appetite: typeof details.risk_appetite === "string" ? details.risk_appetite : null,
      notes: typeof details.notes === "string" ? details.notes : null,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_term: attribution.utm_term,
      utm_content: attribution.utm_content,
      gclid: attribution.gclid,
      fb_lead_id: attribution.fbclid,
      landing_page: attribution.landing_page_url,
      attribution_metadata: attribution.attribution_metadata,
    };
    const sanitizedCrmLeadPayload = sanitizeLeadPayload(crmLeadPayload);

    const { data: crmInserted, error: crmInsertError } = await serviceClient
      .from("crm_leads")
      .insert(sanitizedCrmLeadPayload)
      .select("id")
      .single();

    if (!crmInsertError && crmInserted?.id) {
      await mapBehaviorToLead(String(crmInserted.id), normalizedPhone);
      await routeLeadByOwnership({
        leadId: String(crmInserted.id),
        sourceType: null,
        sourceName: null,
        projectId: null,
      });
    }

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("Unexpected error in submitLead:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
}
