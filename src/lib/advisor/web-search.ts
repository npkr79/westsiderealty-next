import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedIntent } from "./system-prompt";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WebQueryType =
  | "project_facts"
  | "developer_reputation"
  | "market_news"
  | "live_search";

export interface WebSearchResult {
  summary: string;
  raw_content: string;
  sources: Array<{ title: string; url: string }>;
  from_cache: boolean;
  query_type: WebQueryType;
  entity_name: string;
  expires_at: string;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// ─── Cache TTLs (ms) ─────────────────────────────────────────────────────────

const TTL_MS: Record<WebQueryType, number> = {
  project_facts: 90 * 24 * 60 * 60 * 1000,       // 90 days — static facts change slowly
  developer_reputation: 30 * 24 * 60 * 60 * 1000, // 30 days — reputation changes monthly
  market_news: 7 * 24 * 60 * 60 * 1000,           // 7 days  — market news is live
  live_search: 7 * 24 * 60 * 60 * 1000,           // 7 days  — general real-time queries
};

// ─── Layer 3 trigger detection ────────────────────────────────────────────────

/**
 * Keywords that explicitly signal the user wants live / real-time data
 * that no static DB can answer.
 */
const LIVE_SEARCH_PATTERNS = [
  /latest|recent(ly)?|current(ly)?|right now|today|this (week|month|year)/i,
  /track record|delivery record|delivered on time|past project|completed project/i,
  /reliable|trustworth|good developer|bad developer|complaints? about|reviews? of/i,
  /construction (update|status|progress)|possession delay|delayed|stalled/i,
  /any (news|update|problem|issue) (on|about|with)/i,
  /what.{0,20}happening (with|in|at)/i,
  /price (now|today|currently)|current price|going rate/i,
];

export function shouldTriggerWebSearch(
  userMessage: string,
  intent: ParsedIntent,
  dbProjects: number,
  dbMarkets: number
): boolean {
  // Trigger A: Explicit real-time keywords in the message
  const hasLiveKeyword = LIVE_SEARCH_PATTERNS.some((re) => re.test(userMessage));
  if (hasLiveKeyword) return true;

  // Trigger B: DB came back empty for a specific entity query
  const isSpecificQuery = [
    "project_inquiry",
    "developer_inquiry",
    "market_overview",
    "investment_advice",
    "comparison",
  ].includes(intent.intent);
  const dbEmpty = dbProjects === 0 && dbMarkets === 0;
  if (isSpecificQuery && dbEmpty) return true;

  return false;
}

// ─── Query builder ────────────────────────────────────────────────────────────

export function buildWebQuery(
  intent: ParsedIntent,
  userMessage: string
): { query: string; queryType: WebQueryType; entityName: string } {
  const city = intent.city === "goa" ? "Goa" : "Hyderabad";

  // Developer reputation / track record
  if (
    intent.intent === "developer_inquiry" && intent.developer_name ||
    /track record|reliable|delivery|complaints/.test(userMessage.toLowerCase()) && intent.developer_name
  ) {
    const dev = intent.developer_name!;
    return {
      query: `${dev} developer ${city} track record delivery history reviews completed projects 2024 2025`,
      queryType: "developer_reputation",
      entityName: dev,
    };
  }

  // Specific project facts or updates
  if (intent.intent === "project_inquiry") {
    const projectName =
      intent.project_names?.[0] ?? intent.project_name ?? "real estate project";
    return {
      query: `${projectName} ${city} real estate project price possession date construction update RERA 2025`,
      queryType: "project_facts",
      entityName: projectName,
    };
  }

  // Market news / overview
  if (
    intent.intent === "market_overview" ||
    intent.intent === "investment_advice"
  ) {
    const market = intent.market_slug
      ? intent.market_slug.replace(/-/g, " ")
      : city;
    return {
      query: `${market} ${city} real estate market price appreciation trends news 2025`,
      queryType: "market_news",
      entityName: market,
    };
  }

  // General live search — use the user's own message enriched with context
  return {
    query: `${userMessage} ${city} real estate 2025`,
    queryType: "live_search",
    entityName: userMessage.slice(0, 60).trim(),
  };
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function buildCacheKey(
  queryType: WebQueryType,
  entityName: string
): string {
  // Cache bucket = entity slug + TTL window (so it auto-refreshes after TTL)
  const slug = entityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
  const windowId = Math.floor(Date.now() / TTL_MS[queryType]);
  return `${queryType}:${slug}:${windowId}`;
}

async function checkCache(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<WebSearchResult | null> {
  try {
    const { data } = await supabase
      .from("advisor_web_cache")
      .select("summary, source_urls, results, expires_at, query_type, entity_name")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!data) return null;

    // Bump use_count — fire-and-forget
    supabase
      .from("advisor_web_cache")
      .update({ use_count: data.use_count ?? 0 + 1 })
      .eq("cache_key", cacheKey)
      .then(() => {})
      .catch(() => {});

    const results = (data.results ?? []) as TavilyResult[];
    return {
      summary: data.summary ?? "",
      raw_content: results
        .slice(0, 4)
        .map((r) => `### ${r.title}\n${r.content}`)
        .join("\n\n"),
      sources: (data.source_urls as string[]).map((url) => ({ url, title: "" })),
      from_cache: true,
      query_type: data.query_type as WebQueryType,
      entity_name: data.entity_name ?? "",
      expires_at: data.expires_at,
    };
  } catch {
    return null;
  }
}

async function storeInCache(
  supabase: SupabaseClient,
  cacheKey: string,
  queryType: WebQueryType,
  entityName: string,
  queryUsed: string,
  results: TavilyResult[],
  summary: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_MS[queryType]).toISOString();
  const sourceUrls = results.map((r) => r.url).filter(Boolean);

  await supabase.from("advisor_web_cache").upsert(
    {
      cache_key: cacheKey,
      query_type: queryType,
      entity_name: entityName,
      query_used: queryUsed,
      results,
      summary,
      source_urls: sourceUrls,
      confidence: "web_sourced",
      scraped_at: new Date().toISOString(),
      expires_at: expiresAt,
      use_count: 1,
      promoted_to_main: false,
    },
    { onConflict: "cache_key" }
  );
}

// ─── Tavily API call ──────────────────────────────────────────────────────────

// High-quality Indian real estate and news domains
const REALESTATE_DOMAINS = [
  "99acres.com",
  "magicbricks.com",
  "housing.com",
  "squareyards.com",
  "proptiger.com",
  "nobroker.in",
  "economictimes.indiatimes.com",
  "timesofindia.indiatimes.com",
  "thehindu.com",
  "businessstandard.com",
  "ndtv.com",
  "livemint.com",
  "moneycontrol.com",
  "indianexpress.com",
  "deccanchronicle.com",
  "rera.telangana.gov.in",
  "credai.org",
];

const NEWS_DOMAINS = [
  "economictimes.indiatimes.com",
  "timesofindia.indiatimes.com",
  "thehindu.com",
  "businessstandard.com",
  "ndtv.com",
  "livemint.com",
  "moneycontrol.com",
  "indianexpress.com",
  "deccanchronicle.com",
  "hindustantimes.com",
  "financialexpress.com",
  "realty.economictimes.indiatimes.com",
];

const DOMAIN_MAP: Record<WebQueryType, string[]> = {
  developer_reputation: REALESTATE_DOMAINS,
  project_facts: REALESTATE_DOMAINS,
  market_news: NEWS_DOMAINS,
  live_search: [...REALESTATE_DOMAINS, ...NEWS_DOMAINS],
};

async function callTavily(
  query: string,
  queryType: WebQueryType
): Promise<{ results: TavilyResult[] }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not configured");

  // Use advanced depth for developer/project queries — worth the 2x credit cost
  const searchDepth =
    queryType === "developer_reputation" || queryType === "project_facts"
      ? "advanced"
      : "basic";

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: searchDepth,
      include_answer: false, // Don't use Tavily's AI summary — it hallucinates from bad sources
      include_raw_content: false,
      max_results: 7,
      include_domains: DOMAIN_MAP[queryType] ?? [],
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tavily API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    results: (data.results ?? []) as TavilyResult[],
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Layer 3 web search with cache-first pattern.
 *
 * 1. Check advisor_web_cache — return immediately if fresh entry exists
 * 2. Cache miss → call Tavily → store result in cache (fire-and-forget)
 * 3. Returns null if Tavily fails or returns empty results
 */
export async function webSearch(
  supabase: SupabaseClient,
  query: string,
  queryType: WebQueryType,
  entityName: string
): Promise<WebSearchResult | null> {
  const cacheKey = buildCacheKey(queryType, entityName);

  // Layer 2.5: check cache first
  const cached = await checkCache(supabase, cacheKey);
  if (cached) {
    console.log(`[WebSearch] Cache hit (${queryType}): ${entityName}`);
    return cached;
  }

  // Layer 3: fresh Tavily search
  console.log(`[WebSearch] Tavily search (${queryType}): ${query}`);
  try {
    const { results } = await callTavily(query, queryType);
    if (!results.length) {
      console.log(`[WebSearch] No results returned for: ${query}`);
      return null;
    }

    console.log(`[WebSearch] Got ${results.length} results from: ${results.map((r) => new URL(r.url).hostname).join(", ")}`);

    const rawContent = results
      .slice(0, 5)
      .map((r) => `### ${r.title}\n${r.content}`)
      .join("\n\n");

    // No Tavily-generated summary — let the model synthesize from raw content
    const summary = results
      .slice(0, 3)
      .map((r) => `${r.title}: ${r.content.slice(0, 200)}`)
      .join(" | ");

    // Store in cache — fire-and-forget, never block the response
    storeInCache(supabase, cacheKey, queryType, entityName, query, results, summary).catch(
      (e) => console.error("[WebSearch] Cache store failed:", e)
    );

    const expiresAt = new Date(Date.now() + TTL_MS[queryType]).toISOString();
    return {
      summary,
      raw_content: rawContent,
      sources: results.map((r) => ({ title: r.title, url: r.url })),
      from_cache: false,
      query_type: queryType,
      entity_name: entityName,
      expires_at: expiresAt,
    };
  } catch (err) {
    console.error("[WebSearch] Tavily call failed:", err);
    return null; // graceful fallback — advisor answers from DB only
  }
}

// ─── Context string builder ───────────────────────────────────────────────────

/**
 * Formats web search results into a context block for the advisor system prompt.
 * Always labels data as web-sourced so the model caveats appropriately.
 */
export function buildWebDataContext(result: WebSearchResult): string {
  const lines: string[] = [
    "=== WEB INTELLIGENCE ===",
    `Query type: ${result.query_type} | Entity: ${result.entity_name}`,
    "",
    "IMPORTANT: Synthesize the facts below into a confident advisor response. Do NOT mention 'web sources',",
    "'online', 'based on recent reports', or any language that reveals you searched the internet.",
    "If the data below is vague marketing copy with no real specifics, say you don't have enough verified",
    "data and recommend RERA check + site visit. Never pad with generic fluff.",
    "",
  ];

  if (result.summary) {
    lines.push(`AI Summary of search results:\n${result.summary}`);
    lines.push("");
  }

  if (result.raw_content) {
    lines.push("Detailed search results:");
    lines.push(result.raw_content.slice(0, 2500)); // cap to stay within token budget
  }

  if (result.sources.length) {
    lines.push("");
    lines.push(
      "Sources: " +
        result.sources
          .filter((s) => s.url)
          .map((s) => s.url)
          .join(" | ")
    );
  }

  return lines.join("\n");
}
