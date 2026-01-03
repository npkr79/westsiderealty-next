import { createClient } from '@/lib/supabase/server';

// Types
export interface ParsedQuery {
  microMarket: string | null;
  developer: string | null;
  bhkConfig: string | null;
  propertyType: string | null;
  completionStatus: string | null;  // Specific status like "New Launch"
  isNewProject: boolean;             // Generic "new projects" = any completion_status
  remainingQuery: string;
}

interface EntityCache {
  microMarkets: string[];
  developers: string[];
  cachedAt: number;
}

// Cache for 1 hour
const CACHE_TTL = 60 * 60 * 1000;
let entityCache: EntityCache | null = null;

// Status keywords mapping - SPECIFIC statuses
const STATUS_KEYWORDS: Record<string, string> = {
  'new launch': 'New Launch',
  'newlaunch': 'New Launch',
  'newly launched': 'New Launch',
  'under construction': 'Under Construction',
  'underconstruction': 'Under Construction',
  'ready to move': 'Ready to Move',
  'readytomove': 'Ready to Move',
  'rtm': 'Ready to Move',
  'pre-launch': 'Pre-Launch',
  'prelaunch': 'Pre-Launch',
  'upcoming': 'Upcoming',
  'published': 'Published',
};

// Generic "new project" indicators (match ANY non-null status)
const NEW_PROJECT_INDICATORS = [
  'new projects',
  'new project',
  'latest projects',
  'latest project',
  'recent projects',
  'recent project',
];

// Property type keywords
const PROPERTY_TYPES = [
  'apartment', 'apartments', 'flat', 'flats',
  'villa', 'villas', 
  'plot', 'plots', 
  'penthouse', 'duplex',
  'independent house', 'independent',
  'standalone', 'standalone apartment',
  'office', 'retail', 'commercial',
];

// BHK regex pattern
const BHK_PATTERN = /(\d)\s*bhk/i;

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
}

function similarityScore(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

// Load entities from database
async function loadEntities(supabase: Awaited<ReturnType<typeof createClient>>): Promise<EntityCache> {
  if (entityCache && Date.now() - entityCache.cachedAt < CACHE_TTL) {
    return entityCache;
  }

  const [microMarketsRes, developersRes] = await Promise.all([
    supabase.from('micro_markets').select('micro_market_name'),
    supabase.from('developers').select('developer_name'),
  ]);

  entityCache = {
    microMarkets: (microMarketsRes.data || []).map((m: any) => m.micro_market_name),
    developers: (developersRes.data || []).map((d: any) => d.developer_name),
    cachedAt: Date.now(),
  };

  return entityCache;
}

// Main parser function
export async function parseSearchQuery(
  query: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ParsedQuery> {
  const entities = await loadEntities(supabase);
  const normalizedQuery = query.toLowerCase().trim();
  let remainingQuery = normalizedQuery;

  const result: ParsedQuery = {
    microMarket: null,
    developer: null,
    bhkConfig: null,
    propertyType: null,
    completionStatus: null,
    isNewProject: false,
    remainingQuery: '',
  };

  // 1. Check for SPECIFIC status keywords first (e.g., "new launch")
  for (const [keyword, status] of Object.entries(STATUS_KEYWORDS)) {
    if (normalizedQuery.includes(keyword)) {
      result.completionStatus = status;
      remainingQuery = remainingQuery.replace(new RegExp(keyword, 'gi'), '').trim();
      break;
    }
  }

  // 2. Check for GENERIC "new projects" indicators (only if no specific status found)
  if (!result.completionStatus) {
    for (const indicator of NEW_PROJECT_INDICATORS) {
      if (normalizedQuery.includes(indicator)) {
        result.isNewProject = true;
        remainingQuery = remainingQuery.replace(new RegExp(indicator, 'gi'), '').trim();
        break;
      }
    }
  }

  // 3. Extract BHK configuration
  const bhkMatch = normalizedQuery.match(BHK_PATTERN);
  if (bhkMatch) {
    result.bhkConfig = `${bhkMatch[1]}BHK`;
    remainingQuery = remainingQuery.replace(BHK_PATTERN, '').trim();
  }

  // 4. Extract property type
  for (const propType of PROPERTY_TYPES) {
    if (normalizedQuery.includes(propType)) {
      // Normalize to singular and handle special cases
      if (propType.includes('apartment') || propType.includes('flat')) {
        result.propertyType = 'apartment';
      } else if (propType.includes('independent')) {
        result.propertyType = 'independent house';
      } else if (propType.includes('standalone')) {
        result.propertyType = 'standalone apartment';
      } else {
        result.propertyType = propType.replace(/s$/, ''); // Remove plural
      }
      remainingQuery = remainingQuery.replace(new RegExp(propType, 'gi'), '').trim();
      break;
    }
  }

  // 5. Fuzzy match micro-market (threshold 0.8)
  const queryWords = remainingQuery.split(/\s+/);
  for (const microMarket of entities.microMarkets) {
    const microMarketLower = microMarket.toLowerCase();

    // Direct inclusion check
    if (remainingQuery.includes(microMarketLower)) {
      result.microMarket = microMarket;
      remainingQuery = remainingQuery.replace(new RegExp(microMarketLower, 'gi'), '').trim();
      break;
    }

    // Fuzzy match on individual words
    for (const word of queryWords) {
      if (word.length >= 3 && similarityScore(word, microMarketLower) >= 0.8) {
        result.microMarket = microMarket;
        remainingQuery = remainingQuery.replace(new RegExp(word, 'gi'), '').trim();
        break;
      }
    }
    if (result.microMarket) break;
  }

  // 6. Match developer name
  for (const developer of entities.developers) {
    const developerLower = developer.toLowerCase();
    if (remainingQuery.includes(developerLower)) {
      result.developer = developer;
      remainingQuery = remainingQuery.replace(new RegExp(developerLower, 'gi'), '').trim();
      break;
    }

    // Check first word of developer name
    const firstWord = developerLower.split(' ')[0];
    if (firstWord.length >= 4 && remainingQuery.includes(firstWord)) {
      result.developer = developer;
      remainingQuery = remainingQuery.replace(new RegExp(firstWord, 'gi'), '').trim();
      break;
    }
  }

  // Clean up remaining query
  result.remainingQuery = remainingQuery
    .replace(/\s+in\s+/gi, ' ')
    .replace(/\s+at\s+/gi, ' ')
    .replace(/\s+near\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return result;
}
