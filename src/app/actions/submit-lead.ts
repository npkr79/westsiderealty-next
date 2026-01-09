"use server";

import { createClient } from "@/lib/supabase/server";

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
  details?: Record<string, any>;
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

    // Prepare data for insertion
    const insertData = {
      name: formData.name.trim(),
      phone: normalizedPhone,
      email: formData.email?.trim() || null,
      type: formData.type,
      source_page: formData.source_page || "unknown",
      details: formData.details || {},
    };

    // Insert into leads table
    const { error } = await supabase.from("leads").insert(insertData);

    if (error) {
      console.error("Error submitting lead to Supabase:", error);
      return {
        success: false,
        error: error.message || "Failed to submit lead. Please try again.",
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Unexpected error in submitLead:", error);
    return {
      success: false,
      error: error?.message || "An unexpected error occurred. Please try again.",
    };
  }
}
