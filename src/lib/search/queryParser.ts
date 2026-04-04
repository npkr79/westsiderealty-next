import { createClient } from '@/lib/supabase/server';

// Types
export interface ParsedQuery {
  microMarket: string | null;
  developer: string | null;
  bhkConfig: string | null; // Normalized format: "3 BHK", "4 BHK" (with space)
  projectName: string | null; // Matched project name
  propertyType: string | null;
  completionStatus: string | null;  // Specific status like "New Launch"
  isNewProject: boolean;             // Generic "new projects" = any completion_status
  remainingQuery: string;
}

interface EntityCache {
  microMarkets: string[];
  developers: string[];
  projects: Array<{ name: string; slug: string }>;
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

// Property type keywords — order matters: longer/more-specific phrases first
const PROPERTY_TYPES = [
  // Villa variants (must come before generic "villa")
  'sky villas', 'sky villa',
  'independent villa', 'gated villa',
  'bungalow', 'bungalows',
  // Apartment variants
  'apartment', 'apartments', 'flat', 'flats',
  // Generic villa
  'villa', 'villas',
  // Other
  'plot', 'plots',
  'penthouse', 'duplex',
  'independent house', 'independent',
  'standalone', 'standalone apartment',
  'office', 'retail', 'commercial',
];

// BHK regex pattern - supports multiple digits (e.g., "3BHK", "12bhk")
const BHK_PATTERN = /(\d+)\s*bhk/i;

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

  const [microMarketsRes, developersRes, projectsRes] = await Promise.all([
    supabase.from('micro_markets').select('micro_market_name'),
    supabase.from('developers').select('developer_name'),
    supabase.from('projects').select('project_name, url_slug').limit(5000), // Get all projects for matching
  ]);

  entityCache = {
    microMarkets: (microMarketsRes.data || []).map((m: any) => m.micro_market_name),
    developers: (developersRes.data || []).map((d: any) => d.developer_name),
    projects: (projectsRes.data || []).map((p: any) => ({ 
      name: p.project_name, 
      slug: p.url_slug 
    })),
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
    projectName: null,
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

  // 3. Extract BHK configuration FIRST (priority)
  // Normalize format: "3BHK" → "3 BHK", "4bhk" → "4 BHK" (with space as per DB format)
  const bhkMatch = normalizedQuery.match(BHK_PATTERN);
  if (bhkMatch) {
    const bhkNumber = bhkMatch[1];
    result.bhkConfig = `${bhkNumber} BHK`; // Normalized format with space
    // Remove BHK from remaining query string
    remainingQuery = remainingQuery.replace(BHK_PATTERN, '').trim();
  }

  // 4. Extract property type (use word boundaries to prevent partial matches)
  for (const propType of PROPERTY_TYPES) {
    // Use word boundaries for property type matching
    const propTypeRegex = new RegExp(`\\b${propType.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (propTypeRegex.test(normalizedQuery)) {
      // Normalize to canonical project_type values
      if (propType === 'sky villa' || propType === 'sky villas' || propType.includes('penthouse')) {
        result.propertyType = 'apartment'; // high-rise units, not ground villas
      } else if (propType === 'independent villa' || propType === 'gated villa' || propType === 'bungalow' || propType === 'bungalows' || propType === 'villa' || propType === 'villas') {
        result.propertyType = 'villa';
      } else if (propType.includes('apartment') || propType.includes('flat')) {
        result.propertyType = 'apartment';
      } else if (propType.includes('independent')) {
        result.propertyType = 'independent-house';
      } else if (propType.includes('standalone')) {
        result.propertyType = 'standalone';
      } else if (propType.includes('plot')) {
        result.propertyType = 'residential-plot';
      } else if (propType.includes('commercial') || propType.includes('office')) {
        result.propertyType = 'commercial';
      } else {
        result.propertyType = propType.replace(/s$/, '');
      }
      remainingQuery = remainingQuery.replace(propTypeRegex, '').trim();
      break;
    }
  }

  // 4. Clean remaining text - remove filler words ("in", "at", "near") before entity matching
  remainingQuery = remainingQuery
    .replace(/\b(in|at|near)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const queryWords = remainingQuery.split(/\s+/).filter(w => w.length > 0);
  const remainingQueryLower = remainingQuery.toLowerCase();
  
  // Common words to exclude from matching (defined once for reuse)
  const commonWords = ['in', 'at', 'near', 'the', 'a', 'an', 'of', 'for', 'with'];
  const meaningfulWords = queryWords.filter(w => !commonWords.includes(w.toLowerCase()));

  // 5. Match PROJECT NAME FIRST (higher priority than micro-market)
  // Project names can contain micro-market names (e.g., "Godrej Madison Avenue Kokapet")
  // So we check projects first, then remove matched project name, then check micro-markets
  let matchedProjectName: string | null = null;
  let projectMatchedText = '';
  
  // Try exact project name match first (case-insensitive)
  for (const project of entities.projects) {
    const projectNameLower = project.name.toLowerCase();
    
    // Try full project name match
    if (remainingQueryLower.includes(projectNameLower)) {
      matchedProjectName = project.name;
      projectMatchedText = projectNameLower;
      remainingQuery = remainingQuery.replace(new RegExp(projectNameLower, 'gi'), '').trim();
      break;
    }
    
    // Try fuzzy match on project name words
    const projectWords = projectNameLower.split(/\s+/).filter(w => w.length >= 3);
    if (projectWords.length > 0) {
      // Check if all significant words of project name are in query
      const allWordsMatch = projectWords.every(word => 
        remainingQueryLower.includes(word) || meaningfulWords.some(qw => 
          similarityScore(qw.toLowerCase(), word) >= 0.85
        )
      );
      
      if (allWordsMatch && projectWords.length >= 2) {
        matchedProjectName = project.name;
        projectMatchedText = projectNameLower;
        // Remove matched project words
        for (const word of projectWords) {
          remainingQuery = remainingQuery.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim();
        }
        break;
      }
    }
  }
  
  result.projectName = matchedProjectName;
  
  // 6. Match micro-market (exact first, then substring, then fuzzy)
  // Only match micro-markets that weren't already matched as part of project name
  
  // Only match micro-markets if project name wasn't matched, or if query still has remaining text
  // Try exact case-insensitive match with word boundaries (most reliable)
  for (const microMarket of entities.microMarkets) {
    const microMarketLower = microMarket.toLowerCase();
    
    // Skip if this micro-market was already part of matched project name
    if (projectMatchedText && projectMatchedText.includes(microMarketLower)) {
      continue;
    }
    
    // Try full micro-market name match (with word boundaries for multi-word names)
    if (microMarketLower.includes(' ')) {
      // Multi-word micro-market: use word boundaries
      const regex = new RegExp(`\\b${microMarketLower.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (regex.test(remainingQuery)) {
        result.microMarket = microMarket; // Use canonical name from database
        remainingQuery = remainingQuery.replace(regex, '').trim();
        break;
      }
    } else {
      // Single-word micro-market: use word boundaries
      const regex = new RegExp(`\\b${microMarketLower}\\b`, 'i');
      if (regex.test(remainingQuery)) {
        result.microMarket = microMarket; // Use canonical name from database
        remainingQuery = remainingQuery.replace(regex, '').trim();
        break;
      }
    }
  }
  
  // If no exact match, try substring matching (case-insensitive) - more aggressive
  // This handles cases where word boundaries might fail
  if (!result.microMarket) {
    for (const microMarket of entities.microMarkets) {
      const microMarketLower = microMarket.toLowerCase();
      
      // Skip if this micro-market was already part of matched project name
      if (projectMatchedText && projectMatchedText.includes(microMarketLower)) {
        continue;
      }
      
      // Check if micro-market name appears in remaining query (case-insensitive)
      if (remainingQueryLower.includes(microMarketLower)) {
        result.microMarket = microMarket; // Use canonical name from database
        // Remove the matched micro-market (case-insensitive)
        remainingQuery = remainingQuery.replace(new RegExp(microMarketLower, 'gi'), '').trim();
        break;
      }
    }
  }
  
  // If still no match, try fuzzy match on meaningful words (excluding common words)
  if (!result.microMarket) {
    for (const microMarket of entities.microMarkets) {
      const microMarketLower = microMarket.toLowerCase();
      
      // Skip if this micro-market was already part of matched project name
      if (projectMatchedText && projectMatchedText.includes(microMarketLower)) {
        continue;
      }
      
      for (const word of meaningfulWords) {
        if (word.length >= 3) {
          const score = similarityScore(word, microMarketLower);
          if (score >= 0.8) {
            result.microMarket = microMarket; // Use canonical name from database
            remainingQuery = remainingQuery.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim();
            break;
          }
        }
      }
      if (result.microMarket) break;
    }
  }

  // 7. Match developer name
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
      projectName: result.projectName,
      bhkConfig: result.bhkConfig,
      developer: result.developer,
      completionStatus: result.completionStatus,
      isNewProject: result.isNewProject,
      remainingQuery: result.remainingQuery,
    });
  }

  return result;
}
