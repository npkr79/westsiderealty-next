"use client";

import { submitLead as saveLead, type SubmitLeadData } from "@/app/actions/submit-lead";
import { submitGodrejLead as saveGodrejLead } from "@/app/actions/campaignLeads";
import { submitAdvisorLead as saveAdvisorLead, type AdvisorLeadData } from "@/app/actions/submit-advisor-lead";
import { withLeadTracking } from "./leadTracking";

export type { LeadType } from "@/app/actions/submit-lead";

export function submitLead(data: SubmitLeadData, formId: string) {
  const payload = data.type === "CORPORATE_OFFICE_LEASING"
    ? { ...data, attribution_metadata: { ...data.attribution_metadata, lead_category: "commercial", form_id: formId } }
    : data;
  return withLeadTracking(() => saveLead(payload), payload, formId);
}

export function submitGodrejLead(data: FormData) {
  return withLeadTracking(() => saveGodrejLead(data), {
    name: "", phone: "", type: "PROJECT_INTEREST",
    source_page: String(data.get("source_page") || "/"),
    attribution_metadata: { project_slug: "godrej-regal-pavilion", city: "hyderabad" },
  }, "godrej_campaign_modal");
}

export function submitAdvisorLead(data: AdvisorLeadData) {
  return withLeadTracking(() => saveAdvisorLead(data), {
    name: "", phone: "", type: "GENERAL_CONTACT", source_page: data.source_page,
  }, "advisor_capture");
}
