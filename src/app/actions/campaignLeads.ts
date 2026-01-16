"use server";

import { submitLead } from "@/app/actions/submit-lead";

export interface CampaignLeadResponse {
  success: boolean;
  message: string;
}

export async function submitGodrejLead(formData: FormData): Promise<CampaignLeadResponse> {
  try {
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const userType = String(formData.get("user_type") || "").trim();
    const sourcePage = String(formData.get("source_page") || "").trim();

    if (!name || !phone) {
      return {
        success: false,
        message: "Please enter your name and phone number.",
      };
    }

    const response = await submitLead({
      name,
      phone,
      type: "PROJECT_INTEREST",
      source_page: sourcePage || "seo-smart-banner",
      details: {
        project_name: "Godrej Regal Pavilion",
        source: "SEO Smart Banner",
        campaign_id: "godrej-feb-offer",
        user_type: userType || null,
      },
    });

    if (!response.success) {
      return {
        success: false,
        message: response.error || "Something went wrong. Please try again.",
      };
    }

    return {
      success: true,
      message: "Thank you! Our team will contact you shortly.",
    };
  } catch (error: any) {
    console.error("[submitGodrejLead] Unexpected error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
