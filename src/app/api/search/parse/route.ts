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
    
    // Debug: Check if beeramguda exists in micro_markets
    const { data: microMarkets, error: mmError } = await supabase
      .from('micro_markets')
      .select('micro_market_name')
      .ilike('micro_market_name', '%beeramguda%');
    
    const { writeFileSync, appendFileSync, existsSync, mkdirSync } = await import('fs');
    const { join } = await import('path');
    const logPath = join(process.cwd(), '.cursor', 'debug.log');
    const logDir = join(process.cwd(), '.cursor');
    if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
    
    try {
      appendFileSync(logPath, JSON.stringify({
        location: 'api/search/parse/route.ts:21',
        message: 'Database check for beeramguda',
        data: { 
          query,
          microMarketsFound: microMarkets || [],
          mmError: mmError?.message,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B-DB',
      }) + '\n');
    } catch (e) {}
    
    const parsed = await parseSearchQuery(query.trim(), supabase);
    
    try {
      appendFileSync(logPath, JSON.stringify({
        location: 'api/search/parse/route.ts:44',
        message: 'Parse result from queryParser',
        data: { parsed },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'PARSE-RESULT',
      }) + '\n');
    } catch (e) {}

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
