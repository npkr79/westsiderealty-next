import { createServiceClient } from '@/lib/supabase/serviceClient';
import { parseSearchQuery } from '@/lib/search/queryParser';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract all filters from URL
  const city = searchParams.get('city') || 'hyderabad';
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

    // Get city ID
    const { data: cityData } = await supabase
      .from('cities')
      .select('id, url_slug')
      .eq('url_slug', city)
      .maybeSingle();

    if (!cityData) {
      return NextResponse.json({ 
        results: [], 
        appliedFilters: {},
        total: 0,
        message: `City "${city}" not found` 
      }, { status: 404 });
    }

    // Determine which table to query based on category + projectType
    // For now, we'll use 'projects' table for all cases
    // In the future, we can add logic for hyderabad_properties (resale) or commercial_properties
    const useProjectsTable = true; // Always use projects table for now

    // Build query
    let dbQuery = supabase
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
      .eq('city_id', cityData.id);

    // Apply category filter (residential, commercial, plots)
    // This is handled in post-processing for property_types

    // Apply projectType filter (resale vs new)
    if (projectType === 'resale') {
      // Resale: ready-to-move or completed projects
      dbQuery = dbQuery.or('status.ilike.%ready%,status.ilike.%completed%,status.ilike.%resale%');
    } else if (projectType === 'new' || projectType === 'new-project') {
      // New projects: published, under construction, or any status that's not explicitly "resale"
      dbQuery = dbQuery.or('status.ilike.published,status.ilike.%under construction%,status.is.null,status.neq.resale');
    }

    // CRITICAL: Apply micro-market filter using micro_market_id
    // First, look up the micro-market ID from name or slug
    if (microMarket) {
      const { data: mmData } = await supabase
        .from('micro_markets')
        .select('id')
        .or(`micro_market_name.ilike.%${microMarket}%,url_slug.ilike.%${microMarket.toLowerCase().replace(/\s+/g, '-')}%`)
        .limit(1)
        .maybeSingle();

      if (mmData?.id) {
        console.log(`[SearchAPI] Found micro-market ID: ${mmData.id} for "${microMarket}"`);
        dbQuery = dbQuery.eq('micro_market_id', mmData.id);
      } else {
        console.log(`[SearchAPI] No micro-market found for: "${microMarket}"`);
      }
    }

    // Apply developer filter using developer_id
    // First, look up the developer ID from name or slug
    if (developer) {
      const { data: devData } = await supabase
        .from('developers')
        .select('id')
        .or(`developer_name.ilike.%${developer}%,url_slug.ilike.%${developer.toLowerCase().replace(/\s+/g, '-')}%`)
        .limit(1)
        .maybeSingle();

      if (devData?.id) {
        console.log(`[SearchAPI] Found developer ID: ${devData.id} for "${developer}"`);
        dbQuery = dbQuery.eq('developer_id', devData.id);
      } else {
        console.log(`[SearchAPI] No developer found for: "${developer}"`);
      }
    }

    // Apply project name filter (from parsed text) - HIGH PRIORITY
    if (projectName) {
      dbQuery = dbQuery.ilike('project_name', `%${projectName}%`);
    }

    // Apply BHK filter using property_types JSONB array
    // BHK format in DB: "3 BHK", "4 BHK" (with space)
    // Note: This will be filtered in post-processing due to Supabase JS client JSONB limitations
    // We'll fetch all and filter by property_types array in memory

    // Apply completion_status logic (for new projects)
    if (completionStatus) {
      // Specific status from parsed text like "New Launch"
      dbQuery = dbQuery.or(`completion_status.ilike.%${completionStatus}%,status.ilike.%${completionStatus}%`);
    } else if (isNewProject) {
      // Generic "new projects" - any non-null completion_status or status
      // We'll filter in post-processing
    }

    // Apply text search for remaining query
    if (textQuery && textQuery.trim().length >= 2) {
      dbQuery = dbQuery.or(`
        project_name.ilike.%${textQuery.trim()}%,
        meta_description.ilike.%${textQuery.trim()}%,
        project_overview_seo.ilike.%${textQuery.trim()}%
      `);
    }

    // Execute query
    const { data: projects, error } = await dbQuery
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500); // Fetch more for post-processing

    if (error) {
      console.error('[SearchAPI] Error:', error);
      return NextResponse.json({ 
        error: error.message,
        results: [],
        appliedFilters: {},
        total: 0
      }, { status: 500 });
    }

    // Post-process: Filter by property types, category, BHK, and "new projects" logic
    let filteredProjects = projects || [];

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

    // ── Advisor table query (villa searches + fallback for empty results) ──────
    const shouldQueryAdvisor = projectTypeFilter === 'villa' || filteredProjects.length === 0;
    let advisorResults: any[] = [];

    if (shouldQueryAdvisor) {
      let advisorQuery = supabase
        .from('advisor_project_intelligence')
        .select('project_name, project_slug, rera_id, project_type, current_status, developer_brand, micro_market, city_slug, current_price_per_sqft_min, current_price_per_sqft_max, total_units, land_area_acres, primary_differentiator, investment_verdict, quality_score')
        .eq('city_slug', 'hyderabad')
        .order('quality_score', { ascending: false })
        .limit(10);

      if (projectTypeFilter === 'villa') {
        advisorQuery = advisorQuery.eq('project_type', 'villa');
      }
      if (microMarket) {
        advisorQuery = advisorQuery.ilike('micro_market', `%${microMarket}%`);
      }

      const { data: advisorData } = await advisorQuery;

      if (advisorData?.length) {
        // Map advisor records to a shape compatible with the projects table results
        const existingSlugs = new Set(filteredProjects.map((p: any) => p.url_slug));
        advisorResults = advisorData
          .filter((a: any) => !existingSlugs.has(a.project_slug))
          .map((a: any) => ({
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
            micro_market: { micro_market_name: a.micro_market, url_slug: null },
            developer: { developer_name: a.developer_brand, url_slug: null },
            city: { city_name: 'Hyderabad', url_slug: 'hyderabad' },
            // Advisor-specific fields for AI overview
            developer_brand: a.developer_brand,
            primary_differentiator: a.primary_differentiator,
            investment_verdict: a.investment_verdict,
            quality_score: a.quality_score,
            price_min: a.current_price_per_sqft_min,
            price_max: a.current_price_per_sqft_max,
            _source: 'advisor',
          }));
      }
    }

    // Merge: if villa search, advisor records (sorted by quality_score) come first
    let combinedResults: any[];
    if (projectTypeFilter === 'villa') {
      combinedResults = [...advisorResults, ...filteredProjects];
    } else {
      combinedResults = [...filteredProjects, ...advisorResults];
    }

    return NextResponse.json({
      results: combinedResults,
      appliedFilters: {
        city,
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
