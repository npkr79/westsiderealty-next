"use server";

import { createClient } from "@/lib/supabase/server";

export interface CampaignLeadResponse {
  success: boolean;
  message: string;
}

export async function submitGodrejLead(formData: FormData): Promise<CampaignLeadResponse> {
  try {
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const userType = String(formData.get("user_type") || "").trim();

    if (!name || !phone) {
      return {
        success: false,
        message: "Please enter your name and phone number.",
      };
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      return {
        success: false,
        message: "Please enter a valid 10-digit phone number.",
      };
    }

    const supabase = await createClient();

    const insertPayload = {
      name,
      phone: phoneDigits,
      user_type: userType || null,
      project_name: "Godrej Regal Pavilion",
      source: "SEO Smart Banner",
      campaign_id: "godrej-feb-offer",
    };

    const { error } = await supabase.from("leads").insert(insertPayload);

    if (error) {
      console.error("[submitGodrejLead] Supabase insert error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return {
        success: false,
        message: "Something went wrong. Please try again.",
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
