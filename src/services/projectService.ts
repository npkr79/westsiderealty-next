import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export interface ProjectInfo {
  id: string;
  project_name: string;
  url_slug?: string;
  city_id?: string;
  micro_market_id?: string | null;
  developer_id?: string | null;
  seo_title?: string;
  description?: string; // Combined and truncated (computed field)
  meta_description: string;
  project_overview_seo: string;
  listing_count?: number;
  is_featured?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // New fields from enhancement
  completion_status?: string | null;
  price_range_text?: string | null;
  property_types?: any;
  unit_size_range?: string | null;
  amenities_json?: any;
  faqs_json?: any;
  floor_plan_images?: any; // Array of { url: string; label: string; } objects
  google_maps_embed_url?: string | null;
  total_land_area?: string | null;
  total_towers?: number | null;
  total_floors?: number | null;
  total_units?: number | null;
  enable_intelligence?: boolean | null;
}

export interface ProjectWithRelations extends Omit<ProjectInfo, 'description'> {
  h1_title?: string;
  hero_image_url?: string | null;
  main_image_url?: string | null; // Alternative image field
  description?: string; // Computed field, optional for database queries
  project_snapshot_json?: any;
  location_advantages_json?: any;
  investment_analysis_json?: any;
  why_invest_json?: any;
  special_offers?: any; // JSONB: { headline: string, subtext: string, button_text: string }
  page_status?: string;
  content_generated_at?: string;
  content_updated_at?: string;
  // New SEO fields
  unit_mix_summary?: string | null;
  price_display_string?: string | null;
  rera_link?: string | null;
  possession_date_text?: string | null;
  construction_timeline_json?: any;
  westside_realty_review?: string | null;
  long_description_html?: string | null;
  schema_markup_json?: any;
  // Image gallery fields (may exist in DB via select('*'))
  gallery_images_json?: unknown; // JSONB field for gallery images
  gallery_images?: unknown; // Alternative gallery field
  images?: unknown; // Direct images field (if exists in DB)
  city?: {
    city_name: string;
    url_slug: string;
  };
  micro_market?: {
    micro_market_name: string;
    url_slug: string;
    hero_hook?: string | null;
    growth_story?: string | null;
    price_per_sqft_min?: number | null;
    price_per_sqft_max?: number | null;
    annual_appreciation_min?: number | null;
  };
  developer?: {
    developer_name: string;
    url_slug: string;
    tagline?: string | null;
    meta_description?: string | null;
    hero_description?: string | null;
    long_description_seo?: string | null;
    years_in_business?: number | null;
    total_projects?: number | null;
    logo_url?: string | null;
    notable_projects_json?: any;
  };
  latitude?: number | null;
  longitude?: number | null;
}

const truncateWords = (text: string, maxWords: number): string => {
  if (!text) return '';
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');
};

const isPermissionError = (error: any) => {
  if (!error) return false;
  return (
    error.code === '42501' ||
    error.status === 403 ||
    String(error.message || '').toLowerCase().includes('permission denied')
  );
};

const runWithServiceFallback = async <T>(
  queryFn: (client: any) => Promise<{ data: T | null; error: any }>
) => {
  const supabase = await createClient();
  let result = await queryFn(supabase);
  if (result.error && isPermissionError(result.error)) {
    const serviceClient = createServiceClient();
    result = await queryFn(serviceClient);
  }
  return result;
};

export const projectService = {
  async getProjectByName(projectName: string): Promise<ProjectInfo | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name, meta_description, project_overview_seo')
      .ilike('project_name', projectName)
      .single();

    if (error || !data) return null;

    // Combine and truncate to 30-40 words
    const combined = `${data.meta_description || ''} ${data.project_overview_seo || ''}`.trim();
    const words = combined.split(/\s+/).filter(w => w.length > 0);
    const truncated = words.slice(0, 40).join(' ') + (words.length > 40 ? '...' : '');

    return {
      ...data,
      description: truncated
    };
  },

  async getProjectDescription(projectName: string): Promise<string | null> {
    if (!projectName) return null;

    console.log('🔍 [ProjectService] Fetching full description for:', projectName);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('project_overview_seo, meta_description')
      .ilike('project_name', projectName)
      .maybeSingle();

    if (error || !data) {
      console.log('⚠️ [ProjectService] No project description found for:', projectName);
      return null;
    }

    const combined = `${data.meta_description || ''} ${data.project_overview_seo || ''}`.trim();
    console.log('✅ [ProjectService] Description found, length:', combined.length);
    
    return truncateWords(combined, 600);
  },

  async getMultipleProjects(projectNames: string[]): Promise<Map<string, ProjectInfo>> {
    if (projectNames.length === 0) return new Map();

    console.log('🔍 [ProjectService] Fetching descriptions for projects:', projectNames);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name, meta_description, project_overview_seo')
      .in('project_name', projectNames);

    if (error) {
      console.error('❌ [ProjectService] Error fetching projects:', error);
      return new Map();
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [ProjectService] No matching projects found in database');
      console.warn('   Requested:', projectNames);
      return new Map();
    }

    console.log(`✅ [ProjectService] Found ${data.length} projects with descriptions`);

    const projectMap = new Map<string, ProjectInfo>();
    
    data.forEach((project: any) => {
      const combined = `${project.meta_description || ''} ${project.project_overview_seo || ''}`.trim();
      const words = combined.split(/\s+/).filter(w => w.length > 0);
      const truncated = words.slice(0, 40).join(' ') + (words.length > 40 ? '...' : '');

      console.log(`   📝 ${project.project_name}: ${truncated.substring(0, 50)}...`);

      projectMap.set(project.project_name, {
        ...project,
        description: truncated
      });
    });

    // Log which project names didn't match
    const matchedNames = Array.from(projectMap.keys());
    const unmatchedNames = projectNames.filter(name => !matchedNames.includes(name));
    if (unmatchedNames.length > 0) {
      console.warn('⚠️ [ProjectService] Projects without descriptions:', unmatchedNames);
    }

    return projectMap;
  },

  /**
   * Get project by slug with full relations (micro-market scoped)
   */
  async getProjectBySlug(
    citySlug: string,
    microMarketSlug: string,
    projectSlug: string
  ): Promise<ProjectWithRelations | null> {
    const { data, error } = await runWithServiceFallback<ProjectWithRelations>((client) =>
      client
        .from('projects')
        .select(`
          *,
          floor_plan_images,
          city:cities!inner(*),
          micro_market:micro_markets!projects_micromarket_id_fkey(*),
          developer:developers(*)
        `)
        .eq('url_slug', projectSlug)
        .eq('city.url_slug', citySlug)
        .eq('micro_market.url_slug', microMarketSlug)
        .or('status.ilike.published,status.ilike.%under construction%')
        .maybeSingle()
    );

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    if (data) console.log('🔥 Service: Loaded Floor Plans:', (data as any).floor_plan_images);

    return data as ProjectWithRelations;
  },

  /**
   * Get city-level project by slug (no micro-market)
   * Query by url_slug only, validate city match in code
   */
  async getCityLevelProjectBySlug(
    citySlug: string,
    projectSlug: string
  ): Promise<ProjectWithRelations | null> {
    console.log(`[getCityLevelProjectBySlug] Fetching project: citySlug=${citySlug}, projectSlug=${projectSlug}`);
    
    // Query project by url_slug only (no city filter in query)
    // Use auto-detected relationship syntax (matches pattern used in sitemap.ts, search/page.tsx, etc.)
    const { data, error } = await runWithServiceFallback<ProjectWithRelations>((client) =>
      client
        .from('projects')
        .select(`
          *,
          floor_plan_images,
          city:cities(*),
          developer:developers(*),
          micro_market:micro_markets!projects_micromarket_id_fkey(*)
        `)
        .eq('url_slug', projectSlug)
        .maybeSingle()
    );

    if (error) {
      // Only log actual errors (not 404s)
      if (error.code !== 'PGRST116') {
        console.error('[getCityLevelProjectBySlug] Error fetching project:', error);
      } else {
        console.log(`[getCityLevelProjectBySlug] Project not found (PGRST116) for slug: ${projectSlug}`);
      }
      return null;
    }

    if (!data) {
      console.log(`[getCityLevelProjectBySlug] No data returned for slug: ${projectSlug}`);
      return null;
    }

    console.log(`[getCityLevelProjectBySlug] Project found: ${data.project_name}, city relation type: ${Array.isArray(data.city) ? 'array' : typeof data.city}`);

    // Validate city match in code after fetch
    const projectCity = Array.isArray(data.city) ? data.city[0] : data.city;
    const projectCitySlug = projectCity?.url_slug;

    console.log(`[getCityLevelProjectBySlug] Project city slug: ${projectCitySlug}, expected: ${citySlug}`);

    // Return null if city doesn't match
    if (!projectCitySlug || projectCitySlug !== citySlug) {
      console.log(`[getCityLevelProjectBySlug] City mismatch - returning null`);
      return null;
    }

    console.log(`[getCityLevelProjectBySlug] ✅ Project found and validated: ${data.project_name}`);
    return data as ProjectWithRelations;
  },

  /**
   * Get all projects for a city
   */
  async getProjectsByCity(cityId: string, featuredOnly: boolean = false): Promise<ProjectWithRelations[]> {
    const { data, error } = await runWithServiceFallback<ProjectWithRelations[]>((client) => {
      let query = client
        .from('projects')
        .select(`
          *,
          micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
          developer:developers(developer_name, url_slug)
        `)
        .eq('city_id', cityId)
        .or('status.ilike.published,status.ilike.%under construction%');
      
      if (featuredOnly) {
        query = query.eq('show_on_city_page', true);
      }
      
      return query
        .order('display_order', { ascending: true })
        .order('project_name', { ascending: true });
    });

    if (error) {
      console.error('❌ [ProjectService] Error fetching projects by city:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Get all projects for a micro-market by slug
   * Returns all projects matching the micro-market, regardless of show_in_micro_market_page flag
   */
  async getProjectsByMicroMarket(
    citySlug: string,
    microMarketSlug: string
  ): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        city:cities!inner(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey!inner(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq('city.url_slug', citySlug)
      .eq('micro_market.url_slug', microMarketSlug)
      .or('status.ilike.published,status.ilike.%under construction%')
      .order('display_order', { ascending: true })
      .order('project_name', { ascending: true });

    if (error) {
      console.error('❌ [ProjectService] Error fetching projects by micro-market:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Get related projects for a micro-market by ID (for similar projects section)
   */
  async getRelatedProjectsByMicroMarketId(
    microMarketId: string
  ): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        city:cities(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq('micro_market_id', microMarketId)
      .or('status.ilike.published,status.ilike.%under construction%')
      .order('display_order', { ascending: true })
      .order('project_name', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ [ProjectService] Error fetching related projects:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Get featured projects for a city
   */
  async getFeaturedProjects(cityId: string, limit: number = 6): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq('city_id', cityId)
      .eq('show_on_city_page', true)
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ [ProjectService] Error fetching featured projects:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Get projects by developer
   */
  async getProjectsByDeveloper(developerId: string): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        city:cities(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug)
      `)
      .eq('developer_id', developerId)
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('project_name', { ascending: true });

    if (error) {
      console.error('❌ [ProjectService] Error fetching projects by developer:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  },

  /**
   * Search projects by name or location
   */
  async searchProjects(
    searchTerm: string,
    cityId?: string
  ): Promise<ProjectWithRelations[]> {
    const supabase = await createClient();
    let query = supabase
      .from('projects')
      .select(`
        *,
        city:cities(city_name, url_slug),
        micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
        developer:developers(developer_name, url_slug)
      `)
      .eq('status', 'published')
      .or(`project_name.ilike.%${searchTerm}%,seo_title.ilike.%${searchTerm}%`);

    if (cityId) {
      query = query.eq('city_id', cityId);
    }

    const { data, error } = await query
      .order('display_order', { ascending: true })
      .limit(20);

    if (error) {
      console.error('❌ [ProjectService] Error searching projects:', error);
      return [];
    }

    return data as ProjectWithRelations[];
  }
};
