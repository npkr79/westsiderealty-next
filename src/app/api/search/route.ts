import { createServiceClient } from '@/lib/supabase/serviceClient';
import { parseSearchQuery } from '@/lib/search/queryParser';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract all filters from URL
  // city is intentionally optional — absent means cross-city search via advisor table
  const city = searchParams.get('city') ?? '';
  const category = searchParams.get('category') || 'residential';
  const projectType = searchParams.get('projectType'); // 'resale' | 'new' | 'invest' | etc.
  const propertyTypesParam = searchParams.get('propertyTypes'); // comma-separated
  const propertyTypes = propertyTypesParam ? propertyTypesParam.split(',').filter(Boolean) : [];
    const microMarket = searchParams.get('microMarket');
    const bhk = searchParams.get('bhk') || searchParams.get('bhkConfig'); // Support both parameter names
    const projectName = searchParams.get('projectName');
    const developer = searchParams.get('developer');
  const completionStatus = searchParams.get('completionStatus');
  const isNewProject = searchParams.get('isNewProject') === 'true';
  const textQuery = searchParams.get('q');
  const projectTypeFilter = searchParams.get('project_type'); // 'villa' | 'apartment' | 'commercial' etc.

  try {
    const supabase = createServiceClient();

    // Get city ID (city param is optional — if absent we skip the projects table query)
    const { data: cityData } = city
      ? await supabase
          .from('cities')
          .select('id, url_slug')
          .eq('url_slug', city)
          .maybeSingle()
      : { data: null };

    // Build query against projects table only when a city is known
    let dbQuery = cityData
      ? supabase
          .from('projects')
          .select(`
            id,
            project_name,
            url_slug,
            hero_image_url,
            price_range_text,
            status,
            completion_status,
            property_types,
            meta_description,
            project_overview_seo,
            micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug),
            developer:developers(developer_name, url_slug),
            city:cities!inner(city_name, url_slug)
          `)
          .eq('city_id', cityData.id)
      : null;

    // Apply filters only when querying the projects table (cityData exists)
    if (dbQuery) {
      // Apply projectType filter (resale vs new)
      if (projectType === 'resale') {
        dbQuery = dbQuery.or('status.ilike.%ready%,status.ilike.%completed%,status.ilike.%resale%');
      } else if (projectType === 'new' || projectType === 'new-project') {
        dbQuery = dbQuery.or('status.ilike.published,status.ilike.%under construction%,status.is.null,status.neq.resale');
      }

      // Apply micro-market filter
      if (microMarket) {
        const { data: mmData } = await supabase
          .from('micro_markets')
          .select('id')
          .or(`micro_market_name.ilike.%${microMarket}%,url_slug.ilike.%${microMarket.toLowerCase().replace(/\s+/g, '-')}%`)
          .limit(1)
          .maybeSingle();
        if (mmData?.id) {
          dbQuery = dbQuery.eq('micro_market_id', mmData.id);
        }
      }

      // Apply developer filter
      if (developer) {
        const { data: devData } = await supabase
          .from('developers')
          .select('id')
          .or(`developer_name.ilike.%${developer}%,url_slug.ilike.%${developer.toLowerCase().replace(/\s+/g, '-')}%`)
          .limit(1)
          .maybeSingle();
        if (devData?.id) {
          dbQuery = dbQuery.eq('developer_id', devData.id);
        }
      }

      // Apply project name filter
      if (projectName) {
        dbQuery = dbQuery.ilike('project_name', `%${projectName}%`);
      }

      // Apply completion_status filter
      if (completionStatus) {
        dbQuery = dbQuery.or(`completion_status.ilike.%${completionStatus}%,status.ilike.%${completionStatus}%`);
      }

      // Apply text search
      if (textQuery && textQuery.trim().length >= 2) {
        dbQuery = dbQuery.or(`
          project_name.ilike.%${textQuery.trim()}%,
          meta_description.ilike.%${textQuery.trim()}%,
          project_overview_seo.ilike.%${textQuery.trim()}%
        `);
      }
    }

    // Execute projects query (skip if no city context)
    let projects: any[] = [];
    if (dbQuery) {
      const { data, error } = await dbQuery
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('[SearchAPI] Error:', error);
        return NextResponse.json({
          error: error.message,
          results: [],
          appliedFilters: {},
          total: 0,
        }, { status: 500 });
      }
      projects = data ?? [];
    }

    // Post-process: Filter by property types, category, BHK, and "new projects" logic
    let filteredProjects = projects;

    // Filter by BHK using property_types JSONB array
    // BHK format in DB: "3 BHK", "4 BHK" (with space)
    if (bhk) {
      // Normalize BHK format to match DB format (ensure space)
      const normalizedBhk = bhk.replace(/(\d+)\s*bhk/i, '$1 BHK');
      
      filteredProjects = filteredProjects.filter((p: any) => {
        const propertyTypes = p.property_types;
        
        // Handle array of strings
        if (Array.isArray(propertyTypes)) {
          return propertyTypes.some((propType: any) => {
            const propTypeStr = String(propType).trim();
            // Exact match with normalized BHK (case-insensitive)
            return propTypeStr.toLowerCase() === normalizedBhk.toLowerCase();
          });
        }
        
        // Handle JSONB object or string representation
        if (propertyTypes) {
          const typesStr = JSON.stringify(propertyTypes).toLowerCase();
          return typesStr.includes(normalizedBhk.toLowerCase());
        }
        
        return false;
      });
    }

    // Filter by property types (from checkboxes or parsed text)
    if (propertyTypes.length > 0) {
      filteredProjects = filteredProjects.filter((p: any) => {
        const typesStr = JSON.stringify(p.property_types || {}).toLowerCase();
        return propertyTypes.some(pt => {
          const ptLower = pt.toLowerCase();
          // Check if property_types JSONB contains the type
          if (typesStr.includes(ptLower)) return true;
          
          // Handle array of strings
          if (Array.isArray(p.property_types)) {
            return p.property_types.some((propType: any) => 
              String(propType).toLowerCase().includes(ptLower)
            );
          }
          
          // Check project_name as fallback
          if (p.project_name?.toLowerCase().includes(ptLower)) return true;
          
          return false;
        });
      });
    }

    // Filter by category (residential, commercial, plots)
    if (category === 'residential') {
      filteredProjects = filteredProjects.filter((p: any) => {
        const types = p.property_types;
        if (!types) return true;
        const typesStr = JSON.stringify(types).toLowerCase();
        return !typesStr.includes('commercial') && !typesStr.includes('plot') && !typesStr.includes('land');
      });
    } else if (category === 'commercial') {
      filteredProjects = filteredProjects.filter((p: any) => {
        const types = p.property_types;
        if (!types) return false;
        const typesStr = JSON.stringify(types).toLowerCase();
        return typesStr.includes('commercial') || typesStr.includes('office') || typesStr.includes('retail');
      });
    } else if (category === 'land' || category === 'plots') {
      filteredProjects = filteredProjects.filter((p: any) => {
        const types = p.property_types;
        if (!types) return false;
        const typesStr = JSON.stringify(types).toLowerCase();
        return typesStr.includes('plot') || typesStr.includes('land') || typesStr.includes('agricultural');
      });
    }

    // Filter for "new projects" - exclude projects with null completion_status AND null status
    if (isNewProject && !completionStatus) {
      filteredProjects = filteredProjects.filter((p: any) => {
        return p.completion_status != null || p.status != null;
      });
    }

    // Limit final results
    filteredProjects = filteredProjects.slice(0, 50);

    // ── Advisor table query ───────────────────────────────────────────────────
    // Triggers for: villa search, no city context (cross-city name search), empty results,
    // or when the city doesn't have projects in the main table (e.g. Goa)
    const rawQ = (textQuery || '').trim();
    const shouldQueryAdvisor =
      projectTypeFilter === 'villa' ||
      filteredProjects.length === 0 || // also covers: city set but 0 matches (e.g. Goa has no projects table rows)
      !cityData; // no city = cross-city search

    let advisorResults: any[] = [];

    if (shouldQueryAdvisor) {
      let advisorQuery = supabase
        .from('advisor_project_intelligence')
        .select('project_name, project_slug, rera_id, project_type, current_status, developer_brand, micro_market, micro_market_slug, city, city_slug, current_price_per_sqft_min, current_price_per_sqft_max, total_units, land_area_acres, primary_differentiator, investment_verdict, quality_score');

      // Determine city context for advisor:
      // 1. Use explicit city param if available
      // 2. Detect city from raw query text ("goa", "hyderabad", "dubai")
      // 3. No filter = search all cities
      let advisorCitySlug: string | null = cityData ? city : null;
      if (!advisorCitySlug && rawQ) {
        const ql = rawQ.toLowerCase();
        if (ql.includes('goa')) advisorCitySlug = 'goa';
        else if (ql.includes('hyderabad') || ql.includes(' hyd')) advisorCitySlug = 'hyderabad';
        else if (ql.includes('dubai')) advisorCitySlug = 'dubai';
      }
      if (advisorCitySlug) {
        advisorQuery = advisorQuery.eq('city_slug', advisorCitySlug);
      }

      // Name search: use explicit projectName, OR raw query only when it looks like a
      // project name (no property-type or micro-market filter active — not a category search)
      const looksLikeProjectName = !projectTypeFilter && !microMarket;
      const nameSearch = projectName || (looksLikeProjectName ? rawQ : null);
      if (nameSearch && nameSearch.length >= 2) {
        advisorQuery = advisorQuery.ilike('project_name', `%${nameSearch}%`);
      } else if (projectTypeFilter) {
        // Category search (e.g. "Goa villas") — filter by type, not name
        advisorQuery = advisorQuery.eq('project_type', projectTypeFilter);
      }

      if (microMarket) {
        advisorQuery = advisorQuery.ilike('micro_market', `%${microMarket}%`);
      }

      advisorQuery = advisorQuery
        .order('quality_score', { ascending: false })
        .limit(10);

      const { data: advisorData } = await advisorQuery;

      if (advisorData?.length) {
        const existingSlugs = new Set(filteredProjects.map((p: any) => p.url_slug));
        advisorResults = advisorData
          .filter((a: any) => !existingSlugs.has(a.project_slug))
          .map((a: any) => {
            const cityLabel =
              a.city
                ? a.city.charAt(0).toUpperCase() + a.city.slice(1)
                : 'India';
            return {
              id: a.rera_id || a.project_slug,
              project_name: a.project_name,
              url_slug: a.project_slug,
              hero_image_url: null,
              price_range_text: a.current_price_per_sqft_min
                ? `₹${Math.round(a.current_price_per_sqft_min / 1000)}K–${Math.round((a.current_price_per_sqft_max || a.current_price_per_sqft_min) / 1000)}K psft`
                : null,
              status: a.current_status,
              completion_status: a.current_status,
              property_types: [a.project_type],
              micro_market: {
                micro_market_name: a.micro_market,
                url_slug: a.micro_market_slug ?? null,
              },
              developer: { developer_name: a.developer_brand, url_slug: null },
              city: { city_name: cityLabel, url_slug: a.city_slug },
              developer_brand: a.developer_brand,
              primary_differentiator: a.primary_differentiator,
              investment_verdict: a.investment_verdict,
              quality_score: a.quality_score,
              price_min: a.current_price_per_sqft_min,
              price_max: a.current_price_per_sqft_max,
              _source: 'advisor',
            };
          });
      }
    }

    // Merge: villa search → advisor first; otherwise listing projects first
    let combinedResults: any[];
    if (projectTypeFilter === 'villa') {
      combinedResults = [...advisorResults, ...filteredProjects];
    } else {
      combinedResults = [...filteredProjects, ...advisorResults];
    }

    return NextResponse.json({
      results: combinedResults,
      appliedFilters: {
        city: city || null,
        category,
        projectType,
        propertyTypes,
        microMarket,
        bhk,
        projectName,
        developer,
        completionStatus,
        isNewProject,
        textQuery,
        projectTypeFilter,
      },
      total: combinedResults.length,
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch (error: any) {
    console.error('[SearchAPI] Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      results: [],
      appliedFilters: {},
      total: 0
    }, { status: 500 });
  }
}
