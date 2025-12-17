import { createClient } from '@/lib/supabase/server';

import type { 
  CityContext, 
  MicromarketContext, 
  DeveloperContext, 
  ProjectContext 
} from "./contentPromptTemplates";

export const contentContextService = {
  /**
   * Fetch enriched context for City page generation
   */
  async getCityContext(cityId: string): Promise<CityContext> {
    try {
      const supabase = await createClient();
      console.log('Fetching city context for:', cityId);

      // Fetch city details
      const { data: city, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .eq('id', cityId)
        .single();

      if (cityError || !city) {
        throw new Error(`City not found: ${cityError?.message}`);
      }

      // Fetch micromarkets count and names
      const { data: micromarkets, error: mmError } = await supabase
        .from('micro_markets')
        .select('micro_market_name, price_per_sqft_min')
        .eq('city_id', cityId)
        .order('price_per_sqft_min', { ascending: false });

      // Fetch developers count
      const { count: developerCount } = await supabase
        .from('developers')
        .select('*', { count: 'exact', head: true })
        .eq('primary_market_id', cityId);

      // Fetch projects count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('city_id', cityId);

      // Fetch top developers
      const { data: topDevelopers } = await supabase
        .from('developers')
        .select('developer_name')
        .eq('primary_market_id', cityId)
        .order('total_projects', { ascending: false })
        .limit(5);

      const context: CityContext = {
        cityName: city.city_name,
        country: city.country,
        avgPriceSqft: city.average_price_sqft || 5000,
        appreciation: city.annual_appreciation_pct || 10,
        rentalYield: city.rental_yield_pct || 4,
        projectCount: projectCount || 0,
        developerCount: developerCount || 0,
        micromarketCount: micromarkets?.length || 0,
        topMicromarkets: micromarkets?.slice(0, 7).map(mm => mm.micro_market_name) || [],
        topDevelopers: topDevelopers?.map(d => d.developer_name) || [],
        metroInfo: 'Metro connectivity available',
        airportDistance: 15,
        itParks: ['IT Park 1', 'IT Park 2'],
        hospitals: 50,
        schools: ['International School 1', 'CBSE School 2'],
        roiShort: 20,
        roiMedium: 40,
        roiLong: 80,
        budgetFirstTime: '₹40 lakhs - ₹80 lakhs',
        budgetLuxury: '₹2 Crores - ₹10 Crores+',
        budgetNRI: '₹80 lakhs - ₹3 Crores',
        budgetCommercial: '₹1 Crore - ₹20 Crores',
        luxuryMicromarkets: micromarkets?.slice(0, 3).map(mm => mm.micro_market_name) || [],
        nriMicromarkets: micromarkets?.slice(0, 3).map(mm => mm.micro_market_name) || [],
        commercialHubs: ['Business District 1', 'Commercial Hub 2'],
      };

      console.log('City context prepared:', context);
      return context;

    } catch (error: any) {
      console.error('Error fetching city context:', error);
      throw error;
    }
  },

  /**
   * Fetch enriched context for Micromarket page generation
   */
  async getMicromarketContext(micromarketId: string): Promise<MicromarketContext> {
    try {
      const supabase = await createClient();
      console.log('Fetching micromarket context for:', micromarketId);

      // Fetch micromarket details
      const { data: micromarket, error: mmError } = await supabase
        .from('micro_markets')
        .select(`
          *,
          cities (
            city_name
          )
        `)
        .eq('id', micromarketId)
        .single();

      if (mmError || !micromarket) {
        throw new Error(`Micromarket not found: ${mmError?.message}`);
      }

      // Fetch projects count in this micromarket
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('micro_market_id', micromarketId);

      const context: MicromarketContext = {
        micromarketName: micromarket.micro_market_name,
        cityName: micromarket.cities?.city_name || 'City',
        priceSqft: micromarket.price_per_sqft_min || 5000,
        projectCount: projectCount || 0,
        distanceFromCenter: 10,
        connectivity: ['Metro', 'Highway', 'Bus route'],
        nearbyAmenities: ['Hospital', 'School', 'Mall', 'Park'],
        growthPotential: 'High growth potential',
        targetBuyers: ['IT Professionals', 'Families', 'Investors'],
        keyLandmarks: ['Landmark 1', 'Landmark 2'],
        transportOptions: ['Metro', 'Bus', 'Cab services'],
      };

      console.log('Micromarket context prepared:', context);
      return context;

    } catch (error: any) {
      console.error('Error fetching micromarket context:', error);
      throw error;
    }
  },

  /**
   * Fetch enriched context for Developer page generation
   */
  async getDeveloperContext(developerId: string): Promise<DeveloperContext> {
    try {
      const supabase = await createClient();
      console.log('Fetching developer context for:', developerId);

      // Fetch developer details
      const { data: developer, error: devError } = await supabase
        .from('developers')
        .select(`
          *,
          cities (
            city_name
          )
        `)
        .eq('id', developerId)
        .single();

      if (devError || !developer) {
        throw new Error(`Developer not found: ${devError?.message}`);
      }

      // Fetch projects by this developer
      const { data: projects, count: activeProjects } = await supabase
        .from('projects')
        .select(`
          project_name,
          micro_markets!projects_micromarket_id_fkey (
            micro_market_name
          ),
          property_types
        `, { count: 'exact' })
        .eq('developer_id', developerId)
        .limit(5);

      const notableProjects = projects?.map(p => {
        const microMarket = Array.isArray(p.micro_markets) ? p.micro_markets[0] : p.micro_markets;
        return {
          name: p.project_name,
          location: microMarket?.micro_market_name || 'Location',
          type: typeof p.property_types === 'string' ? p.property_types : 'Mixed-use',
        };
      }) || [];

      // Get unique micromarkets
      const micromarkets = [...new Set(projects?.map(p => {
        const microMarket = Array.isArray(p.micro_markets) ? p.micro_markets[0] : p.micro_markets;
        return microMarket?.micro_market_name;
      }).filter(Boolean))] as string[];

      const context: DeveloperContext = {
        developerName: developer.developer_name,
        cityName: (developer.cities as any)?.city_name || 'City',
        yearsInBusiness: developer.years_in_business || 10,
        totalProjects: developer.total_projects || 0,
        unitsDelivered: developer.total_sft_delivered || '0',
        specialization: developer.specialization || 'Residential & Commercial',
        notableProjects,
        awards: developer.key_awards_json ? 
          (Array.isArray(developer.key_awards_json) ? developer.key_awards_json as string[] : []) : 
          ['Excellence Award', 'Quality Award'],
        certifications: ['ISO 9001:2015', 'IGBC Certified'],
        activeProjects: activeProjects || 0,
        micromarkets: micromarkets.slice(0, 5),
      };

      console.log('Developer context prepared:', context);
      return context;

    } catch (error: any) {
      console.error('Error fetching developer context:', error);
      throw error;
    }
  },

  /**
   * Fetch enriched context for Project page generation
   */
  async getProjectContext(projectId: string): Promise<ProjectContext> {
    try {
      const supabase = await createClient();
      console.log('Fetching project context for:', projectId);

      // Fetch project details with relationships
      const { data: project, error: projError } = await supabase
        .from('projects')
        .select(`
          *,
          developers (
            developer_name
          ),
          micro_markets!projects_micromarket_id_fkey (
            micro_market_name
          ),
          cities (
            city_name
          )
        `)
        .eq('id', projectId)
        .single();

      if (projError || !project) {
        throw new Error(`Project not found: ${projError?.message}`);
      }

      // Parse price range from text
      const priceRangeText = project.price_range_text || '50 Lakhs - 1.5 Crores';
      const priceMin = 5000000; // Default 50 lakhs
      const priceMax = 15000000; // Default 1.5 Cr

      const context: ProjectContext = {
        projectName: project.project_name,
        developerName: project.developers?.developer_name || 'Developer',
        micromarketName: project.micro_markets?.micro_market_name || 'Location',
        cityName: project.cities?.city_name || 'City',
        propertyType: typeof project.property_types === 'string' ? project.property_types : 'Apartments',
        totalAreaSqft: 500000, // Default
        numberOfUnits: 300, // Default
        priceMin,
        priceMax,
        completionDate: project.completion_status || 'Dec 2025',
        possessionStatus: project.completion_status || 'Under Construction',
        configurations: ['2 BHK', '3 BHK', '4 BHK'],
        amenities: [
          'Swimming Pool',
          'Gymnasium',
          'Club House',
          'Children\'s Play Area',
          'Landscaped Gardens',
          'Security',
          'Power Backup',
          'Parking'
        ],
        distanceFromCenter: 10,
        nearbyHospitals: ['Hospital 1', 'Hospital 2'],
        nearbySchools: ['School 1', 'School 2'],
        nearbyMalls: ['Mall 1', 'Mall 2'],
        airportDistance: 15,
        rentalYield: 5,
        appreciation: 12,
        targetBuyers: ['IT Professionals', 'Families', 'Investors'],
      };

      console.log('Project context prepared:', context);
      return context;

    } catch (error: any) {
      console.error('Error fetching project context:', error);
      throw error;
    }
  },

  /**
   * Get context for any page type
   */
  async getContext(pageType: string, entityId: string): Promise<any> {
    switch (pageType) {
      case 'city':
        return this.getCityContext(entityId);
      case 'micromarket':
        return this.getMicromarketContext(entityId);
      case 'developer':
        return this.getDeveloperContext(entityId);
      case 'project':
        return this.getProjectContext(entityId);
      default:
        throw new Error(`Unknown page type: ${pageType}`);
    }
  },
};
