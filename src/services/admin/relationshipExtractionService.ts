import { createClient } from '@/lib/supabase/server';


import type { Json } from "@/integrations/supabase/types";
const supabase = await createClient();

export interface ExtractedRelationships {
  featuredMicromarkets?: string[];
  featuredProjects?: string[];
  featuredDevelopers?: string[];
  relatedMicromarkets?: string[];
  relatedProjects?: string[];
}

export const relationshipExtractionService = {
  /**
   * Extract and save relationships for City pages
   */
  async extractCityRelationships(cityId: string): Promise<ExtractedRelationships> {
    try {
      console.log('Extracting city relationships for:', cityId);

      // Get top micromarkets by price
      const { data: micromarkets } = await supabase
        .from('micro_markets')
        .select('id, micro_market_name')
        .eq('city_id', cityId)
        .order('price_per_sqft_min', { ascending: false })
        .limit(7);

      // Get top developers by project count
      const { data: developers } = await supabase
        .from('developers')
        .select('id, developer_name')
        .eq('primary_market_id', cityId)
        .order('total_projects', { ascending: false })
        .limit(5);

      // Get featured projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('city_id', cityId)
        .eq('is_featured', true)
        .limit(6);

      const relationships: ExtractedRelationships = {
        featuredMicromarkets: micromarkets?.map(m => m.id) || [],
        featuredDevelopers: developers?.map(d => d.id) || [],
        featuredProjects: projects?.map(p => p.id) || [],
      };

      // Save relationships to city
      await this.saveCityRelationships(cityId, relationships);

      console.log('City relationships extracted:', relationships);
      return relationships;
    } catch (error: any) {
      console.error('Error extracting city relationships:', error);
      throw new Error(`Failed to extract relationships: ${error.message}`);
    }
  },

  /**
   * Extract and save relationships for Micromarket pages
   */
  async extractMicromarketRelationships(micromarketId: string): Promise<ExtractedRelationships> {
    try {
      console.log('Extracting micromarket relationships for:', micromarketId);

      // Get featured projects in this micromarket
      const { data: projects } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('micro_market_id', micromarketId)
        .eq('is_featured', true)
        .limit(6);

      // Get top developers in this micromarket
      const { data: developers } = await supabase
        .from('projects')
        .select('developer_id')
        .eq('micro_market_id', micromarketId)
        .not('developer_id', 'is', null);

      const uniqueDeveloperIds = [...new Set(developers?.map(d => d.developer_id).filter(Boolean))];

      const relationships: ExtractedRelationships = {
        featuredProjects: projects?.map(p => p.id) || [],
        featuredDevelopers: uniqueDeveloperIds.slice(0, 5),
      };

      // Save relationships to micromarket
      await this.saveMicromarketRelationships(micromarketId, relationships);

      console.log('Micromarket relationships extracted:', relationships);
      return relationships;
    } catch (error: any) {
      console.error('Error extracting micromarket relationships:', error);
      throw new Error(`Failed to extract relationships: ${error.message}`);
    }
  },

  /**
   * Extract and save relationships for Developer pages
   */
  async extractDeveloperRelationships(developerId: string): Promise<ExtractedRelationships> {
    try {
      console.log('Extracting developer relationships for:', developerId);

      // Get projects by this developer
      const { data: projects } = await supabase
        .from('projects')
        .select('id, project_name, micro_market_id')
        .eq('developer_id', developerId)
        .limit(10);

      // Get unique micromarkets where developer has projects
      const uniqueMicromarketIds = [...new Set(projects?.map(p => p.micro_market_id).filter(Boolean))];

      const relationships: ExtractedRelationships = {
        featuredProjects: projects?.slice(0, 6).map(p => p.id) || [],
        relatedMicromarkets: uniqueMicromarketIds.slice(0, 5),
      };

      // Save relationships to developer
      await this.saveDeveloperRelationships(developerId, relationships);

      console.log('Developer relationships extracted:', relationships);
      return relationships;
    } catch (error: any) {
      console.error('Error extracting developer relationships:', error);
      throw new Error(`Failed to extract relationships: ${error.message}`);
    }
  },

  /**
   * Extract and save relationships for Project pages
   */
  async extractProjectRelationships(projectId: string): Promise<ExtractedRelationships> {
    try {
      console.log('Extracting project relationships for:', projectId);

      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('micro_market_id, developer_id, city_id')
        .eq('id', projectId)
        .single();

      if (!project) {
        throw new Error('Project not found');
      }

      // Get related projects in same micromarket
      const { data: relatedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('micro_market_id', project.micro_market_id)
        .neq('id', projectId)
        .limit(6);

      const relationships: ExtractedRelationships = {
        relatedProjects: relatedProjects?.map(p => p.id) || [],
      };

      console.log('Project relationships extracted:', relationships);
      return relationships;
    } catch (error: any) {
      console.error('Error extracting project relationships:', error);
      throw new Error(`Failed to extract relationships: ${error.message}`);
    }
  },

  /**
   * Save city relationships
   */
  async saveCityRelationships(cityId: string, relationships: ExtractedRelationships): Promise<void> {
    const { error } = await supabase
      .from('cities')
      .update({
        featured_micromarkets_order: relationships.featuredMicromarkets as Json,
        featured_developers_order: relationships.featuredDevelopers as Json,
        featured_projects_order: relationships.featuredProjects as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cityId);

    if (error) throw error;
  },

  /**
   * Save micromarket relationships
   */
  async saveMicromarketRelationships(micromarketId: string, relationships: ExtractedRelationships): Promise<void> {
    const { error } = await supabase
      .from('micro_markets')
      .update({
        featured_projects_order: relationships.featuredProjects as Json,
        featured_developers_order: relationships.featuredDevelopers as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', micromarketId);

    if (error) throw error;
  },

  /**
   * Save developer relationships
   */
  async saveDeveloperRelationships(developerId: string, relationships: ExtractedRelationships): Promise<void> {
    // Store in notable_projects_json or a similar field
    const { error } = await supabase
      .from('developers')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', developerId);

    if (error) throw error;
  },

  /**
   * Extract relationships for any page type
   */
  async extractRelationships(
    pageType: 'city' | 'micromarket' | 'developer' | 'project',
    entityId: string
  ): Promise<ExtractedRelationships> {
    switch (pageType) {
      case 'city':
        return this.extractCityRelationships(entityId);
      case 'micromarket':
        return this.extractMicromarketRelationships(entityId);
      case 'developer':
        return this.extractDeveloperRelationships(entityId);
      case 'project':
        return this.extractProjectRelationships(entityId);
      default:
        throw new Error(`Unknown page type: ${pageType}`);
    }
  },
};
