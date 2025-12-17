#!/usr/bin/env tsx
/**
 * Route Integrity Checker
 * 
 * Validates that all published entities in Supabase have working routes.
 * Checks:
 * - Micro-markets: /{citySlug}/{microMarketSlug}
 * - Projects: /{citySlug}/{microMarketSlug}/projects/{projectSlug}
 * - Developers: /developers/{slug}
 */

import { createClient } from '@supabase/supabase-js';

interface RouteCheck {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
}

interface CheckResult {
  total: number;
  passed: number;
  failed: number;
  broken: RouteCheck[];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRoute(url: string): Promise<RouteCheck> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    
    return {
      url,
      status: response.status,
      ok: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      url,
      status: 0,
      ok: false,
      error: error.message || 'Network error',
    };
  }
}

async function checkMicroMarkets(): Promise<RouteCheck[]> {
  console.log('\n📍 Checking micro-markets...');
  
  const { data: microMarkets, error } = await supabase
    .from('micro_markets')
    .select(`
      url_slug,
      page_status,
      cities!inner(url_slug)
    `)
    .eq('page_status', 'published')
    .not('cities.url_slug', 'is', null);

  if (error) {
    console.error('❌ Error fetching micro-markets:', error);
    return [];
  }

  if (!microMarkets || microMarkets.length === 0) {
    console.log('   No published micro-markets found');
    return [];
  }

  const checks: RouteCheck[] = [];
  const cityMap = new Map<string, string>();

  // Normalize city data (handle array responses)
  microMarkets.forEach((mm: any) => {
    const city = Array.isArray(mm.cities) ? mm.cities[0] : mm.cities;
    if (city?.url_slug) {
      cityMap.set(mm.url_slug, city.url_slug);
    }
  });

  for (const mm of microMarkets) {
    const citySlug = cityMap.get(mm.url_slug);
    if (!citySlug) continue;

    const url = `${SITE_URL}/${citySlug}/${mm.url_slug}`;
    const result = await checkRoute(url);
    checks.push(result);
    
    if (result.ok) {
      process.stdout.write('✓');
    } else {
      process.stdout.write('✗');
    }
  }

  return checks;
}

async function checkProjects(): Promise<RouteCheck[]> {
  console.log('\n🏗️  Checking projects...');
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      url_slug,
      status,
      cities!inner(url_slug),
      micro_markets!inner(url_slug)
    `)
    .or('status.ilike.published,status.ilike.%under construction%')
    .not('cities.url_slug', 'is', null)
    .not('micro_markets.url_slug', 'is', null);

  if (error) {
    console.error('❌ Error fetching projects:', error);
    return [];
  }

  if (!projects || projects.length === 0) {
    console.log('   No published projects found');
    return [];
  }

  const checks: RouteCheck[] = [];

  for (const project of projects) {
    // Handle array responses from Supabase joins
    const city = Array.isArray(project.cities) ? project.cities[0] : project.cities;
    const microMarket = Array.isArray(project.micro_markets) 
      ? project.micro_markets[0] 
      : project.micro_markets;

    if (!city?.url_slug || !microMarket?.url_slug) continue;

    const url = `${SITE_URL}/${city.url_slug}/${microMarket.url_slug}/projects/${project.url_slug}`;
    const result = await checkRoute(url);
    checks.push(result);
    
    if (result.ok) {
      process.stdout.write('✓');
    } else {
      process.stdout.write('✗');
    }
  }

  return checks;
}

async function checkDevelopers(): Promise<RouteCheck[]> {
  console.log('\n👥 Checking developers...');
  
  const { data: developers, error } = await supabase
    .from('developers')
    .select('url_slug, is_published')
    .eq('is_published', true)
    .not('url_slug', 'is', null);

  if (error) {
    console.error('❌ Error fetching developers:', error);
    return [];
  }

  if (!developers || developers.length === 0) {
    console.log('   No published developers found');
    return [];
  }

  const checks: RouteCheck[] = [];

  for (const developer of developers) {
    const url = `${SITE_URL}/developers/${developer.url_slug}`;
    const result = await checkRoute(url);
    checks.push(result);
    
    if (result.ok) {
      process.stdout.write('✓');
    } else {
      process.stdout.write('✗');
    }
  }

  return checks;
}

async function main() {
  console.log('🔍 Route Integrity Checker');
  console.log('='.repeat(50));
  console.log(`Site URL: ${SITE_URL}`);
  console.log(`Supabase: ${SUPABASE_URL ? '✓' : '✗'}`);

  const [microMarketResults, projectResults, developerResults] = await Promise.all([
    checkMicroMarkets(),
    checkProjects(),
    checkDevelopers(),
  ]);

  const allResults = [...microMarketResults, ...projectResults, ...developerResults];
  const broken = allResults.filter(r => !r.ok);
  const passed = allResults.filter(r => r.ok);

  console.log('\n\n📊 Results:');
  console.log('='.repeat(50));
  console.log(`Total routes checked: ${allResults.length}`);
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${broken.length}`);

  if (broken.length > 0) {
    console.log('\n❌ Broken Routes:');
    console.log('='.repeat(50));
    broken.forEach(({ url, status, error }) => {
      console.log(`  ${status || 'ERR'}: ${url}`);
      if (error) console.log(`     ${error}`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('\n✅ All routes are working!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

