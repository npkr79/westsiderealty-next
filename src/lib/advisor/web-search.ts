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

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
}

interface HaikuSynthesis {
  overview: string;         // Google AI Overview style paragraph — what the model reads
  key_facts: string[];      // Bullet-level facts extracted (delivery, price, RERA, complaints)
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  data_quality: "specific" | "generic"; // 'generic' = marketing fluff, no real data
}

// ─── Cache TTLs (ms) ─────────────────────────────────────────────────────────

const TTL_MS: Record<WebQueryType, number> = {
  project_facts:        90 * 24 * 60 * 60 * 1000, // 90 days — static facts
  developer_reputation: 30 * 24 * 60 * 60 * 1000, // 30 days — reputation
  market_news:           7 * 24 * 60 * 60 * 1000, // 7 days  — live market
  live_search:           7 * 24 * 60 * 60 * 1000, // 7 days  — general
};

// ─── Layer 3 trigger detection ────────────────────────────────────────────────

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
  const hasLiveKeyword = LIVE_SEARCH_PATTERNS.some((re) => re.test(userMessage));
  if (hasLiveKeyword) return true;

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
): { queries: string[]; queryType: WebQueryType; entityName: string } {
  const city = intent.city === "goa" ? "Goa" : "Hyderabad";

  if (
    (intent.intent === "developer_inquiry" && intent.developer_name) ||
    (/track record|reliable|delivery|complaints/.test(userMessage.toLowerCase()) && intent.developer_name)
  ) {
    const dev = intent.developer_name!;
    return {
      queries: [
        `"${dev}" ${city} developer reviews track record delivery completed projects`,
        `"${dev}" RERA projects Telangana complaints possession`,
      ],
      queryType: "developer_reputation",
      entityName: dev,
    };
  }

  if (intent.intent === "project_inquiry") {
    const projectName = intent.project_names?.[0] ?? intent.project_name ?? "real estate project";
    return {
      queries: [
        `"${projectName}" ${city} RERA possession date launch price per sqft`,
        `"${projectName}" ${city} construction update reviews buyer feedback`,
      ],
      queryType: "project_facts",
      entityName: projectName,
    };
  }

  if (intent.intent === "market_overview" || intent.intent === "investment_advice") {
    const market = intent.market_slug
      ? intent.market_slug.replace(/-/g, " ")
      : city;
    return {
      queries: [
        `${market} ${city} real estate market price appreciation trends 2025 2026`,
      ],
      queryType: "market_news",
      entityName: market,
    };
  }

  return {
    queries: [`${userMessage} ${city} real estate 2025`],
    queryType: "live_search",
    entityName: userMessage.slice(0, 60).trim(),
  };
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function buildCacheKey(queryType: WebQueryType, entityName: string): string {
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

    supabase
      .from("advisor_web_cache")
      .update({ use_count: (data.use_count ?? 0) + 1 })
      .eq("cache_key", cacheKey)
      .then(() => {}).catch(() => {});

    const results = (data.results ?? []) as SerperResult[];
    return {
      summary: data.summary ?? "",
      raw_content: results
        .slice(0, 3)
        .map((r) => `### ${r.title}\n${r.snippet}`)
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
  queriesUsed: string[],
  results: SerperResult[],
  summary: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_MS[queryType]).toISOString();
  const sourceUrls = results.map((r) => r.link).filter(Boolean);

  await supabase.from("advisor_web_cache").upsert(
    {
      cache_key: cacheKey,
      query_type: queryType,
      entity_name: entityName,
      query_used: queriesUsed.join(" | "),
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

// ─── Serper API call ──────────────────────────────────────────────────────────

async function callSerper(query: string): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error("SERPER_API_KEY not configured");

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      gl: "in",   // India
      hl: "en",
      num: 10,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Serper API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.organic ?? []) as SerperResult[];
}

// ─── Run multiple Serper queries in parallel, deduplicate by URL ──────────────

async function runSerperQueries(queries: string[]): Promise<SerperResult[]> {
  const settled = await Promise.allSettled(queries.map(callSerper));

  const seen = new Set<string>();
  const merged: SerperResult[] = [];

  for (const result of settled) {
    if (result.status === "fulfilled") {
      for (const r of result.value) {
        if (!seen.has(r.link)) {
          seen.add(r.link);
          merged.push(r);
        }
      }
    }
  }

  return merged;
}

// ─── Haiku synthesis — Google AI Overview style ───────────────────────────────

async function synthesizeWithHaiku(
  results: SerperResult[],
  queryType: WebQueryType,
  entityName: string
): Promise<HaikuSynthesis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fallback if no API key
  if (!apiKey) {
    return {
      overview: results.slice(0, 3).map((r) => r.snippet).join(" "),
      key_facts: results.slice(0, 3).map((r) => r.title),
      sentiment: "neutral",
      data_quality: "generic",
    };
  }

  // Take top 3 results — title + snippet + source domain
  const top3 = results.slice(0, 3).map((r) => {
    let domain = "";
    try { domain = new URL(r.link).hostname.replace("www.", ""); } catch { domain = r.link; }
    return `Source: ${domain}\nTitle: ${r.title}\nSnippet: ${r.snippet}`;
  }).join("\n\n---\n\n");

  const contextLabel: Record<WebQueryType, string> = {
    developer_reputation: `developer reputation, delivery track record, and buyer sentiment for "${entityName}"`,
    project_facts: `project details, RERA status, possession timeline, and pricing for "${entityName}"`,
    market_news: `real estate market trends, pricing, and investment signals for "${entityName}"`,
    live_search: `real estate information about "${entityName}"`,
  };

  const prompt = `You are a real estate research assistant for a premium Indian real estate advisory firm.

Synthesize these 3 Google search results into a structured intelligence brief about ${contextLabel[queryType]}.

SEARCH RESULTS:
${top3}

Return a JSON object with this exact structure:
{
  "overview": "3-5 sentences synthesizing what these results say, like a Google AI Overview. Be specific — include actual numbers, project names, dates if mentioned. If results are vague marketing copy with no real facts, say so clearly.",
  "key_facts": ["fact 1", "fact 2", "fact 3"],
  "sentiment": "positive|neutral|negative|mixed",
  "data_quality": "specific|generic"
}

Rules:
- "overview" must read like a confident research brief, not a list of links
- "key_facts" must be actual verifiable facts (numbers, dates, names) — not generic claims
- "data_quality" = "specific" only if real facts (prices, dates, RERA numbers, project names) are present
- "data_quality" = "generic" if results are just marketing copy
- Return ONLY valid JSON, no preamble`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-20250514",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Haiku API error ${res.status}`);
    const data = await res.json();
    const text: string = data.content?.[0]?.text?.trim() ?? "";

    // Strip markdown code fences if present
    const jsonStr = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    return JSON.parse(jsonStr) as HaikuSynthesis;
  } catch (err) {
    console.warn("[WebSearch] Haiku synthesis failed, using raw snippets:", err);
    return {
      overview: results.slice(0, 3).map((r) => r.snippet).join(" "),
      key_facts: results.slice(0, 3).map((r) => r.title),
      sentiment: "neutral",
      data_quality: "generic",
    };
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Layer 3 web search: Serper (Google) + Claude Haiku synthesis.
 *
 * 1. Check advisor_web_cache — return immediately if fresh
 * 2. Cache miss → run 1-2 parallel Serper queries → deduplicate results
 * 3. Haiku reads top 3 results → builds Google AI Overview style synthesis
 * 4. Store synthesis in cache (fire-and-forget)
 * 5. Return structured result to advisor model
 */
export async function webSearch(
  supabase: SupabaseClient,
  queries: string[],
  queryType: WebQueryType,
  entityName: string
): Promise<WebSearchResult | null> {
  const cacheKey = buildCacheKey(queryType, entityName);

  // Cache first
  const cached = await checkCache(supabase, cacheKey);
  if (cached) {
    console.log(`[WebSearch] Cache hit (${queryType}): ${entityName}`);
    return cached;
  }

  // Fresh Serper search
  console.log(`[WebSearch] Serper search (${queryType}): ${queries.join(" | ")}`);
  try {
    const results = await runSerperQueries(queries);
    if (!results.length) {
      console.log(`[WebSearch] No results for: ${entityName}`);
      return null;
    }

    const sources = results.slice(0, 3).map((r) => {
      let domain = r.link;
      try { domain = new URL(r.link).hostname.replace("www.", ""); } catch { /* */ }
      return { title: r.title, url: r.link, domain };
    });
    console.log(`[WebSearch] Got ${results.length} results from: ${sources.map((s) => s.domain).join(", ")}`);

    // Haiku synthesizes top 3 results into a Google AI Overview style brief
    const synthesis = await synthesizeWithHaiku(results, queryType, entityName);
    console.log(`[WebSearch] Synthesis quality: ${synthesis.data_quality}, sentiment: ${synthesis.sentiment}`);

    // summary = the Haiku overview — what the advisor model reads
    const summary = synthesis.overview;
    const rawContent = [
      synthesis.key_facts.length ? `Key facts:\n${synthesis.key_facts.map((f) => `- ${f}`).join("\n")}` : "",
      `\nRaw snippets:\n${results.slice(0, 3).map((r) => `[${r.title}] ${r.snippet}`).join("\n")}`,
    ].join("\n");

    // Store in cache — fire-and-forget
    storeInCache(supabase, cacheKey, queryType, entityName, queries, results.slice(0, 10), summary)
      .catch((e) => console.error("[WebSearch] Cache store failed:", e));

    const expiresAt = new Date(Date.now() + TTL_MS[queryType]).toISOString();
    return {
      summary,
      raw_content: rawContent,
      sources: sources.map((s) => ({ title: s.title, url: s.url })),
      from_cache: false,
      query_type: queryType,
      entity_name: entityName,
      expires_at: expiresAt,
    };
  } catch (err) {
    console.error("[WebSearch] Serper search failed:", err);
    return null; // graceful fallback — advisor answers from DB only
  }
}

// ─── Context string builder ───────────────────────────────────────────────────

export function buildWebDataContext(result: WebSearchResult): string {
  const lines: string[] = [
    "=== WEB INTELLIGENCE ===",
    `Query type: ${result.query_type} | Entity: ${result.entity_name}`,
    "",
    "IMPORTANT: Synthesize the intelligence below into a confident advisor response.",
    "Do NOT mention 'web sources', 'online', 'based on recent reports', or reveal you searched the internet.",
    "If the overview says data is generic/vague with no real specifics, tell the user you don't have",
    "enough verified data and recommend RERA check + site visit.",
    "",
    "INTELLIGENCE BRIEF:",
    result.summary,
  ];

  if (result.raw_content) {
    lines.push("");
    lines.push(result.raw_content.slice(0, 2000));
  }

  if (result.sources.length) {
    lines.push("");
    lines.push("Sources: " + result.sources.map((s) => s.url).join(" | "));
  }

  return lines.join("\n");
}
