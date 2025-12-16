import { createClient } from '@/lib/supabase/server';


import { errorHandlingService } from "./errorHandlingService";
import { retryService } from "./retryService";
import { 

const supabase = await createClient();
  validateInput, 
  formatValidationErrors,
  seedDataRequestSchema,
  generateContentRequestSchema,
  publishPageRequestSchema
} from "./validationSchemas";

export interface PageItem {
  id: string;
  name: string;
  status?: string;
  slug?: string;
  country?: string;
  city?: string;
}

export const contentApiService = {
  /**
   * GET /api/admin/items/cities
   */
  async getCities(): Promise<PageItem[]> {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, city_name, url_slug, page_status, country')
        .order('city_name');

      if (error) throw error;

      return data.map(city => ({
        id: city.id,
        name: city.city_name,
        slug: city.url_slug,
        status: city.page_status || 'draft',
        country: city.country,
      }));
    } catch (error: any) {
      console.error('Error fetching cities:', error);
      throw new Error(`Failed to fetch cities: ${error.message}`);
    }
  },

  /**
   * GET /api/admin/items/micromarkets
   */
  async getMicromarkets(cityId?: string): Promise<PageItem[]> {
    try {
      let query = supabase
        .from('micro_markets')
        .select(`
          id,
          micro_market_name,
          url_slug,
          cities (city_name)
        `)
        .order('micro_market_name');

      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(mm => ({
        id: mm.id,
        name: mm.micro_market_name,
        slug: mm.url_slug,
        status: 'published', // Micromarkets don't have page_status yet
        city: (mm.cities as any)?.city_name || '',
      }));
    } catch (error: any) {
      console.error('Error fetching micromarkets:', error);
      throw new Error(`Failed to fetch micromarkets: ${error.message}`);
    }
  },

  /**
   * GET /api/admin/items/developers
   */
  async getDevelopers(cityId?: string): Promise<PageItem[]> {
    try {
      let query = supabase
        .from('developers')
        .select(`
          id,
          developer_name,
          url_slug,
          cities (city_name)
        `)
        .order('developer_name');

      if (cityId) {
        query = query.eq('primary_market_id', cityId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(dev => ({
        id: dev.id,
        name: dev.developer_name,
        slug: dev.url_slug,
        status: 'published', // Developers don't have page_status
        city: (dev.cities as any)?.city_name || '',
      }));
    } catch (error: any) {
      console.error('Error fetching developers:', error);
      throw new Error(`Failed to fetch developers: ${error.message}`);
    }
  },

  /**
   * GET /api/admin/items/projects
   */
  async getProjects(filters?: { cityId?: string; micromarketId?: string; developerId?: string }): Promise<PageItem[]> {
    try {
      let query = supabase
        .from('projects')
        .select(`
          id,
          project_name,
          url_slug,
          cities (city_name),
          micro_markets!projects_micromarket_id_fkey (micro_market_name)
        `)
        .order('project_name');

      if (filters?.cityId) {
        query = query.eq('city_id', filters.cityId);
      }

      if (filters?.micromarketId) {
        query = query.eq('micro_market_id', filters.micromarketId);
      }

      if (filters?.developerId) {
        query = query.eq('developer_id', filters.developerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(proj => ({
        id: proj.id,
        name: proj.project_name,
        slug: proj.url_slug,
        status: 'published', // Projects don't have page_status yet
        city: (proj.cities as any)?.city_name || '',
      }));
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
  },

  /**
   * POST /api/admin/seed-data
   */
  async seedData(pageType: string, entityId: string): Promise<any> {
    // Validate input
    const validation = validateInput(seedDataRequestSchema, { pageType, entityId });
    if (!validation.success) {
      const errorMsg = formatValidationErrors(validation.errors!);
      throw new Error(`Validation failed: ${errorMsg}`);
    }

    return retryService.withRetry(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('seed-data', {
          body: { pageType, entityId },
        });

        if (error) throw error;

        errorHandlingService.handleSuccess('Data seeded successfully');
        return data;
      } catch (error: any) {
        errorHandlingService.handleError(error, 'Seed data failed');
        throw error;
      }
    }, {
      maxAttempts: 2,
      delayMs: 1000,
    });
  },

  /**
   * POST /api/admin/generate-content (streaming)
   */
  async generateContent(
    provider: 'perplexity' | 'lovable',
    pageType: string,
    entityId: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    // Validate input
    const validation = validateInput(generateContentRequestSchema, { provider, pageType, entityId });
    if (!validation.success) {
      const errorMsg = formatValidationErrors(validation.errors!);
      errorHandlingService.handleError(new Error(errorMsg), 'Validation failed');
      throw new Error(`Validation failed: ${errorMsg}`);
    }

    return retryService.withRetryAndTimeout(async () => {
      try {
        const functionName = provider === 'perplexity' 
          ? 'generate-page-content-perplexity'
          : 'generate-page-content-lovable';

        console.log(`Generating content with ${provider}...`);

        const supabaseUrl = 'https://imqlfztriragzypplbqa.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWxmenRyaXJhZ3p5cHBsYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4NTU0MTAsImV4cCI6MjA2MjQzMTQxMH0.DV_A3MSzStxBhjTHM_egu71hCek01VrpLCwENL052I8';

        const response = await fetch(
          `${supabaseUrl}/functions/v1/${functionName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ pageType, entityId }),
          }
        );

        // Handle rate limit and payment errors
        if (response.status === 429) {
          throw Object.assign(
            new Error('Rate limit exceeded'),
            { status: 429 }
          );
        }

        if (response.status === 402) {
          throw Object.assign(
            new Error('Payment required - please add credits'),
            { status: 402 }
          );
        }

        if (!response.ok) {
          throw Object.assign(
            new Error(`HTTP error! status: ${response.status}`),
            { status: response.status }
          );
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullContent += chunk;
          
          if (onChunk) {
            onChunk(chunk);
          }
        }

        if (!fullContent || fullContent.trim().length === 0) {
          throw new Error('Generated content is empty');
        }

        errorHandlingService.handleSuccess('Content generated successfully');
        return fullContent;
      } catch (error: any) {
        errorHandlingService.handleError(error, 'Content generation failed');
        throw error;
      }
    }, {
      maxAttempts: 2,
      delayMs: 2000,
      retryableErrors: ['network', 'timeout', 'server'],
    }, 120000); // 2 minute timeout
  },

  /**
   * POST /api/admin/publish-page
   */
  async publishPage(
    pageType: string,
    entityId: string,
    content: any,
    extractRelationships: boolean = true
  ): Promise<any> {
    // Validate input
    const validation = validateInput(publishPageRequestSchema, { 
      pageType, 
      entityId, 
      content,
      extractRelationships 
    });
    
    if (!validation.success) {
      const errorMsg = formatValidationErrors(validation.errors!);
      errorHandlingService.handleError(new Error(errorMsg), 'Validation failed');
      throw new Error(`Validation failed: ${errorMsg}`);
    }

    return retryService.withRetry(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('publish-page', {
          body: { 
            pageType, 
            entityId, 
            content,
            extractRelationships,
          },
        });

        if (error) throw error;

        errorHandlingService.handleSuccess('Page published successfully');
        return data;
      } catch (error: any) {
        errorHandlingService.handleError(error, 'Publish failed');
        throw error;
      }
    }, {
      maxAttempts: 2,
      delayMs: 1000,
    });
  },
};
