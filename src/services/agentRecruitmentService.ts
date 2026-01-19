import { createClient } from '@/lib/supabase/server';

export interface AgentRecruitmentPage {
  id: string;
  hero_headline: string;
  hero_subheadline?: string | null;
  hero_description?: string | null;
  hero_image_url?: string | null;
  hero_cta_primary_text: string;
  hero_cta_secondary_text: string;
  hero_trust_indicator?: string | null;
  why_join_title: string;
  why_join_subtitle?: string | null;
  value_pillars: ValuePillar[];
  success_stories_title: string;
  success_stories_subtitle?: string | null;
  success_stories: SuccessStory[];
  what_we_offer_title: string;
  what_we_offer_subtitle?: string | null;
  benefits: Benefit[];
  requirements_title: string;
  requirements_subtitle?: string | null;
  requirements_list: string[];
  what_we_look_for?: string | null;
  application_process_steps: ProcessStep[];
  faq_title: string;
  faq_subtitle?: string | null;
  faqs: FAQ[];
  final_cta_title: string;
  final_cta_description?: string | null;
  final_cta_button_text: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ValuePillar {
  icon: string;
  title: string;
  description: string;
}

export interface SuccessStory {
  name: string;
  photo_url?: string | null;
  testimonial: string;
  metrics?: {
    earnings?: string;
    deals?: string;
    years?: string;
  };
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface AgentApplicationData {
  full_name: string;
  email: string;
  phone: string;
  experience_years?: string;
  current_location?: string;
  why_join?: string;
  resume_url?: string;
}

export const agentRecruitmentService = {
  async getPageContent(): Promise<AgentRecruitmentPage | null> {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('agent_recruitment_landing_pages')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[AgentRecruitmentService] Error fetching page content:', error);
        return null;
      }

      if (!data) {
        console.warn('[AgentRecruitmentService] No published page content found');
        return null;
      }

      // Helper function to safely parse JSON fields
      const parseJsonField = (field: any, defaultValue: any = []): any => {
        if (field === null || field === undefined) {
          return defaultValue;
        }
        
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return defaultValue;
          }
        }
        
        // If it's already an object/array, return it
        if (typeof field === 'object') {
          return field;
        }
        
        return defaultValue;
      };

      // Helper to normalize requirements list - handle both string arrays and object arrays
      const normalizeRequirementsList = (field: any): string[] => {
        const parsed = parseJsonField(field, []);
        if (!Array.isArray(parsed)) {
          return [];
        }
        return parsed.map((item: any) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object') {
            // Try common property names
            return item.text || item.requirement || item.item || item.content || item.description || JSON.stringify(item);
          }
          return String(item || '');
        }).filter((text: string) => text && text.trim() !== '');
      };

      // Parse JSONB fields
      return {
        ...data,
        value_pillars: Array.isArray(parseJsonField(data.value_pillars)) 
          ? parseJsonField(data.value_pillars) 
          : [],
        success_stories: Array.isArray(parseJsonField(data.success_stories)) 
          ? parseJsonField(data.success_stories) 
          : [],
        benefits: Array.isArray(parseJsonField(data.benefits)) 
          ? parseJsonField(data.benefits) 
          : [],
        requirements_list: normalizeRequirementsList(data.requirements_list),
        application_process_steps: Array.isArray(parseJsonField(data.application_process_steps)) 
          ? parseJsonField(data.application_process_steps) 
          : [],
        faqs: Array.isArray(parseJsonField(data.faqs)) 
          ? parseJsonField(data.faqs) 
          : [],
      } as AgentRecruitmentPage;
    } catch (error) {
      console.error('[AgentRecruitmentService] Error:', error);
      return null;
    }
  },

  async submitApplication(applicationData: AgentApplicationData): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Prepare data for leads table
      const leadData = {
        name: applicationData.full_name.trim(),
        email: applicationData.email.trim().toLowerCase(),
        phone: applicationData.phone.trim(),
        type: 'agent_recruitment',
        source_page: '/join_us',
        lead_source: 'join_us',
        interest_details: 'Agent recruitment application',
        details: {
          experience_years: applicationData.experience_years,
          current_location: applicationData.current_location,
          why_join: applicationData.why_join,
          resume_url: applicationData.resume_url,
        },
      };

      const { error } = await supabase
        .from('leads')
        .insert([leadData]);

      if (error) {
        console.error('[AgentRecruitmentService] Error submitting application:', error);
        throw new Error(`Failed to submit application: ${error.message}`);
      }

      console.log('[AgentRecruitmentService] Application submitted successfully');
    } catch (error) {
      console.error('[AgentRecruitmentService] Error in submitApplication:', error);
      throw error;
    }
  },
};
