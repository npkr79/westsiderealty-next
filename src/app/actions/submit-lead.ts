"use server";

import { createServiceClient } from "@/lib/supabase/serviceClient";
import { routeLeadByOwnership } from "@/services/crmLeadRoutingService";
import { extractLeadAttribution } from "@/lib/crm/leadAttribution";
import { mapBehaviorToLead } from "@/services/behaviorLeadMappingService";
import { toBudgetNumber } from "@/lib/crm/budget";

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
 * Master server action to submit all leads to crm_leads (universal leads table)
 */
export async function submitLead(formData: SubmitLeadData): Promise<SubmitLeadResponse> {
  try {
    if (!formData.name || !formData.phone) {
      return { success: false, error: "Name and phone number are required" };
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return { success: false, error: "Please enter a valid phone number (at least 10 digits)" };
    }

    const normalizedPhone = phoneDigits.slice(0, 15);
    const serviceClient = createServiceClient();
    const details = formData.details || {};
    const attribution = extractLeadAttribution({ sourcePage: formData.source_page, details });

    const projectName =
      details.projectName || details.project_name || details.project || details.projectTitle || null;

    const notesValue =
      (typeof details.notes === "string" ? details.notes : null) ||
      (typeof details.interest_details === "string" ? details.interest_details : null) ||
      (projectName ? `Interested in ${projectName}.` : null) ||
      (typeof details.message === "string" ? details.message : null) ||
      null;

    const projectId =
      (typeof details.project_id === "string" ? details.project_id : null) ||
      (typeof details.projectId === "string" ? details.projectId : null) ||
      null;

    // Build payload — collect all candidate fields then strip nulls/undefined
    const candidate: Record<string, unknown> = {
      name: formData.name.trim(),
      phone: normalizedPhone,
      email: formData.email?.trim() || null,
      source_type: attribution.source_type || null,
      source_name: attribution.source_name || null,
      landing_page: attribution.landing_page_url || formData.source_page || null,
      notes: notesValue,
      project_id: projectId,
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
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_term: attribution.utm_term,
      utm_content: attribution.utm_content,
      gclid: attribution.gclid,
      fb_lead_id: attribution.fbclid,
      attribution_metadata: attribution.attribution_metadata,
    };

    // Strip null/undefined values to avoid schema cache errors
    const payload = Object.fromEntries(
      Object.entries(candidate).filter(([, v]) => v !== null && v !== undefined)
    );

    console.log("Inserting crm_lead:", { ...payload, phone: "***", email: payload.email ? "***" : undefined });

    const { data: inserted, error: insertError } = await serviceClient
      .from("crm_leads")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      console.error("crm_leads insert error:", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
      return {
        success: false,
        error: insertError.message || "Failed to submit. Please try again.",
      };
    }

    if (inserted?.id) {
      await mapBehaviorToLead(String(inserted.id), normalizedPhone);
      await routeLeadByOwnership({
        leadId: String(inserted.id),
        sourceType: attribution.source_type,
        sourceName: attribution.source_name,
        projectId: projectId,
      });
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Unexpected error in submitLead:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
    };
  }
}
