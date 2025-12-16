
import { createClient } from '@/lib/supabase/server';

import { LandingPageLead, CreateLandingPageLead } from '@/types/landingPageLead';
const supabase = await createClient();

export class LandingPageLeadsApi {
  async submitLead(leadData: CreateLandingPageLead): Promise<void> {
    // Validate required fields
    if (!leadData.name || !leadData.phone || !leadData.email || !leadData.source_page_url) {
      const missingFields = [];
      if (!leadData.name) missingFields.push('name');
      if (!leadData.phone) missingFields.push('phone');
      if (!leadData.email) missingFields.push('email');
      if (!leadData.source_page_url) missingFields.push('source_page_url');
      
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Prepare data for insertion
    const insertData = {
      full_name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      requirements_message: leadData.message,
      source_page_url: leadData.source_page_url,
      lead_type: 'landing_page',
      status: 'new',
    };

    const { error } = await supabase
      .from('all_leads')
      .insert(insertData)
      .select();

    if (error) {
      // Throw the actual Supabase error message
      throw new Error(error.message);
    }
  }

  async getAllLeads(): Promise<LandingPageLead[]> {
    try {
      console.log('🔍 [DEBUG] Starting to fetch all leads...');
      
      const { data, error } = await supabase
        .from('all_leads')
        .select('*')
        .eq('lead_type', 'landing_page')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🚨 [DEBUG] Data fetch error:', error);
        throw error;
      }

      console.log('✅ [DEBUG] Successfully fetched leads:', data?.length || 0);
      console.log('🔍 [DEBUG] Sample lead data:', data?.[0] || 'No leads found');
      
      // Transform to match LandingPageLead interface
      const transformedData = (data || []).map(lead => ({
        ...lead,
        name: lead.full_name,
        message: lead.requirements_message,
      }));
      
      return transformedData as any;
    } catch (error) {
      console.error('🚨 [ERROR] Error in getAllLeads:', error);
      throw new Error('Failed to fetch leads. Please try again or contact support.');
    }
  }

  async getLeadsByPage(sourcePageUrl: string): Promise<LandingPageLead[]> {
    try {
      console.log('🔍 [DEBUG] Fetching leads for page:', sourcePageUrl);
      
      const { data, error } = await supabase
        .from('all_leads')
        .select('*')
        .eq('lead_type', 'landing_page')
        .eq('source_page_url', sourcePageUrl)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🚨 [DEBUG] Error fetching leads by page:', error);
        throw error;
      }

      console.log('✅ [DEBUG] Leads found for page:', data?.length || 0);
      
      // Transform to match LandingPageLead interface
      const transformedData = (data || []).map(lead => ({
        ...lead,
        name: lead.full_name,
        message: lead.requirements_message,
      }));
      
      return transformedData as any;
    } catch (error) {
      console.error('🚨 [ERROR] Error in getLeadsByPage:', error);
      return [];
    }
  }

  async testDatabaseAccess(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🧪 [TEST] Testing database access...');
      
      const { count, error: accessError } = await supabase
        .from('all_leads')
        .select('*', { count: 'exact', head: true })
        .eq('lead_type', 'landing_page');
      
      if (accessError) {
        return { 
          success: false, 
          message: 'Database access failed', 
          details: accessError
        };
      }
      
      console.log('✅ [TEST] Database access: OK');
      
      return { 
        success: true, 
        message: `Database access successful. Found ${count} landing page leads.`,
        details: { totalLeads: count }
      };
      
    } catch (error) {
      console.error('🚨 [TEST] Database test failed:', error);
      return { success: false, message: 'Test failed', details: error };
    }
  }
}
