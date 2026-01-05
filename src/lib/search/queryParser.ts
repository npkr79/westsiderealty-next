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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:109',message:'parseSearchQuery entry',data:{query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const entities = await loadEntities(supabase);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:113',message:'Entities loaded',data:{microMarketsCount:entities.microMarkets.length,beeramgudaInList:entities.microMarkets.some(m=>m.toLowerCase().includes('beeramguda')),sampleMicroMarkets:entities.microMarkets.slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
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

  // 1. Check for EXPLICIT status keywords ONLY (e.g., "new launch", "ready to move")
  // DO NOT infer or assume any completion status - only extract if explicitly stated
  // Use strict word boundaries and ensure the phrase appears as a whole
  for (const [keyword, status] of Object.entries(STATUS_KEYWORDS)) {
    // Escape special regex characters in keyword
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a strict regex with word boundaries
    // For multi-word phrases, ensure the entire phrase matches with word boundaries
    const regex = new RegExp(`\\b${escapedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
    
    // Double-check: the match must be exact, not a substring of another word
    const match = normalizedQuery.match(regex);
    if (match) {
      // Verify this is actually the status phrase, not part of another word
      const matchIndex = match.index!;
      const beforeChar = matchIndex > 0 ? normalizedQuery[matchIndex - 1] : ' ';
      const afterIndex = matchIndex + match[0].length;
      const afterChar = afterIndex < normalizedQuery.length ? normalizedQuery[afterIndex] : ' ';
      
      // Ensure it's surrounded by word boundaries (non-word characters or start/end)
      const isWordBoundaryBefore = /[\s\W]/.test(beforeChar) || matchIndex === 0;
      const isWordBoundaryAfter = /[\s\W]/.test(afterChar) || afterIndex === normalizedQuery.length;
      
      if (isWordBoundaryBefore && isWordBoundaryAfter) {
        result.completionStatus = status;
        remainingQuery = remainingQuery.replace(regex, '').trim();
        break;
      }
    }
  }
  // If no explicit status keyword found, completionStatus remains null (DO NOT infer)

  // 2. Check for EXPLICIT "new projects" indicators (only if no specific status found)
  // These are still explicit phrases, but separate from completionStatus
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

  // 4. Extract property type (use word boundaries to prevent partial matches)
  for (const propType of PROPERTY_TYPES) {
    // Use word boundaries for property type matching
    const propTypeRegex = new RegExp(`\\b${propType.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (propTypeRegex.test(normalizedQuery)) {
      // Normalize to singular and handle special cases
      if (propType.includes('apartment') || propType.includes('flat')) {
        result.propertyType = 'apartment';
      } else if (propType.includes('independent')) {
        result.propertyType = 'independent-house'; // Match the checkbox value format
      } else if (propType.includes('standalone')) {
        result.propertyType = 'standalone';
      } else if (propType.includes('penthouse')) {
        result.propertyType = 'penthouse';
      } else if (propType.includes('plot')) {
        result.propertyType = 'residential-plot'; // Default to residential plot
      } else {
        result.propertyType = propType.replace(/s$/, ''); // Remove plural
      }
      remainingQuery = remainingQuery.replace(propTypeRegex, '').trim();
      break;
    }
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:202',message:'After property type extraction',data:{propertyType:result.propertyType,remainingQuery},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // 5. Fuzzy match micro-market (threshold 0.8)
  // IMPORTANT: Do this BEFORE other extractions to prioritize location matching
  const queryWords = remainingQuery.split(/\s+/).filter(w => w.length > 0);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:207',message:'Before micro-market matching',data:{remainingQuery,queryWords},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  // First try exact case-insensitive match (most reliable)
  for (const microMarket of entities.microMarkets) {
    const microMarketLower = microMarket.toLowerCase();
    
    // Try full micro-market name match (with word boundaries for multi-word names)
    if (microMarketLower.includes(' ')) {
      // Multi-word micro-market: use word boundaries
      const regex = new RegExp(`\\b${microMarketLower.replace(/\s+/g, '\\s+')}\\b`, 'i');
      const testResult = regex.test(remainingQuery);
      // #region agent log
      if (microMarketLower.includes('beeramguda')) {
        fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:214',message:'Testing beeramguda multi-word match',data:{microMarket,microMarketLower,regex:regex.toString(),remainingQuery,testResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
      if (testResult) {
        result.microMarket = microMarket;
        remainingQuery = remainingQuery.replace(regex, '').trim();
        break;
      }
    } else {
      // Single-word micro-market: use word boundaries
      const regex = new RegExp(`\\b${microMarketLower}\\b`, 'i');
      const testResult = regex.test(remainingQuery);
      // #region agent log
      if (microMarketLower.includes('beeramguda') || microMarketLower === 'beeramguda') {
        fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:223',message:'Testing beeramguda single-word match',data:{microMarket,microMarketLower,regex:regex.toString(),remainingQuery,testResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      }
      // #endregion
      if (testResult) {
        result.microMarket = microMarket;
        remainingQuery = remainingQuery.replace(regex, '').trim();
        break;
      }
    }
  }
  
  // If no exact match, try fuzzy match on individual words
  if (!result.microMarket) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:235',message:'No exact micro-market match, trying fuzzy',data:{queryWords},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    for (const microMarket of entities.microMarkets) {
      const microMarketLower = microMarket.toLowerCase();
      for (const word of queryWords) {
        if (word.length >= 3) {
          const score = similarityScore(word, microMarketLower);
          // #region agent log
          if (microMarketLower.includes('beeramguda') || word === 'beeramguda') {
            fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:240',message:'Fuzzy match test for beeramguda',data:{microMarket,microMarketLower,word,score,thresholdMet:score >= 0.8},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
          }
          // #endregion
          if (score >= 0.8) {
            result.microMarket = microMarket;
            remainingQuery = remainingQuery.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim();
            break;
          }
        }
      }
      if (result.microMarket) break;
    }
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:251',message:'After micro-market matching',data:{microMarket:result.microMarket,remainingQuery},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
  // #endregion

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

  // Clean up remaining query - remove common prepositions and connectors
  // First remove with spaces, then remove standalone words
  result.remainingQuery = remainingQuery
    .replace(/\s+in\s+/gi, ' ')
    .replace(/\s+at\s+/gi, ' ')
    .replace(/\s+near\s+/gi, ' ')
    .replace(/\s+the\s+/gi, ' ')
    .replace(/\s+a\s+/gi, ' ')
    .replace(/\s+an\s+/gi, ' ')
    .replace(/\s+of\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove standalone common words (even without spaces)
  const commonWords = ['in', 'at', 'near', 'the', 'a', 'an', 'of', 'for', 'with'];
  const remainingWords = result.remainingQuery.split(/\s+/).filter(word => 
    word.length > 0 && !commonWords.includes(word.toLowerCase())
  );
  
  result.remainingQuery = remainingWords.join(' ').trim();

  // Debug logging (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[QueryParser] Parsed query:', {
      input: query,
      propertyType: result.propertyType,
      microMarket: result.microMarket,
      bhkConfig: result.bhkConfig,
      developer: result.developer,
      completionStatus: result.completionStatus,
      isNewProject: result.isNewProject,
      remainingQuery: result.remainingQuery,
    });
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4e462e23-bd22-4d1c-9e9b-fbb1596e852a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'queryParser.ts:299',message:'parseSearchQuery exit',data:{input:query,result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
  // #endregion
  return result;
}
