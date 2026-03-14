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

// Hardcoded Website source UUID — canonical FK to crm_lead_sources
const WEBSITE_SOURCE_ID = "c3b72f38-171b-4ce6-a060-f40beed8bdb4";

// Module-level cache for the Website source_id (persists across warm invocations)
let _websiteSourceId: string | null | undefined = undefined;

async function getWebsiteSourceId(): Promise<string> {
  if (_websiteSourceId !== undefined) return _websiteSourceId ?? WEBSITE_SOURCE_ID;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_lead_sources")
    .select("id")
    .ilike("name", "website%")
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    _websiteSourceId = String(data.id);
    return _websiteSourceId;
  }

  // Fall back to the canonical hardcoded UUID — never return null
  _websiteSourceId = WEBSITE_SOURCE_ID;
  return _websiteSourceId;
}

function buildNotes(details: Record<string, unknown>): string | null {
  // Explicit notes/message fields take priority
  if (typeof details.notes === "string" && details.notes.trim()) return details.notes.trim();
  if (typeof details.interest_details === "string" && details.interest_details.trim()) return details.interest_details.trim();

  // Build from contextual fields
  const parts: string[] = [];
  if (typeof details.message === "string" && details.message.trim()) parts.push(details.message.trim());
  if (details.projectName) parts.push(`Interested in ${details.projectName}`);
  if (details.buyerIntent) parts.push(`Intent: ${details.buyerIntent}`);
  if (details.institution) parts.push(`Institution: ${details.institution}`);
  if (details.ticketSizeInrCrore) parts.push(`Ticket size: ₹${details.ticketSizeInrCrore} Cr`);
  if (details.investorType) parts.push(`Investor type: ${details.investorType}`);
  if (details.additionalDetails) parts.push(String(details.additionalDetails));

  return parts.length > 0 ? parts.join(". ") : null;
}

/**
 * Master server action — inserts into crm_leads only (universal leads table).
 * Column reference: id, name, phone, email, source_id, source_type, source_channel,
 * budget, budget_min, budget_max, location_preference, property_type, buyer_type,
 * timeline, risk_appetite, wealth_bracket, investment_style, investor_type,
 * notes, status, assigned_to, assignment_status, utm_*, gclid, fb_lead_id,
 * landing_page, stage_id, lead_score, priority, attribution_metadata, campaign_id,
 * referral_source, meta_leadgen_id, source_channel
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

    // Look up website source_id — always resolves to the canonical UUID
    const websiteSourceId = await getWebsiteSourceId().catch(() => WEBSITE_SOURCE_ID);

    // Build notes with context from all detail fields
    const notesValue = buildNotes(details);

    // Merge attribution metadata with extra form context
    const attributionMeta: Record<string, unknown> = Object.assign(
      {},
      attribution.attribution_metadata,
      { lead_type: formData.type },
      details.segment ? { segment: details.segment } : {},
      details.institution ? { institution: details.institution } : {},
      details.ticketSizeInrCrore ? { ticket_size_inr_crore: details.ticketSizeInrCrore } : {},
      details.configuration ? { configuration: details.configuration } : {},
      details.expectedPrice ? { expected_price: details.expectedPrice } : {},
      details.qualificationStep ? { qualification_step: details.qualificationStep } : {},
      details.leadPersona ? { lead_persona: details.leadPersona } : {},
      details.triggerContext ? { trigger_context: details.triggerContext } : {},
      details.budgetBand ? { budget_band: details.budgetBand } : {},
    );

    // Build payload — only confirmed crm_leads columns
    const candidate: Record<string, unknown> = {
      name: formData.name.trim(),
      phone: normalizedPhone,
      email: formData.email?.trim() || null,

      // Source tracking
      source_id: websiteSourceId,
      source_type: attribution.source_type || null,
      source_channel: attribution.source_name || formData.type,
      landing_page: attribution.landing_page_url || formData.source_page || null,

      // Notes
      notes: notesValue,

      // Budget — crm_leads.budget is numeric; never pass raw range strings to it
      budget_min: toBudgetNumber(details.budget_min ?? details.budget),
      budget_max: toBudgetNumber(details.budget_max ?? details.budget),
      budget: toBudgetNumber(details.budget_min) ?? toBudgetNumber(details.budget_max) ?? null,

      // Buyer profile
      location_preference:
        (typeof details.location_preference === "string" ? details.location_preference : null) ||
        (typeof details.location === "string" ? details.location : null),
      property_type:
        typeof details.property_type === "string" ? details.property_type :
        Array.isArray(details.propertyTypes) ? (details.propertyTypes as string[]).join(", ") :
        null,
      buyer_type:
        typeof details.buyer_type === "string" ? details.buyer_type :
        typeof details.purpose === "string" ? details.purpose :
        null,
      timeline:
        typeof details.timeline === "string" ? details.timeline :
        typeof details.purchaseTimeline === "string" ? details.purchaseTimeline :
        null,
      wealth_bracket: typeof details.wealth_bracket === "string" ? details.wealth_bracket : null,
      investment_style: typeof details.investment_style === "string" ? details.investment_style : null,
      risk_appetite: typeof details.risk_appetite === "string" ? details.risk_appetite : null,

      // Institutional-specific
      investor_type:
        typeof details.investorType === "string" ? details.investorType :
        typeof details.investor_type === "string" ? details.investor_type :
        null,

      // UTM / attribution
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_term: attribution.utm_term,
      utm_content: attribution.utm_content,
      gclid: attribution.gclid,
      fb_lead_id: attribution.fbclid,
      attribution_metadata: attributionMeta,
    };

    // Strip null/undefined — prevents schema cache errors for missing optional fields
    const payload = Object.fromEntries(
      Object.entries(candidate).filter(([, v]) => v !== null && v !== undefined)
    );

    console.log("Inserting crm_lead:", {
      ...payload,
      phone: "***",
      email: payload.email ? "***" : undefined,
    });

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
      // Post-save actions are non-critical — never let them fail the lead capture
      try {
        await mapBehaviorToLead(String(inserted.id), normalizedPhone);
      } catch (e) {
        console.warn("[submitLead] mapBehaviorToLead failed (non-critical):", e instanceof Error ? e.message : e);
      }
      try {
        await routeLeadByOwnership({
          leadId: String(inserted.id),
          sourceType: attribution.source_type,
          sourceName: attribution.source_name,
          projectId: null,
        });
      } catch (e) {
        console.warn("[submitLead] routeLeadByOwnership failed (non-critical):", e instanceof Error ? e.message : e);
      }
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
