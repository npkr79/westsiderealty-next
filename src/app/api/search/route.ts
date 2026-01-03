import { createClient } from '@/lib/supabase/server';
import { parseSearchQuery } from '@/lib/search/queryParser';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const city = searchParams.get('city') || 'hyderabad';

  if (!query.trim()) {
    return NextResponse.json({ 
      results: [], 
      parsed: null, 
      total: 0,
      message: 'Please provide a search query' 
    });
  }

  try {
    const supabase = await createClient();

    // Get city ID
    const { data: cityData } = await supabase
      .from('cities')
      .select('id, url_slug')
      .eq('url_slug', city)
      .maybeSingle();

    if (!cityData) {
      return NextResponse.json({ 
        results: [], 
        parsed: null, 
        total: 0,
        message: `City "${city}" not found` 
      }, { status: 404 });
    }

    // Parse the natural language query
    const parsed = await parseSearchQuery(query, supabase);

    // Build Supabase query
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

    // Apply parsed filters

    // Micro-market filter (highest priority for location queries)
    if (parsed.microMarket) {
      dbQuery = dbQuery.eq('micro_markets.micro_market_name', parsed.microMarket);
    }

    // Developer filter
    if (parsed.developer) {
      dbQuery = dbQuery.eq('developers.developer_name', parsed.developer);
    }

    // BHK configuration filter (search in project_name or property_types)
    if (parsed.bhkConfig) {
      // Try to match BHK in project_name first
      dbQuery = dbQuery.ilike('project_name', `%${parsed.bhkConfig}%`);
      // Also check property_types JSONB if needed (this is a fallback)
      // Note: Supabase doesn't support direct JSONB array contains with text matching easily
      // So we'll rely on project_name matching for BHK
    }

    // Property type filter (check in property_types JSONB)
    if (parsed.propertyType) {
      // property_types is JSONB, so we need to use text search
      // We'll filter in memory after fetching, or use ilike on a text representation
      // For now, we'll also search in project_name as a fallback
      const propertyTypeLower = parsed.propertyType.toLowerCase();
      dbQuery = dbQuery.or(`project_name.ilike.%${propertyTypeLower}%,meta_description.ilike.%${propertyTypeLower}%`);
    }

    // COMPLETION STATUS LOGIC:
    // Case 1: Specific status like "new launch projects in kokapet"
    if (parsed.completionStatus) {
      // Try to match in completion_status first, then fallback to status
      const statusMap: Record<string, string> = {
        'New Launch': 'New Launch',
        'Under Construction': 'Under Construction',
        'Ready to Move': 'Ready to Move',
        'Pre-Launch': 'Pre-Launch',
        'Upcoming': 'Upcoming',
        'Published': 'Published',
      };
      const dbStatus = statusMap[parsed.completionStatus] || parsed.completionStatus;
      
      // Check both completion_status and status fields
      dbQuery = dbQuery.or(`completion_status.ilike.%${dbStatus}%,status.ilike.%${dbStatus}%`);
    }
    // Case 2: Generic "new projects in kollur" = any non-null completion_status or status
    else if (parsed.isNewProject) {
      // Include projects with any completion_status or status (not null)
      // Use separate filters since Supabase .or() with .not() can be tricky
      // We'll filter in memory after fetching
      // For now, just ensure we get projects (we'll filter nulls in post-processing)
    }

    // If there's remaining text, use it for full-text search
    if (parsed.remainingQuery && parsed.remainingQuery.length >= 2) {
      dbQuery = dbQuery.or(`
        project_name.ilike.%${parsed.remainingQuery}%,
        meta_description.ilike.%${parsed.remainingQuery}%,
        project_overview_seo.ilike.%${parsed.remainingQuery}%
      `);
    }

    // Execute query
    const { data: projects, error } = await dbQuery
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[SearchAPI] Error:', error);
      return NextResponse.json({ 
        error: error.message,
        results: [],
        parsed,
        total: 0
      }, { status: 500 });
    }

    // Post-process: Filter by property type and "new projects" logic
    let filteredProjects = projects || [];
    
    // Filter by property type if specified (since JSONB filtering is complex)
    if (parsed.propertyType && projects) {
      const propertyTypeLower = parsed.propertyType.toLowerCase();
      filteredProjects = filteredProjects.filter((p: any) => {
        // Check project_name
        if (p.project_name?.toLowerCase().includes(propertyTypeLower)) return true;
        
        // Check property_types JSONB
        if (p.property_types) {
          const typesStr = JSON.stringify(p.property_types).toLowerCase();
          if (typesStr.includes(propertyTypeLower)) return true;
          
          // Handle array of strings
          if (Array.isArray(p.property_types)) {
            return p.property_types.some((pt: any) => 
              String(pt).toLowerCase().includes(propertyTypeLower)
            );
          }
        }
        
        return false;
      });
    }
    
    // Filter for "new projects" - exclude projects with null completion_status AND null status
    if (parsed.isNewProject && !parsed.completionStatus) {
      filteredProjects = filteredProjects.filter((p: any) => {
        return p.completion_status != null || p.status != null;
      });
    }

    return NextResponse.json({
      results: filteredProjects,
      parsed: parsed, // Return parsed info for UI display
      total: filteredProjects.length,
    });
  } catch (error: any) {
    console.error('[SearchAPI] Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      results: [],
      parsed: null,
      total: 0
    }, { status: 500 });
  }
}
