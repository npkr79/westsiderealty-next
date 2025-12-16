import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();


interface SeedResult {
  seeded: boolean;
  counts: {
    cities: number;
    micromarkets: number;
    developers: number;
    projects: number;
  };
}

const CITY_DATA = {
  'Bangalore': {
    country: 'India',
    micromarkets: ['Koramangala', 'Indiranagar', 'Whitefield', 'Bannerghatta Road', 'Bellandur', 'HSR Layout', 'Electronic City'],
    developers: [
      { name: 'Prestige Group', specialization: 'Luxury Apartments', years: 35 },
      { name: 'Sobha Limited', specialization: 'Premium Villas', years: 25 },
      { name: 'Brigade Group', specialization: 'Mixed-use Projects', years: 30 },
      { name: 'Puravankara', specialization: 'Residential', years: 45 }
    ]
  },
  'Delhi': {
    country: 'India',
    micromarkets: ['Safdarjung', 'New Delhi', 'Karol Bagh', 'Dwarka', 'Rohini', 'Lajpat Nagar'],
    developers: [
      { name: 'DLF Limited', specialization: 'Luxury Apartments', years: 75 },
      { name: 'Unitech Group', specialization: 'Residential', years: 50 },
      { name: 'Ansal API', specialization: 'Housing', years: 55 }
    ]
  },
  'Noida': {
    country: 'India',
    micromarkets: ['Sector 120', 'Sector 150', 'Eldeco', 'Express Zone', 'Techzone', 'Greater Noida West'],
    developers: [
      { name: 'Supertech Limited', specialization: 'High-rise Apartments', years: 30 },
      { name: 'Gaurs Group', specialization: 'Residential Towers', years: 25 },
      { name: 'ATS Group', specialization: 'Premium Housing', years: 20 }
    ]
  },
  'Gurugram': {
    country: 'India',
    micromarkets: ['DLF Phase 5', 'Sohna Road', 'Golf Course Road', 'MG Road', 'Cyber City', 'New Gurugram'],
    developers: [
      { name: 'M3M Group', specialization: 'Luxury Projects', years: 15 },
      { name: 'Emaar India', specialization: 'Premium Townships', years: 20 },
      { name: 'Ireo', specialization: 'Luxury Residences', years: 12 }
    ]
  },
  'Alibaug': {
    country: 'India',
    micromarkets: ['Beach Area', 'Fort Area', 'Alibaug City', 'Kihim', 'Awas'],
    developers: [
      { name: 'Lodha Group', specialization: 'Beach Villas', years: 40 },
      { name: 'Shapoorji Pallonji', specialization: 'Premium Villas', years: 150 },
      { name: 'Raymond Realty', specialization: 'Plotted Development', years: 10 }
    ]
  },
  'Mumbai': {
    country: 'India',
    micromarkets: ['Bandra', 'Andheri', 'Worli', 'Powai', 'Juhu', 'Goregaon', 'Thane'],
    developers: [
      { name: 'Lodha Group', specialization: 'Luxury Towers', years: 40 },
      { name: 'Godrej Properties', specialization: 'Premium Apartments', years: 25 },
      { name: 'Oberoi Realty', specialization: 'Ultra-luxury', years: 35 },
      { name: 'Kalpataru', specialization: 'Residential', years: 50 }
    ]
  }
};

const generateSlug = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

const generateSEOMetadata = (name: string, type: string, city?: string) => {
  const slug = generateSlug(name);
  const seoTitle = city 
    ? `${name} ${city} - Premium Real Estate | RE/MAX Westside`
    : `${name} Real Estate - Properties & Investment Guide`;
  const metaDescription = city
    ? `Explore ${name} in ${city}. Find premium properties, investment opportunities, and detailed market insights.`
    : `Discover ${name} real estate market. Comprehensive guide to properties, pricing, and investment opportunities.`;
  const h1Title = city ? `${name}, ${city}` : name;
  const heroHook = city
    ? `Discover Premium Properties in ${name}`
    : `Your Gateway to ${name} Real Estate`;
  
  return { slug, seoTitle, metaDescription, h1Title, heroHook };
};

class DataSeedingService {
  async checkIfSeedingNeeded(): Promise<boolean> {
    const { data: cities } = await supabase.from('cities').select('id');
    const { data: micromarkets } = await supabase.from('micro_markets').select('id');
    
    // Need seeding if we have less than 9 cities or less than 20 micromarkets
    return (cities?.length || 0) < 9 || (micromarkets?.length || 0) < 20;
  }

  async seedMissingCities(): Promise<number> {
    const { data: existingCities } = await supabase
      .from('cities')
      .select('city_name');
    
    const existingNames = new Set(existingCities?.map(c => c.city_name) || []);
    const missingCities = Object.keys(CITY_DATA).filter(name => !existingNames.has(name));
    
    if (missingCities.length === 0) return 0;
    
    const citiesToInsert = missingCities.map(cityName => {
      const cityInfo = CITY_DATA[cityName as keyof typeof CITY_DATA];
      const seo = generateSEOMetadata(cityName, 'city');
      
      return {
        city_name: cityName,
        country: cityInfo.country,
        url_slug: seo.slug,
        seo_title: seo.seoTitle,
        meta_description: seo.metaDescription,
        h1_title: seo.h1Title,
        hero_hook: seo.heroHook,
        city_overview_seo: `${cityName} is a dynamic real estate market offering diverse investment opportunities.`,
        page_status: 'draft',
        average_price_sqft: 5000,
        annual_appreciation_pct: 8,
        rental_yield_pct: 3
      };
    });
    
    const { error } = await supabase.from('cities').insert(citiesToInsert);
    if (error) {
      console.error('Error seeding cities:', error);
      return 0;
    }
    
    return citiesToInsert.length;
  }

  async seedMicromarkets(): Promise<number> {
    const { data: cities } = await supabase.from('cities').select('id, city_name');
    if (!cities) return 0;
    
    let totalSeeded = 0;
    
    for (const city of cities) {
      const cityData = CITY_DATA[city.city_name as keyof typeof CITY_DATA];
      if (!cityData) continue;
      
      // Check existing micromarkets for this city
      const { data: existing } = await supabase
        .from('micro_markets')
        .select('micro_market_name')
        .eq('city_id', city.id);
      
      const existingNames = new Set(existing?.map(m => m.micro_market_name) || []);
      const micromarketsToAdd = cityData.micromarkets.filter(name => !existingNames.has(name));
      
      if (micromarketsToAdd.length === 0) continue;
      
      const micromarketsToInsert = micromarketsToAdd.map(mmName => {
        const seo = generateSEOMetadata(mmName, 'micromarket', city.city_name);
        
        return {
          micro_market_name: mmName,
          city_id: city.id,
          url_slug: seo.slug,
          seo_title: seo.seoTitle,
          meta_description: seo.metaDescription,
          h1_title: seo.h1Title,
          hero_hook: seo.heroHook,
          status: 'draft',
          price_per_sqft_min: 5000 + Math.floor(Math.random() * 3000)
        };
      });
      
      const { error } = await supabase.from('micro_markets').insert(micromarketsToInsert);
      if (!error) {
        totalSeeded += micromarketsToInsert.length;
      }
    }
    
    return totalSeeded;
  }

  async seedDevelopers(): Promise<number> {
    const { data: cities } = await supabase.from('cities').select('id, city_name');
    if (!cities) return 0;
    
    let totalSeeded = 0;
    
    for (const city of cities) {
      const cityData = CITY_DATA[city.city_name as keyof typeof CITY_DATA];
      if (!cityData) continue;
      
      // Check existing developers for this city
      const { data: existing } = await supabase
        .from('developers')
        .select('developer_name')
        .eq('primary_market_id', city.id);
      
      const existingNames = new Set(existing?.map(d => d.developer_name) || []);
      const developersToAdd = cityData.developers.filter(dev => !existingNames.has(dev.name));
      
      if (developersToAdd.length === 0) continue;
      
      const developersToInsert = developersToAdd.map(dev => {
        const seo = generateSEOMetadata(dev.name, 'developer', city.city_name);
        
        return {
          developer_name: dev.name,
          primary_market_id: city.id,
          url_slug: seo.slug,
          seo_title: seo.seoTitle,
          meta_description: seo.metaDescription,
          hero_description: `Leading real estate developer specializing in ${dev.specialization}`,
          long_description_seo: `${dev.name} has been transforming ${city.city_name}'s skyline for ${dev.years} years with exceptional ${dev.specialization}.`,
          specialization: dev.specialization,
          years_in_business: dev.years,
          total_projects: Math.floor(Math.random() * 20) + 5,
          total_sft_delivered: `${Math.floor(Math.random() * 50) + 10} Million SFT`
        };
      });
      
      const { error } = await supabase.from('developers').insert(developersToInsert);
      if (!error) {
        totalSeeded += developersToInsert.length;
      }
    }
    
    return totalSeeded;
  }

  async seedSampleProjects(): Promise<number> {
    // Get all micromarkets and developers
    const { data: micromarkets } = await supabase
      .from('micro_markets')
      .select('id, micro_market_name, city_id');
    
    const { data: developers } = await supabase
      .from('developers')
      .select('id, developer_name, primary_market_id');
    
    if (!micromarkets || !developers) return 0;
    
    let totalSeeded = 0;
    
    // Create 2 projects per micromarket-developer combination (limited to first 20)
    const combinations = micromarkets.slice(0, 10).flatMap(mm => 
      developers
        .filter(dev => dev.primary_market_id === mm.city_id)
        .slice(0, 2)
        .map(dev => ({ mm, dev }))
    );
    
    for (const { mm, dev } of combinations) {
      // Check if projects already exist for this combination
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('micro_market_id', mm.id)
        .eq('developer_id', dev.id);
      
      if (existing && existing.length > 0) continue;
      
      const projectName = `${dev.developer_name.split(' ')[0]} ${mm.micro_market_name}`;
      const seo = generateSEOMetadata(projectName, 'project');
      
      const project = {
        project_name: projectName,
        micro_market_id: mm.id,
        developer_id: dev.id,
        city_id: mm.city_id,
        url_slug: seo.slug,
        seo_title: seo.seoTitle,
        meta_description: seo.metaDescription,
        h1_title: seo.h1Title,
        hero_hook: seo.heroHook,
        project_overview_seo: `${projectName} is a premium real estate project offering modern living spaces.`,
        price_range_text: `₹${(5 + Math.random() * 10).toFixed(2)}Cr - ₹${(15 + Math.random() * 20).toFixed(2)}Cr`,
        completion_status: ['Under Construction', 'Ready to Move', 'Pre-launch'][Math.floor(Math.random() * 3)],
        status: 'draft'
      };
      
      const { error } = await supabase.from('projects').insert([project]);
      if (!error) {
        totalSeeded++;
      }
    }
    
    return totalSeeded;
  }

  async seedAllData(): Promise<SeedResult> {
    console.log('Starting data seeding...');
    
    const cities = await this.seedMissingCities();
    console.log(`Seeded ${cities} cities`);
    
    const micromarkets = await this.seedMicromarkets();
    console.log(`Seeded ${micromarkets} micromarkets`);
    
    const developers = await this.seedDevelopers();
    console.log(`Seeded ${developers} developers`);
    
    const projects = await this.seedSampleProjects();
    console.log(`Seeded ${projects} projects`);
    
    return {
      seeded: cities + micromarkets + developers + projects > 0,
      counts: { cities, micromarkets, developers, projects }
    };
  }
}

export const dataSeedingService = new DataSeedingService();
