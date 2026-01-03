import { createClient } from '@/lib/supabase/server';
import { parseSearchQuery } from '@/lib/search/queryParser';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to parse a search query without executing the search
 * Used by client components to get parsed filters before routing
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ 
      parsed: null,
      message: 'Please provide a search query' 
    });
  }

  try {
    const supabase = await createClient();
    const parsed = await parseSearchQuery(query.trim(), supabase);

    return NextResponse.json({
      parsed,
    });
  } catch (error: any) {
    console.error('[SearchParseAPI] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      parsed: null
    }, { status: 500 });
  }
}
