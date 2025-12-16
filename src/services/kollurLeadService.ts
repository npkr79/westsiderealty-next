import { createClient } from '@/lib/supabase/server';


import { CreateLandingPageLead } from "@/types/landingPageLead";
const supabase = await createClient();

export interface KollurLeadData {
  full_name: string;
  email: string;
  phone: string;
  requirements_message?: string;
}

export const kollurLeadService = {
  async submitLead(data: KollurLeadData): Promise<void> {
    const leadData = {
      full_name: data.full_name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      lead_type: 'landing_page',
      source_page_url: '/kollur-investment',
      requirements_message: data.requirements_message?.trim() || null,
      status: 'new',
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      budget_range: null,
      location_preference: null,
      project_id: null,
      specific_listing_id: null,
      assigned_to: null
    };

    console.log('Submitting Kollur lead:', leadData);

    const { data: result, error } = await supabase
      .from('all_leads')
      .insert([leadData])
      .select();

    if (error) {
      console.error('Error submitting Kollur lead:', error);
      throw new Error(`Failed to submit your request: ${error.message}`);
    }

    console.log('Lead submitted successfully:', result);
  }
};
