import { createClient } from '@/lib/supabase/server';


import type { Json } from "@/integrations/supabase/types";
const supabase = await createClient();

export interface GeneratedContent {
  seo_title: string;
  meta_description: string;
  h1_title: string;
  hero_hook: string;
  overview_seo: string;
  faqs?: Array<{ question: string; answer: string }>;
  market_snapshot?: {
    totalProjects: number;
    avgPriceSqft: number;
    appreciation: number;
    topDevelopers: string[];
  };
  lifestyle_infrastructure?: {
    connectivity: string[];
    amenities: string[];
  };
  market_trends?: {
    demand: string;
    supply: string;
    priceMovement: string;
  };
  buyer_personas?: {
    firstTimeBuyers: string;
    investors: string;
    nriInvestors: string;
  };
  testimonials?: Array<{
    name: string;
    role: string;
    feedback: string;
    rating: number;
  }>;
  featured_micromarkets?: string[];
  featured_projects?: string[];
  featured_developers?: string[];
  notable_projects?: Array<{
    name: string;
    location: string;
    highlights: string;
  }>;
  awards?: string[];
  specialization?: string;
  usp?: string;
  amenities?: string[];
  specifications?: {
    unitTypes: string[];
    sizes: string[];
    prices: string[];
  };
  location_advantages?: {
    connectivity: string[];
    nearbyLandmarks: string[];
  };
}

export const contentStorageService = {
  /**
   * Save generated content to City table
   */
  async saveCityContent(cityId: string, content: any): Promise<void> {
    try {
      console.log('Saving city content:', { cityId, content });

      const updateData: any = {
        seo_title: content.seo_title,
        meta_description: content.meta_description,
        h1_title: content.h1_title,
        hero_hook: content.hero_hook,
        city_overview_seo: content.city_overview_seo || content.overview_seo,
        content_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add JSON fields directly as they come from mapContentToStructure
      if (content.city_faqs_json !== undefined && content.city_faqs_json !== null) {
        updateData.city_faqs_json = content.city_faqs_json as Json;
        console.log('Saving city_faqs_json:', content.city_faqs_json);
      }

      if (content.market_snapshot_json !== undefined && content.market_snapshot_json !== null) {
        updateData.market_snapshot_json = content.market_snapshot_json as Json;
        console.log('Saving market_snapshot_json:', content.market_snapshot_json);
      }

      if (content.lifestyle_infrastructure_json !== undefined && content.lifestyle_infrastructure_json !== null) {
        updateData.lifestyle_infrastructure_json = content.lifestyle_infrastructure_json as Json;
        console.log('Saving lifestyle_infrastructure_json:', content.lifestyle_infrastructure_json);
      }

      if (content.market_trends_json !== undefined && content.market_trends_json !== null) {
        updateData.market_trends_json = content.market_trends_json as Json;
        console.log('Saving market_trends_json:', content.market_trends_json);
      }

      if (content.buyer_personas_json !== undefined && content.buyer_personas_json !== null) {
        updateData.buyer_personas_json = content.buyer_personas_json as Json;
        console.log('Saving buyer_personas_json:', content.buyer_personas_json);
      }

      if (content.testimonials_json !== undefined && content.testimonials_json !== null) {
        updateData.testimonials_json = content.testimonials_json as Json;
        console.log('Saving testimonials_json:', content.testimonials_json);
      }

      const { error } = await supabase
        .from('cities')
        .update(updateData)
        .eq('id', cityId);

      if (error) throw error;

      console.log('City content saved successfully');
    } catch (error: any) {
      console.error('Error saving city content:', error);
      throw new Error(`Failed to save city content: ${error.message}`);
    }
  },

  /**
   * Save generated content to Micromarket table
   */
  async saveMicromarketContent(micromarketId: string, content: any): Promise<void> {
    try {
      console.log('Saving micromarket content:', { micromarketId, content });

      const updateData: any = {
        seo_title: content.seo_title,
        meta_description: content.meta_description,
        h1_title: content.h1_title,
        hero_description: content.hero_hook,
        long_description_seo: content.overview_seo,
        content_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add JSON fields directly as they come from mapContentToStructure
      if (content.lifestyle_guide_json !== undefined && content.lifestyle_guide_json !== null) {
        updateData.lifestyle_guide_json = content.lifestyle_guide_json as Json;
        console.log('Saving lifestyle_guide_json:', content.lifestyle_guide_json);
      }

      if (content.featured_projects_json !== undefined && content.featured_projects_json !== null) {
        updateData.featured_projects_json = content.featured_projects_json as Json;
        console.log('Saving featured_projects_json:', content.featured_projects_json);
      }

      if (content.investment_potential_json !== undefined && content.investment_potential_json !== null) {
        updateData.investment_potential_json = content.investment_potential_json as Json;
        console.log('Saving investment_potential_json:', content.investment_potential_json);
      }

      if (content.faqs_json !== undefined && content.faqs_json !== null) {
        updateData.faqs_json = content.faqs_json as Json;
        console.log('Saving faqs_json:', content.faqs_json);
      }

      const { error } = await supabase
        .from('micro_markets')
        .update(updateData)
        .eq('id', micromarketId);

      if (error) throw error;

      console.log('Micromarket content saved successfully');
    } catch (error: any) {
      console.error('Error saving micromarket content:', error);
      throw new Error(`Failed to save micromarket content: ${error.message}`);
    }
  },

  /**
   * Save generated content to Developer table
   */
  async saveDeveloperContent(developerId: string, content: any): Promise<void> {
    try {
      console.log('Saving developer content:', { developerId, content });

      const updateData: any = {
        seo_title: content.seo_title,
        meta_description: content.meta_description,
        hero_description: content.hero_description,
        long_description_seo: content.long_description_seo,
        content_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add text fields
      if (content.specialization) {
        updateData.specialization = content.specialization;
      }

      if (content.usp) {
        updateData.usp = content.usp;
      }

      if (content.founder_bio_summary) {
        updateData.founder_bio_summary = content.founder_bio_summary;
      }

      if (content.awards_summary_text) {
        updateData.awards_summary_text = content.awards_summary_text;
      }

      if (content.website_url) {
        updateData.website_url = content.website_url;
      }

      if (content.primary_city_focus) {
        updateData.primary_city_focus = content.primary_city_focus;
      }

      if (content.years_in_business !== undefined && content.years_in_business !== null) {
        updateData.years_in_business = content.years_in_business;
      }

      if (content.total_projects !== undefined && content.total_projects !== null) {
        updateData.total_projects = content.total_projects;
      }

      if (content.total_sft_delivered) {
        updateData.total_sft_delivered = content.total_sft_delivered;
      }

      // Add JSON fields - check for both defined and non-empty values
      if (content.notable_projects_json !== undefined && content.notable_projects_json !== null) {
        updateData.notable_projects_json = content.notable_projects_json as Json;
        console.log('Saving notable_projects_json:', content.notable_projects_json);
      }

      if (content.key_awards_json !== undefined && content.key_awards_json !== null) {
        updateData.key_awards_json = content.key_awards_json as Json;
        console.log('Saving key_awards_json:', content.key_awards_json);
      }

      if (content.testimonial_json !== undefined && content.testimonial_json !== null) {
        updateData.testimonial_json = content.testimonial_json as Json;
        console.log('Saving testimonial_json:', content.testimonial_json);
      }

      if (content.faqs_json !== undefined && content.faqs_json !== null) {
        updateData.faqs_json = content.faqs_json as Json;
        console.log('Saving faqs_json:', content.faqs_json);
      }

      if (content.history_timeline_json !== undefined && content.history_timeline_json !== null) {
        updateData.history_timeline_json = content.history_timeline_json as Json;
        console.log('Saving history_timeline_json:', content.history_timeline_json);
      }

      if (content.schema_markup_json !== undefined && content.schema_markup_json !== null) {
        updateData.schema_markup_json = content.schema_markup_json as Json;
        console.log('Saving schema_markup_json:', content.schema_markup_json);
      }

      const { error } = await supabase
        .from('developers')
        .update(updateData)
        .eq('id', developerId);

      if (error) throw error;

      console.log('Developer content saved successfully');
    } catch (error: any) {
      console.error('Error saving developer content:', error);
      throw new Error(`Failed to save developer content: ${error.message}`);
    }
  },

  /**
   * Save generated content to Project table
   */
  async saveProjectContent(projectId: string, content: any): Promise<void> {
    try {
      console.log('Saving project content:', { projectId, content });

      const updateData: any = {
        seo_title: content.seo_title,
        meta_description: content.meta_description,
        h1_title: content.h1_title,
        project_overview_seo: content.overview_seo,
        content_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Map all JSON fields in projects table
      if (content.project_snapshot_json !== undefined && content.project_snapshot_json !== null) {
        updateData.project_snapshot_json = content.project_snapshot_json as Json;
        console.log('Saving project_snapshot_json:', content.project_snapshot_json);
      }

      if (content.amenities_json !== undefined && content.amenities_json !== null) {
        updateData.amenities_json = content.amenities_json as Json;
        console.log('Saving amenities_json:', content.amenities_json);
      }

      if (content.location_advantages_json !== undefined && content.location_advantages_json !== null) {
        updateData.location_advantages_json = content.location_advantages_json as Json;
        console.log('Saving location_advantages_json:', content.location_advantages_json);
      }

      if (content.investment_analysis_json !== undefined && content.investment_analysis_json !== null) {
        updateData.investment_analysis_json = content.investment_analysis_json as Json;
        console.log('Saving investment_analysis_json:', content.investment_analysis_json);
      }

      if (content.why_invest_json !== undefined && content.why_invest_json !== null) {
        updateData.why_invest_json = content.why_invest_json as Json;
        console.log('Saving why_invest_json:', content.why_invest_json);
      }

      if (content.faqs_json !== undefined && content.faqs_json !== null) {
        updateData.faqs_json = content.faqs_json as Json;
        console.log('Saving faqs_json:', content.faqs_json);
      }

      // Legacy support for old field names
      if (content.amenities && !content.amenities_json) {
        updateData.amenities_json = content.amenities as Json;
      }

      if (content.location_advantages && !content.location_advantages_json) {
        updateData.location_advantages_json = content.location_advantages as Json;
      }

      if (content.faqs && !content.faqs_json) {
        updateData.faqs_json = content.faqs as Json;
      }

      console.log('Project update data:', updateData);

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;

      console.log('Project content saved successfully');
    } catch (error: any) {
      console.error('Error saving project content:', error);
      throw new Error(`Failed to save project content: ${error.message}`);
    }
  },

  /**
   * Generic save method that routes to appropriate table
   */
  async saveContent(
    pageType: 'city' | 'micromarket' | 'developer' | 'project',
    entityId: string,
    content: GeneratedContent
  ): Promise<void> {
    switch (pageType) {
      case 'city':
        return this.saveCityContent(entityId, content);
      case 'micromarket':
        return this.saveMicromarketContent(entityId, content);
      case 'developer':
        return this.saveDeveloperContent(entityId, content);
      case 'project':
        return this.saveProjectContent(entityId, content);
      default:
        throw new Error(`Unknown page type: ${pageType}`);
    }
  },

  /**
   * Update page status to published
   */
  async publishPage(
    pageType: 'city' | 'micromarket' | 'developer' | 'project',
    entityId: string
  ): Promise<void> {
    try {
      // Map pageType to correct table name
      const tableNameMap: Record<string, string> = {
        city: 'cities',
        micromarket: 'micro_markets',
        developer: 'developers',
        project: 'projects'
      };
      const tableName = tableNameMap[pageType];
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Different tables use different columns for published status
      if (pageType === 'developer') {
        // Developers table uses is_published boolean
        updateData.is_published = true;
      } else {
        // Cities, micro_markets, and projects use page_status
        updateData.page_status = 'published';
      }
      
      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', entityId);

      if (error) throw error;

      console.log(`${pageType} page published successfully`);
    } catch (error: any) {
      console.error(`Error publishing ${pageType} page:`, error);
      throw new Error(`Failed to publish page: ${error.message}`);
    }
  },

  /**
   * Get the published page URL
   */
  async getPublishedPageUrl(pageType: 'city' | 'micromarket' | 'developer' | 'project', entityId: string): Promise<string> {
    try {
      switch (pageType) {
        case 'project': {
          console.log('=== Getting published URL for project ===');
          console.log('Entity ID:', entityId);
          
          // Fetch project with city_id and micro_market_id
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('url_slug, city_id, micro_market_id, project_name')
            .eq('id', entityId)
            .maybeSingle();

          console.log('Project query result:', { project, error: projectError });

          if (projectError) {
            console.error('Project query error:', projectError);
            throw projectError;
          }
          if (!project) {
            console.error('Project not found for ID:', entityId);
            throw new Error('Project not found');
          }

          // Validate required fields BEFORE querying
          if (!project.city_id) {
            console.error('Project missing city_id:', project);
            throw new Error('Project is missing city information. Please ensure the project has a city assigned before publishing.');
          }
          if (!project.micro_market_id) {
            console.error('Project missing micro_market_id:', project);
            throw new Error('Project is missing micro-market information. Please ensure the project has a micro-market assigned before publishing.');
          }

          console.log('Fetching city with ID:', project.city_id);

          // Fetch city slug
          const { data: city, error: cityError } = await supabase
            .from('cities')
            .select('url_slug, city_name')
            .eq('id', project.city_id)
            .maybeSingle();

          console.log('City query result:', { city, error: cityError });

          if (cityError) {
            console.error('City query error:', cityError);
            throw cityError;
          }
          if (!city) {
            console.error(`City not found for city_id: ${project.city_id}`);
            throw new Error(`City not found for project (city_id: ${project.city_id})`);
          }

          console.log('Fetching micro-market with ID:', project.micro_market_id);

          // Fetch micro-market slug
          const { data: microMarket, error: mmError } = await supabase
            .from('micro_markets')
            .select('url_slug, micro_market_name')
            .eq('id', project.micro_market_id)
            .maybeSingle();

          console.log('Micro-market query result:', { microMarket, error: mmError });

          if (mmError) {
            console.error('Micro-market query error:', mmError);
            throw mmError;
          }
          if (!microMarket) {
            console.error(`Micro-market not found for micro_market_id: ${project.micro_market_id}`);
            throw new Error(`Micro-market not found for project (micro_market_id: ${project.micro_market_id})`);
          }

          const constructedUrl = `/${city.url_slug}/${microMarket.url_slug}/projects/${project.url_slug}`;
          console.log('Constructed URL:', constructedUrl);
          console.log('=== End of URL construction ===');

          return constructedUrl;
        }
        
        case 'micromarket': {
          // Fetch micro-market with city_id
          const { data: microMarket, error: mmError } = await supabase
            .from('micro_markets')
            .select('url_slug, city_id')
            .eq('id', entityId)
            .maybeSingle();

          if (mmError) throw mmError;
          if (!microMarket) throw new Error('Micro-market not found');

          // Validate required fields BEFORE querying
          if (!microMarket.city_id) {
            throw new Error('Micro-market is missing city information. Please ensure the micro-market has a city assigned before publishing.');
          }

          // Fetch city slug
          const { data: city, error: cityError } = await supabase
            .from('cities')
            .select('url_slug')
            .eq('id', microMarket.city_id)
            .maybeSingle();

          if (cityError) throw cityError;
          if (!city) throw new Error(`City not found for micro-market (city_id: ${microMarket.city_id})`);

          return `/${city.url_slug}/${microMarket.url_slug}`;
        }
        
        case 'developer': {
          const { data, error } = await supabase
            .from('developers')
            .select('url_slug')
            .eq('id', entityId)
            .maybeSingle();

          if (error) throw error;
          if (!data) throw new Error('Developer not found');
          
          return `/developers/${data.url_slug}`;
        }
        
        case 'city': {
          const { data, error } = await supabase
            .from('cities')
            .select('url_slug')
            .eq('id', entityId)
            .maybeSingle();

          if (error) throw error;
          if (!data) throw new Error('City not found');
          
          return `/${data.url_slug}`;
        }
        
        default:
          throw new Error('Unknown page type');
      }
    } catch (error: any) {
      console.error('Error getting published page URL:', error);
      throw new Error(`Failed to get published page URL: ${error.message}`);
    }
  },
};
