import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const PORTALS = [
  {
    name: '99acres',
    searchUrl: 'https://www.99acres.com/search/property/buy/hyderabad?city=21&preference=S&area_unit=1&res_com=R',
  },
  {
    name: 'MagicBricks',
    searchUrl: 'https://www.magicbricks.com/property-for-sale/residential-real-estate?bedroom=&proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName=Hyderabad',
  },
  {
    name: 'Housing',
    searchUrl: 'https://housing.com/in/buy/searches/P84xmfw39xfpy5jcz',
  },
];

interface ScrapedProject {
  scrape_id: string;
  scraped_at: string;
  source_portal: string;
  source_url: string;
  project_name: string;
  developer_name: string;
  micro_market: string;
  rera_id: string;
  possession_date: string;
  price_range: string;
  bhk_configs: string;
  total_units: string;
  project_status: string;
  amenities_count: number;
  duplicate_status: 'NEW' | 'POSSIBLE_DUPLICATE' | 'EXACT_MATCH';
  matching_project_id: string | null;
  review_status: 'PENDING';
  raw_data_json: string;
}

export async function POST(req: NextRequest) {
  // 1. Verify API secret from header
  const apiSecret = req.headers.get('x-api-secret');
  if (apiSecret !== process.env.SCRAPE_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  try {
    // 2. Initialize Google Sheets
    if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
      throw new Error('GOOGLE_SHEETS_CREDENTIALS not configured');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // 3. Initialize Supabase for duplicate checking
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Fetch existing projects for duplicate detection
    const { data: existingProjects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        project_name,
        rera_id,
        micro_market_id,
        micro_markets(name)
      `);

    if (projectsError) {
      console.error('Error fetching existing projects:', projectsError);
    }

    // 5. Call Firecrawl to scrape each portal
    const allScrapedProjects: ScrapedProject[] = [];
    let totalErrors = 0;

    for (const portal of PORTALS) {
      try {
        if (!process.env.FIRECRAWL_API_KEY) {
          throw new Error('FIRECRAWL_API_KEY not configured');
        }

        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: portal.searchUrl,
            formats: ['markdown', 'html'],
            waitFor: 3000,
          }),
        });

        if (!response.ok) {
          throw new Error(`Firecrawl API error: ${response.statusText}`);
        }

        const data = await response.json();

        // 6. Extract project data from scraped content
        const projects = extractProjectsFromContent(data, portal.name, runId, startedAt);

        // 7. Check for duplicates
        for (const project of projects) {
          const duplicateCheck = checkForDuplicate(project, existingProjects || []);
          project.duplicate_status = duplicateCheck.status;
          project.matching_project_id = duplicateCheck.matchingId;
          allScrapedProjects.push(project);
        }
      } catch (error: any) {
        console.error(`Error scraping ${portal.name}:`, error);
        totalErrors++;
      }
    }

    // 8. Write to Google Sheets - Scraped Projects
    if (allScrapedProjects.length > 0) {
      // First, ensure headers exist
      const headers = [
        'scrape_id',
        'scraped_at',
        'source_portal',
        'source_url',
        'project_name',
        'developer_name',
        'micro_market',
        'rera_id',
        'possession_date',
        'price_range',
        'bhk_configs',
        'total_units',
        'project_status',
        'amenities_count',
        'duplicate_status',
        'matching_project_id',
        'review_status',
        'raw_data_json',
      ];

      // Check if sheet exists, create if not
      try {
        await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Scraped Projects!A1:R1',
        });
      } catch (error) {
        // Sheet doesn't exist, create headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Scraped Projects!A1:R1',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [headers] },
        });
      }

      // Append data
      const rows = allScrapedProjects.map(p => [
        p.scrape_id,
        p.scraped_at,
        p.source_portal,
        p.source_url,
        p.project_name,
        p.developer_name,
        p.micro_market,
        p.rera_id || '',
        p.possession_date || '',
        p.price_range || '',
        p.bhk_configs || '',
        p.total_units || '',
        p.project_status || '',
        p.amenities_count || 0,
        p.duplicate_status,
        p.matching_project_id || '',
        p.review_status,
        p.raw_data_json,
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Scraped Projects!A:R',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      });
    }

    // 9. Log the run to Scrape Runs sheet
    const newCount = allScrapedProjects.filter(p => p.duplicate_status === 'NEW').length;
    const dupCount = allScrapedProjects.filter(p => p.duplicate_status !== 'NEW').length;

    // Ensure Scrape Runs sheet exists
    const runHeaders = [
      'run_id',
      'started_at',
      'completed_at',
      'status',
      'portals_scraped',
      'projects_found',
      'new_projects',
      'duplicates',
      'errors',
    ];

    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Scrape Runs!A1:I1',
      });
    } catch (error) {
      // Sheet doesn't exist, create headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Scrape Runs!A1:I1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [runHeaders] },
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Scrape Runs!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          runId,
          startedAt,
          new Date().toISOString(),
          'COMPLETED',
          PORTALS.map(p => p.name).join(', '),
          allScrapedProjects.length,
          newCount,
          dupCount,
          totalErrors,
        ]],
      },
    });

    return NextResponse.json({
      success: true,
      runId,
      projectsFound: allScrapedProjects.length,
      newProjects: newCount,
      duplicates: dupCount,
      errors: totalErrors,
    });

  } catch (error: any) {
    console.error('Scraper error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred',
    }, { status: 500 });
  }
}

function extractProjectsFromContent(
  data: any,
  portalName: string,
  scrapeId: string,
  scrapedAt: string
): ScrapedProject[] {
  const projects: ScrapedProject[] = [];

  try {
    // Parse the scraped content
    const content = data.data?.markdown || data.data?.html || '';
    const html = data.data?.html || '';

    // Portal-specific extraction logic
    if (portalName === '99acres') {
      projects.push(...extract99AcresProjects(content, html, scrapeId, scrapedAt));
    } else if (portalName === 'MagicBricks') {
      projects.push(...extractMagicBricksProjects(content, html, scrapeId, scrapedAt));
    } else if (portalName === 'Housing') {
      projects.push(...extractHousingProjects(content, html, scrapeId, scrapedAt));
    }
  } catch (error) {
    console.error(`Error extracting projects from ${portalName}:`, error);
  }

  return projects;
}

function extract99AcresProjects(
  content: string,
  html: string,
  scrapeId: string,
  scrapedAt: string
): ScrapedProject[] {
  const projects: ScrapedProject[] = [];
  
  // Basic extraction - look for project names and links
  // This is a simplified version - you'll need to refine based on actual HTML structure
  const projectRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*project[^<]*)/gi;
  let match;

  while ((match = projectRegex.exec(html)) !== null) {
    const url = match[1];
    const nameMatch = match[2];

    if (url && nameMatch && url.includes('/property/')) {
      // Extract project name from URL or content
      const projectName = extractProjectName(nameMatch, url);
      
      projects.push({
        scrape_id: scrapeId,
        scraped_at: scrapedAt,
        source_portal: '99acres',
        source_url: url.startsWith('http') ? url : `https://www.99acres.com${url}`,
        project_name: projectName,
        developer_name: '',
        micro_market: '',
        rera_id: '',
        possession_date: '',
        price_range: '',
        bhk_configs: '',
        total_units: '',
        project_status: '',
        amenities_count: 0,
        duplicate_status: 'NEW',
        matching_project_id: null,
        review_status: 'PENDING',
        raw_data_json: JSON.stringify({ url, content: nameMatch }),
      });
    }
  }

  return projects;
}

function extractMagicBricksProjects(
  content: string,
  html: string,
  scrapeId: string,
  scrapedAt: string
): ScrapedProject[] {
  const projects: ScrapedProject[] = [];
  
  // Similar extraction logic for MagicBricks
  const projectRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*project[^<]*)/gi;
  let match;

  while ((match = projectRegex.exec(html)) !== null) {
    const url = match[1];
    const nameMatch = match[2];

    if (url && nameMatch && url.includes('/property/')) {
      const projectName = extractProjectName(nameMatch, url);
      
      projects.push({
        scrape_id: scrapeId,
        scraped_at: scrapedAt,
        source_portal: 'MagicBricks',
        source_url: url.startsWith('http') ? url : `https://www.magicbricks.com${url}`,
        project_name: projectName,
        developer_name: '',
        micro_market: '',
        rera_id: '',
        possession_date: '',
        price_range: '',
        bhk_configs: '',
        total_units: '',
        project_status: '',
        amenities_count: 0,
        duplicate_status: 'NEW',
        matching_project_id: null,
        review_status: 'PENDING',
        raw_data_json: JSON.stringify({ url, content: nameMatch }),
      });
    }
  }

  return projects;
}

function extractHousingProjects(
  content: string,
  html: string,
  scrapeId: string,
  scrapedAt: string
): ScrapedProject[] {
  const projects: ScrapedProject[] = [];
  
  // Similar extraction logic for Housing.com
  const projectRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*project[^<]*)/gi;
  let match;

  while ((match = projectRegex.exec(html)) !== null) {
    const url = match[1];
    const nameMatch = match[2];

    if (url && nameMatch && url.includes('/property/')) {
      const projectName = extractProjectName(nameMatch, url);
      
      projects.push({
        scrape_id: scrapeId,
        scraped_at: scrapedAt,
        source_portal: 'Housing',
        source_url: url.startsWith('http') ? url : `https://housing.com${url}`,
        project_name: projectName,
        developer_name: '',
        micro_market: '',
        rera_id: '',
        possession_date: '',
        price_range: '',
        bhk_configs: '',
        total_units: '',
        project_status: '',
        amenities_count: 0,
        duplicate_status: 'NEW',
        matching_project_id: null,
        review_status: 'PENDING',
        raw_data_json: JSON.stringify({ url, content: nameMatch }),
      });
    }
  }

  return projects;
}

function extractProjectName(text: string, url: string): string {
  // Try to extract project name from text or URL
  // Remove common prefixes/suffixes
  let name = text.trim();
  
  // Clean up HTML entities
  name = name.replace(/&[^;]+;/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  
  // If text is too short or generic, try URL
  if (name.length < 3 || name.toLowerCase().includes('view') || name.toLowerCase().includes('more')) {
    const urlParts = url.split('/').filter(p => p);
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart) {
      name = lastPart.replace(/-/g, ' ').replace(/\d+/g, '').trim();
    }
  }
  
  return name || 'Unknown Project';
}

function checkForDuplicate(
  project: ScrapedProject,
  existingProjects: any[]
): { status: 'NEW' | 'POSSIBLE_DUPLICATE' | 'EXACT_MATCH'; matchingId: string | null } {
  if (!existingProjects || existingProjects.length === 0) {
    return { status: 'NEW', matchingId: null };
  }

  // 1. Check by RERA ID (exact match)
  if (project.rera_id) {
    const match = existingProjects.find(p => p.rera_id && p.rera_id.toLowerCase() === project.rera_id.toLowerCase());
    if (match) {
      return { status: 'EXACT_MATCH', matchingId: match.id };
    }
  }

  // 2. Check by project name + micro market (exact match)
  if (project.project_name && project.micro_market) {
    const nameMatch = existingProjects.find(p => {
      const projectNameMatch = p.project_name?.toLowerCase().trim() === project.project_name.toLowerCase().trim();
      const microMarketMatch = p.micro_markets?.name?.toLowerCase().trim() === project.micro_market.toLowerCase().trim();
      return projectNameMatch && microMarketMatch;
    });
    
    if (nameMatch) {
      return { status: 'EXACT_MATCH', matchingId: nameMatch.id };
    }
  }

  // 3. Fuzzy name matching (similarity > 80%)
  if (project.project_name) {
    const projectNameLower = project.project_name.toLowerCase().trim();
    
    for (const existing of existingProjects) {
      if (!existing.project_name) continue;
      
      const existingNameLower = existing.project_name.toLowerCase().trim();
      const similarity = calculateSimilarity(projectNameLower, existingNameLower);
      
      if (similarity > 0.8) {
        return { status: 'POSSIBLE_DUPLICATE', matchingId: existing.id };
      }
    }
  }

  return { status: 'NEW', matchingId: null };
}

function calculateSimilarity(str1: string, str2: string): number {
  // Simple Levenshtein-based similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

