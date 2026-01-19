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

    // Prepare data for insertion - ONLY include fields that exist in the leads table
    const insertData: {
      name: string;
      phone: string;
      email: string | null;
      type: string;
      source_page: string;
      details: Record<string, any>;
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

    insertData.interest_details = interestMessage;
    insertData.lead_source = details.source || details.lead_source || "website";

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
    let error: any = null;
    try {
      const { error: insertError } = await supabase.from("leads").insert(insertData);
      error = insertError;
    } catch (dbError: any) {
      // Catch any unexpected errors during the insert operation
      console.error("Unexpected error during Supabase insert:", {
        error: dbError,
        message: dbError?.message,
        code: dbError?.code,
        details: dbError?.details,
        hint: dbError?.hint,
        stack: dbError?.stack,
      });
      return {
        success: false,
        error: dbError?.message || "Database error occurred. Please try again.",
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
