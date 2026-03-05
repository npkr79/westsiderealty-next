import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestBody {
  job_type: "micro_market" | "project" | "developer" | "market_pulse" | "project_live_intelligence" | "project_live_intelligence_batch";
  entity_id?: string;
  force_refresh?: boolean;
  offset?: number;
  market_names?: string[];
  priority?: number;
}

interface JobResult {
  success: number;
  errors: number;
  skipped: number;
}

interface BatchJobResult extends JobResult {
  total_markets: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Claude API helper
// ---------------------------------------------------------------------------

async function callClaude(prompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data?.content?.[0]?.text ?? "";
  if (!content) throw new Error("Empty response from Claude API");
  return content;
}

function parseJsonFromClaude(raw: string): Record<string, unknown> {
  // Strip all markdown code blocks anywhere in the string
  const cleaned = raw.replace(/```json|```/g, "").trim();

  // Primary attempt
  try {
    return JSON.parse(cleaned);
  } catch {
    // Regex fallback: grab the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    // Throw with raw snippet so callers can store it for debugging
    throw new Error(`JSON parse failed. Raw (first 400 chars): ${raw.slice(0, 400)}`);
  }
}

// ---------------------------------------------------------------------------
// Claude with web_search tool (Anthropic-hosted, beta)
// ---------------------------------------------------------------------------

// Trim web_search_tool_result blocks before forwarding to Claude.
// Limits to 3 results per tool call and truncates each result's text content
// to 500 chars to stay well under the 30k tokens/min rate limit.
function truncateWebSearchResults(
  blocks: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return blocks.map((block) => {
    if (!Array.isArray(block.content)) return block;
    const trimmed = (block.content as Array<Record<string, unknown>>)
      .slice(0, 3)
      .map((result) => {
        const r = { ...result };
        if (typeof r.content === "string" && r.content.length > 500) {
          r.content = r.content.slice(0, 500) + "…";
        }
        return r;
      });
    return { ...block, content: trimmed };
  });
}

async function callClaudeWithWebSearch(prompt: string, maxTokens = 4096, model = "claude-sonnet-4-6", system?: string): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

  const messages: Array<{ role: string; content: unknown }> = [
    { role: "user", content: prompt },
  ];

  // Agentic loop — Anthropic executes the web searches server-side and
  // returns them as web_search_tool_result blocks in the same response turn.
  // We forward those blocks as a user turn so Claude can synthesize them.
  for (let round = 0; round < 8; round++) {
    // Retry loop for 429 rate limit errors (up to 3 attempts, 15s apart)
    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "web-search-2025-03-05,prompt-caching-2024-07-31",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          ...(system ? {
            system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
          } : {}),
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
          messages,
        }),
      });
      if (res.status !== 429) break;
      console.log(`Rate limited (429), attempt ${attempt + 1}/3 — waiting 60s`);
      await new Promise((r) => setTimeout(r, 60000));
    }

    if (!res || !res.ok) {
      const text = await res!.text();
      throw new Error(`Claude API error ${res!.status}: ${text}`);
    }

    const data = await res.json();
    const stopReason: string = data.stop_reason;
    const content: Array<Record<string, unknown>> = data.content ?? [];

    if (stopReason === "end_turn") {
      // Collect all text blocks — this is the final synthesized answer
      return content
        .filter((b) => b.type === "text")
        .map((b) => b.text as string)
        .join("");
    }

    if (stopReason === "tool_use") {
      // Add assistant turn to conversation
      messages.push({ role: "assistant", content });

      // Anthropic returns web_search_tool_result blocks in the same response.
      // Forward them back as a user turn so Claude can read and synthesize them.
      const searchResults = content.filter((b) => b.type === "web_search_tool_result");
      if (searchResults.length > 0) {
        const truncated = truncateWebSearchResults(searchResults);
        console.log(`Truncated search results: ${searchResults.length} blocks → forwarding ≤3 results per block at ≤500 chars`);
        messages.push({ role: "user", content: truncated });
        // 30s cooldown between search rounds to avoid rate limiting
        console.log("Web search round complete — waiting 30s before next round");
        await new Promise((r) => setTimeout(r, 30000));
        continue;
      }

      // Fallback: provide empty tool_result for any unhandled tool_use blocks
      const toolUses = content.filter((b) => b.type === "tool_use");
      if (toolUses.length === 0) break;
      messages.push({
        role: "user",
        content: toolUses.map((tu) => ({
          type: "tool_result",
          tool_use_id: tu.id as string,
          content: "No results.",
        })),
      });
      // 30s cooldown after fallback tool responses too
      await new Promise((r) => setTimeout(r, 30000));
      continue;
    }

    // Any other stop reason — extract whatever text is present
    const text = content
      .filter((b) => b.type === "text")
      .map((b) => b.text as string)
      .join("");
    if (text) return text;
    break;
  }

  throw new Error("Web search loop did not produce a final text response");
}

// ---------------------------------------------------------------------------
// Job log helper
// ---------------------------------------------------------------------------

async function logJob(
  supabase: ReturnType<typeof getSupabase>,
  opts: {
    job_type: string;
    entity_id?: string | null;
    entity_name?: string | null;
    status: "success" | "error" | "skipped";
    message?: string;
  }
) {
  // Table columns: job_type, entity_id, entity_name, status, error_message, ran_at (auto)
  const row: Record<string, unknown> = {
    job_type: opts.job_type,
    entity_id: opts.entity_id ?? null,
    entity_name: opts.entity_name ?? null,
    status: opts.status,
  };
  if (opts.message) row.error_message = opts.message;
  const { error } = await supabase.from("ai_enrichment_job_log").insert(row);
  if (error) console.error("logJob insert failed:", error.message);
}

// ---------------------------------------------------------------------------
// MICRO MARKET enrichment (comprehensive v2 prompt)
// ---------------------------------------------------------------------------

async function enrichMicroMarket(
  supabase: ReturnType<typeof getSupabase>,
  microMarketId: string,
  forceRefresh: boolean
): Promise<"success" | "error" | "skipped"> {
  console.log("enrichMicroMarket called, id:", microMarketId, "force:", forceRefresh);

  // Fetch the micro_market row
  const { data: mm, error: mmErr } = await supabase
    .from("micro_markets")
    .select("id, micro_market_name, url_slug, city_id, price_per_sqft_min, price_per_sqft_max, connectivity_details, hero_hook")
    .eq("id", microMarketId)
    .maybeSingle();

  if (mmErr || !mm) {
    console.error("micro_markets fetch error:", mmErr?.message);
    await logJob(supabase, { job_type: "micro_market", entity_id: microMarketId, status: "error", message: mmErr?.message ?? "Record not found" });
    return "error";
  }

  console.log("Fetched market:", mm.micro_market_name);

  // Freshness check — bypassed entirely when force_refresh is true
  if (forceRefresh) {
    console.log("Force refresh requested — bypassing freshness check for:", mm.micro_market_name);
  } else {
    const { data: existing } = await supabase
      .from("micro_market_ai_enrichment")
      .select("fetched_at")
      .eq("micro_market_id", microMarketId)
      .maybeSingle();

    if (existing?.fetched_at) {
      const ageMs = Date.now() - new Date(existing.fetched_at).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays < 25) {
        console.log("Skipping fresh market:", mm.micro_market_name, `(${Math.round(ageDays)}d ago)`);
        await logJob(supabase, { job_type: "micro_market", entity_id: microMarketId, status: "skipped", message: `Fresh (${Math.round(ageDays)}d ago)` });
        return "skipped";
      }
    }
  }

  // Fetch RERA stats from cache
  const { data: cache } = await supabase
    .from("micro_market_page_cache_v2")
    .select("recent_launches, completion_ratio, velocity_score, developer_strength, new_developer_entries, delay_ratio")
    .eq("id", microMarketId)
    .maybeSingle();

  // Fetch developer names from projects table (joined with developers relation)
  const { data: projectRows } = await supabase
    .from("projects")
    .select("developers!developer_id(developer_name)")
    .eq("micro_market_id", microMarketId)
    .neq("status", "cancelled")
    .limit(30);

  const developerNames = [
    ...new Set(
      ((projectRows ?? []) as Array<Record<string, unknown>>)
        .map((p) => {
          const dev = p.developers as Record<string, unknown> | null;
          return dev?.developer_name ? String(dev.developer_name) : null;
        })
        .filter((n): n is string => n != null && n.trim().length > 0)
    ),
  ].slice(0, 12);

  const recentLaunches = cache?.recent_launches ?? "unknown";
  const completionRatio = cache?.completion_ratio != null ? `${Math.round(cache.completion_ratio * 100)}%` : "unknown";
  const velocityScore = cache?.velocity_score ?? "unknown";
  const developerStrength = cache?.developer_strength ?? "unknown";
  const newDeveloperEntries = cache?.new_developer_entries ?? "unknown";
  const delayRatio = cache?.delay_ratio != null ? `${Math.round(cache.delay_ratio * 100)}%` : "unknown";
  const priceMin = mm.price_per_sqft_min ?? "unknown";
  const priceMax = mm.price_per_sqft_max ?? "unknown";
  const developerList = developerNames.length > 0 ? developerNames.join(", ") : "not available from database";

  console.log("Calling Claude for:", mm.micro_market_name, "with", developerNames.length, "developers");

  const prompt = `You are a senior Hyderabad real estate analyst writing for first-time buyers and investors in 2026.

Analyze ${mm.micro_market_name} in Hyderabad.

CONTEXT FROM OUR DATABASE:
- Active RERA projects: ${recentLaunches} recent launches
- Known developers present: ${developerList}
- Price range on record: ₹${priceMin}–${priceMax}/sqft
- Completion ratio (RERA): ${completionRatio} (NOTE: unreliable for established markets — RERA only captures post-2017)
- Market velocity score: ${velocityScore}/100
- Developer strength: ${developerStrength}%
- New developer entries: ${newDeveloperEntries}
- Delay ratio: ${delayRatio}

Using your knowledge of this market, provide a complete buyer and investor intelligence report.

Focus on what matters to someone deciding whether to buy:
- Is this market worth entering in 2026?
- What price should they expect to pay?
- What return can they realistically expect?
- What are the genuine risks?
- Who is this market best suited for?

Do NOT base your analysis on RERA completion ratios — these are unreliable for established markets where most inventory predates RERA.

For mixed-use markets, provide both residential rental yields AND commercial rental yields separately. Commercial yield = office/retail/co-working space rentals in ₹ per sqft per month.

Return ONLY valid JSON matching this structure exactly:
{
  "market_maturity": "Emerging|Growing|Established|Peak",
  "builder_activity": "Low|Moderate|High|Saturated",
  "buyer_profile": "End-use|Investment|Mixed",
  "rental_yield_min": number or null,
  "rental_yield_max": number or null,
  "price_per_sqft_current": number or null,
  "market_summary": "2-3 sentences plain English for buyers",
  "top_developers": ["developer1", "developer2"],
  "market_risks": "brief text or null",
  "confidence": "high|medium|low",
  "zone_type": "Residential|Commercial|Mixed-Use|Township",
  "market_character": "2 sentences describing the character and feel of this market",
  "price_band_current": "₹X–Y/sqft (2026)",
  "buyer_profile_detail": "detailed text on who buys here and why",
  "lifestyle_score": "Low|Medium|High|Premium",
  "possession_wait": "typical wait time for new projects e.g. 2-3 years",
  "best_for": "one line: who should buy here",
  "appreciation_5yr": "realistic 5-year appreciation estimate with reasoning",
  "rental_yield_detail": "detailed rental yield commentary",
  "entry_timing": "Good|Wait|Optimal|Late",
  "entry_reasoning": "one sentence explaining entry timing verdict",
  "employment_drivers": ["employer1", "employer2", "employer3"],
  "infrastructure_pipeline": ["infra project 1", "infra project 2"],
  "social_infrastructure": "schools, hospitals, malls, restaurants — what exists",
  "risk_level": "Low|Medium|High",
  "primary_risk": "the single biggest risk for a buyer",
  "secondary_risks": ["risk1", "risk2"],
  "bull_case": "best case scenario in one sentence",
  "bear_case": "worst case scenario in one sentence",
  "analyst_recommendation": "2-3 sentence plain English recommendation for a buyer reading this",
  "commercial_rental_yield_min": number or null,
  "commercial_rental_yield_max": number or null,
  "commercial_rental_yield_detail": "text describing commercial rental market - office, retail, co-working rates per sqft per month. null if purely residential market"
}`;

  let parsed: Record<string, unknown>;
  try {
    const raw = await callClaude(prompt, 4096);
    console.log("Claude raw response length:", raw.length);
    parsed = parseJsonFromClaude(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Claude error for", mm.micro_market_name, ":", msg);
    await logJob(supabase, { job_type: "micro_market", entity_id: microMarketId, status: "error", message: `Claude error: ${msg}` });
    return "error";
  }

  // Upsert enrichment — all v1 fields preserved + v2 fields added
  const { error: upsertErr } = await supabase
    .from("micro_market_ai_enrichment")
    .upsert({
      micro_market_id: microMarketId,
      // v1 fields (backward compat)
      market_maturity: parsed.market_maturity ?? null,
      builder_activity: parsed.builder_activity ?? null,
      buyer_profile: parsed.buyer_profile ?? null,
      rental_yield_min: parsed.rental_yield_min ?? null,
      rental_yield_max: parsed.rental_yield_max ?? null,
      price_per_sqft_current: parsed.price_per_sqft_current ?? null,
      market_summary: parsed.market_summary ?? null,
      top_developers: parsed.top_developers ?? null,
      key_infrastructure_updates: parsed.infrastructure_pipeline ? (parsed.infrastructure_pipeline as string[]).join("; ") : null,
      market_risks: parsed.market_risks ?? null,
      confidence: parsed.confidence ?? null,
      // v2 fields
      zone_type: parsed.zone_type ?? null,
      market_character: parsed.market_character ?? null,
      price_band_current: parsed.price_band_current ?? null,
      buyer_profile_detail: parsed.buyer_profile_detail ?? null,
      lifestyle_score: parsed.lifestyle_score ?? null,
      possession_wait: parsed.possession_wait ?? null,
      best_for: parsed.best_for ?? null,
      appreciation_5yr: parsed.appreciation_5yr ?? null,
      rental_yield_detail: parsed.rental_yield_detail ?? null,
      entry_timing: parsed.entry_timing ?? null,
      entry_reasoning: parsed.entry_reasoning ?? null,
      employment_drivers: parsed.employment_drivers ?? null,
      infrastructure_pipeline: parsed.infrastructure_pipeline ?? null,
      social_infrastructure: parsed.social_infrastructure ?? null,
      risk_level: parsed.risk_level ?? null,
      primary_risk: parsed.primary_risk ?? null,
      secondary_risks: parsed.secondary_risks ?? null,
      bull_case: parsed.bull_case ?? null,
      bear_case: parsed.bear_case ?? null,
      analyst_recommendation: parsed.analyst_recommendation ?? null,
      commercial_rental_yield_min: parsed.commercial_rental_yield_min ?? null,
      commercial_rental_yield_max: parsed.commercial_rental_yield_max ?? null,
      commercial_rental_yield_detail: parsed.commercial_rental_yield_detail ?? null,
      fetched_at: new Date().toISOString(),
    }, { onConflict: "micro_market_id" });

  if (upsertErr) {
    console.error("Upsert error:", upsertErr.message);
    await logJob(supabase, { job_type: "micro_market", entity_id: microMarketId, status: "error", message: `DB upsert error: ${upsertErr.message}` });
    return "error";
  }

  console.log("Enriched successfully:", mm.micro_market_name);
  await logJob(supabase, { job_type: "micro_market", entity_id: microMarketId, status: "success", message: `Enriched: ${mm.micro_market_name}` });
  return "success";
}

// ---------------------------------------------------------------------------
// MARKET PULSE
// ---------------------------------------------------------------------------

async function runMarketPulse(
  supabase: ReturnType<typeof getSupabase>
): Promise<"success" | "error"> {
  const today = new Date();
  // Monday of current week
  const dayOfWeek = today.getDay(); // 0=Sun
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const weekOf = monday.toISOString().split("T")[0];

  console.log("Running market_pulse for week:", weekOf);

  const prompt = `You are a Hyderabad real estate market analyst.
Today is ${today.toISOString().split("T")[0]}.

Provide a weekly market pulse for Hyderabad real estate.

Return ONLY valid JSON:
{
  "headline": "one sentence market headline",
  "market_sentiment": "Bullish|Neutral|Cautious|Bearish",
  "key_developments": ["development1", "development2", "development3"],
  "price_movement": "brief description of price trends",
  "policy_updates": "any RERA/govt policy updates or null",
  "top_performing_markets": ["market1", "market2", "market3"],
  "confidence": "high|medium|low"
}`;

  let parsed: Record<string, unknown>;
  try {
    const raw = await callClaude(prompt, 1024);
    parsed = parseJsonFromClaude(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Claude error (market_pulse):", msg);
    await logJob(supabase, { job_type: "market_pulse", status: "error", message: `Claude error: ${msg}` });
    return "error";
  }

  const { error: upsertErr } = await supabase
    .from("market_pulse")
    .upsert({
      city: "hyderabad",
      week_of: weekOf,
      headline: parsed.headline ?? null,
      market_sentiment: parsed.market_sentiment ?? null,
      key_developments: parsed.key_developments ?? null,
      price_movement: parsed.price_movement ?? null,
      policy_updates: parsed.policy_updates ?? null,
      top_performing_markets: parsed.top_performing_markets ?? null,
      confidence: parsed.confidence ?? null,
      generated_at: new Date().toISOString(),
    }, { onConflict: "city,week_of" });

  if (upsertErr) {
    console.error("market_pulse upsert error:", upsertErr.message);
    await logJob(supabase, { job_type: "market_pulse", status: "error", message: `DB upsert error: ${upsertErr.message}` });
    return "error";
  }

  await logJob(supabase, { job_type: "market_pulse", status: "success", message: `Week of ${weekOf}` });
  return "success";
}

// ---------------------------------------------------------------------------
// BATCH: micro_market
// ---------------------------------------------------------------------------

async function runMicroMarketBatch(
  supabase: ReturnType<typeof getSupabase>,
  forceRefresh: boolean,
  offset: number,
  marketNames?: string[]
): Promise<BatchJobResult> {
  const LIMIT = 20;
  const result: BatchJobResult = { success: 0, errors: 0, skipped: 0, total_markets: 0, offset };

  console.log("Running micro_market batch, force:", forceRefresh, "offset:", offset, "market_names:", marketNames ?? "all");

  const HYDERABAD_CITY_ID = "9ee99453-9dff-41a2-b5a0-a6b18f03483e";

  let markets: Array<{ id: string; micro_market_name: string }> | null = null;
  let error: { message: string } | null = null;

  if (marketNames && marketNames.length > 0) {
    // Named-market mode: ignore offset/limit, filter by supplied names
    const res = await supabase
      .from("micro_markets")
      .select("id, micro_market_name")
      .eq("city_id", HYDERABAD_CITY_ID)
      .in("micro_market_name", marketNames)
      .order("micro_market_name", { ascending: true });

    markets = res.data;
    error = res.error;
    result.total_markets = markets?.length ?? 0;
  } else {
    // Paginated mode: get total count then fetch page
    const { count } = await supabase
      .from("micro_markets")
      .select("*", { count: "exact", head: true })
      .eq("city_id", HYDERABAD_CITY_ID);

    result.total_markets = count ?? 0;
    console.log("Total Hyderabad markets:", result.total_markets);

    const res = await supabase
      .from("micro_markets")
      .select("id, micro_market_name")
      .eq("city_id", HYDERABAD_CITY_ID)
      .order("micro_market_name", { ascending: true })
      .range(offset, offset + LIMIT - 1); // inclusive on both ends

    markets = res.data;
    error = res.error;
  }

  if (error || !markets) {
    console.error("Batch fetch error:", error?.message);
    await logJob(supabase, { job_type: "micro_market", status: "error", message: `Batch fetch error: ${error?.message}` });
    result.errors++;
    return result;
  }

  console.log("Batch: processing", markets.length, "markets at offset", offset, "of", result.total_markets);

  for (const market of markets) {
    const status = await enrichMicroMarket(supabase, market.id, forceRefresh);
    if (status === "success") result.success++;
    else if (status === "error") result.errors++;
    else result.skipped++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// PROJECT LIVE INTELLIGENCE enrichment (web search via rera_projects)
// ---------------------------------------------------------------------------

async function enrichProjectLiveIntelligence(
  supabase: ReturnType<typeof getSupabase>,
  reraProjectId: string,
  forceRefresh: boolean
): Promise<{ status: "success" | "error" | "skipped"; projectName?: string; errorMsg?: string }> {
  console.log("enrichProjectLiveIntelligence called, rera_project_id:", reraProjectId, "force:", forceRefresh);

  console.log("entity_id received:", reraProjectId);

  // Fetch from rera_projects — only columns that actually exist in the table
  const { data: project, error: projectErr } = await supabase
    .from("rera_projects")
    .select("id, project_name, rera_id, city_slug, current_status, proposed_completion_date, raw_payload")
    .eq("id", reraProjectId)
    .maybeSingle();

  if (projectErr || !project) {
    const msg = projectErr?.message ?? "RERA project not found";
    console.error("rera_projects fetch error:", msg, "for id:", reraProjectId);
    await logJob(supabase, { job_type: "project_live_intelligence", entity_id: reraProjectId, status: "error", message: msg });
    return { status: "error", errorMsg: msg };
  }

  const projectName: string = project.project_name ?? "Unknown Project";
  console.log("Fetched RERA project:", projectName, "| rera_id:", project.rera_id);

  // Extract developer name from raw_payload if available
  const rawPayload = project.raw_payload as Record<string, unknown> | null;
  const developerName: string =
    (rawPayload?.promoter_name as string) ??
    ((rawPayload?.sections as any)?.promoter_details?.promoter_name as string) ??
    "Unknown Developer";

  // Freshness check — skip if scraped within last 7 days
  if (!forceRefresh) {
    const { data: existing } = await supabase
      .from("project_live_intelligence")
      .select("scraped_at")
      .eq("rera_project_id", reraProjectId)
      .maybeSingle();

    if (existing?.scraped_at) {
      const ageDays = (Date.now() - new Date(existing.scraped_at).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < 7) {
        console.log("Skipping fresh project:", projectName, `(${Math.round(ageDays)}d ago)`);
        await logJob(supabase, { job_type: "project_live_intelligence", entity_id: reraProjectId, entity_name: projectName, status: "skipped", message: `Fresh (${Math.round(ageDays)}d ago)` });
        return { status: "skipped", projectName };
      }
    }
  }

  const prompt = `You are a real estate intelligence analyst. Use web_search to research the current on-ground status of ${projectName} by ${developerName} in Hyderabad, India.

Run these three searches in order:
1. "${projectName} Hyderabad handover possession 2025 2026"
2. "${projectName} Hyderabad price per sqft 2026"
3. "${projectName} Hyderabad reviews forum residents"

After reviewing all search results, extract and structure the following as valid JSON.
Be specific and factual. Use exact numbers from search results where available.

{
  "developer_price_min": integer (₹/sqft from developer) or null,
  "developer_price_max": integer (₹/sqft from developer) or null,
  "resale_price_min": integer (₹/sqft resale market) or null,
  "resale_price_max": integer (₹/sqft resale market) or null,
  "price_trend": "rising" | "stable" | "falling" | null,
  "actual_status": "under_construction" | "partial_handover" | "substantially_complete" | "fully_handed_over",
  "handover_started": true | false,
  "handover_notes": "One clear paragraph describing handover situation — tower-wise if known. null if no data found.",
  "towers_completed": integer or null,
  "towers_total": integer or null,
  "forum_sentiment": "positive" | "mixed" | "negative" | null,
  "key_updates": ["specific factual update 1 (dated if possible)", "update 2", "update 3"],
  "buyer_concerns": ["concern 1 found in forums or news", "concern 2"],
  "sources": ["URL or source 1", "URL or source 2", "URL or source 3"],
  "confidence": "high" | "medium" | "low"
}

Respond with a single valid JSON object only. Start your response with { and end with }. No other text.`;

  const systemPrompt = "You are a JSON API. You must respond with valid JSON only. No explanation, no preamble, no markdown, no code blocks. Just raw JSON.";

  let parsed: Record<string, unknown>;
  try {
    const raw = await callClaudeWithWebSearch(prompt, 4096, "claude-haiku-4-5-20251001", systemPrompt);
    console.log("Web search response length:", raw.length);
    parsed = parseJsonFromClaude(raw);

    // Validate prices — Claude sometimes scrapes sq.metre prices (10.764x too high).
    // Convert to sq.ft if outside the reasonable India range.
    const MAX_SQFT_PRICE = 50000;
    const MIN_SQFT_PRICE = 2000;
    const SQM_TO_SQFT = 10.764;
    for (const [minKey, maxKey] of [
      ["developer_price_min", "developer_price_max"],
      ["resale_price_min", "resale_price_max"],
    ] as const) {
      const min = parsed[minKey];
      if (typeof min === "number" && (min > MAX_SQFT_PRICE || min < MIN_SQFT_PRICE)) {
        console.log(`Price validation: ${minKey}=${min} out of range — converting sq.m → sq.ft`);
        if (typeof parsed[minKey] === "number") parsed[minKey] = Math.round((parsed[minKey] as number) / SQM_TO_SQFT);
        if (typeof parsed[maxKey] === "number") parsed[maxKey] = Math.round((parsed[maxKey] as number) / SQM_TO_SQFT);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Web search/parse error for", projectName, ":", msg);
    await logJob(supabase, { job_type: "project_live_intelligence", entity_id: reraProjectId, entity_name: projectName, status: "error", message: `Web search error: ${msg}` });
    return { status: "error", projectName, errorMsg: msg };
  }

  const payload = {
    actual_status: parsed.actual_status ?? null,
    handover_started: parsed.handover_started ?? null,
    handover_notes: parsed.handover_notes ?? null,
    towers_completed: parsed.towers_completed ?? null,
    towers_total: parsed.towers_total ?? null,
    developer_price_min: parsed.developer_price_min ?? null,
    developer_price_max: parsed.developer_price_max ?? null,
    resale_price_min: parsed.resale_price_min ?? null,
    resale_price_max: parsed.resale_price_max ?? null,
    price_trend: parsed.price_trend ?? null,
    forum_sentiment: parsed.forum_sentiment ?? null,
    key_updates: parsed.key_updates ?? null,
    buyer_concerns: parsed.buyer_concerns ?? null,
    sources: parsed.sources ?? null,
    confidence: parsed.confidence ?? null,
    scraped_at: new Date().toISOString(),
  };

  // Manual upsert: check if row exists, then update or insert
  const { data: existingRow } = await supabase
    .from("project_live_intelligence")
    .select("id")
    .eq("rera_project_id", reraProjectId)
    .maybeSingle();

  const { error: upsertErr } = existingRow?.id
    ? await supabase.from("project_live_intelligence").update(payload).eq("id", existingRow.id)
    : await supabase.from("project_live_intelligence").insert({ rera_project_id: reraProjectId, ...payload });

  if (upsertErr) {
    console.error("Upsert error for", projectName, ":", upsertErr.message);
    await logJob(supabase, { job_type: "project_live_intelligence", entity_id: reraProjectId, entity_name: projectName, status: "error", message: `DB upsert error: ${upsertErr.message}` });
    return { status: "error", projectName, errorMsg: `DB upsert error: ${upsertErr.message}` };
  }

  console.log("Enriched successfully:", projectName);
  await logJob(supabase, { job_type: "project_live_intelligence", entity_id: reraProjectId, entity_name: projectName, status: "success" });
  return { status: "success", projectName };
}

// ---------------------------------------------------------------------------
// BATCH: project_live_intelligence (from rera_projects with url_slug)
// ---------------------------------------------------------------------------

async function runProjectLiveIntelligenceBatch(
  supabase: ReturnType<typeof getSupabase>,
  forceRefresh: boolean,
  offset: number
): Promise<BatchJobResult> {
  const LIMIT = 5; // Smaller batches — each project runs 3 web searches
  const result: BatchJobResult = { success: 0, errors: 0, skipped: 0, total_markets: 0, offset };

  console.log("Running project_live_intelligence batch, force:", forceRefresh, "offset:", offset);

  const { count } = await supabase
    .from("rera_projects")
    .select("*", { count: "exact", head: true })
    .not("url_slug", "is", null);

  result.total_markets = count ?? 0;
  console.log("Total RERA projects with url_slug:", result.total_markets);

  const { data: projects, error } = await supabase
    .from("rera_projects")
    .select("id, project_name")
    .not("url_slug", "is", null)
    .order("project_name", { ascending: true })
    .range(offset, offset + LIMIT - 1);

  if (error || !projects) {
    console.error("Batch fetch error:", error?.message);
    await logJob(supabase, { job_type: "project_live_intelligence", status: "error", message: `Batch fetch error: ${error?.message}` });
    result.errors++;
    return result;
  }

  console.log("Batch: processing", projects.length, "projects at offset", offset);

  for (const project of projects) {
    const { status } = await enrichProjectLiveIntelligence(supabase, project.id, forceRefresh);
    if (status === "success") result.success++;
    else if (status === "error") result.errors++;
    else result.skipped++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// QUEUE BATCH: project_live_intelligence_batch
// Reads from project_intelligence_queue, drives enrichment per row.
// Migration required once: ALTER TABLE project_intelligence_queue
//   ADD COLUMN IF NOT EXISTS error_message text;
// ---------------------------------------------------------------------------

interface QueueBatchResult {
  ok: boolean;
  priority: number;
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
}

async function runProjectLiveIntelligenceQueueBatch(
  supabase: ReturnType<typeof getSupabase>,
  priority: number
): Promise<QueueBatchResult> {
  console.log("runProjectLiveIntelligenceQueueBatch, priority:", priority);

  // 1. Fetch 1 pending item for this priority (sequential, one project per call)
  const { data: queueItems, error: fetchErr } = await supabase
    .from("project_intelligence_queue")
    .select("id, project_id")
    .eq("priority", priority)
    .eq("status", "pending")
    .limit(1);

  if (fetchErr) {
    console.error("Queue fetch error:", fetchErr.message);
    return { ok: false, priority, processed: 0, succeeded: 0, failed: 0, remaining: 0 };
  }

  const items = queueItems ?? [];
  let succeeded = 0;
  let failed = 0;

  // 2. Process each item
  for (const item of items) {
    const queueId: string = item.id;
    const projectId: string = item.project_id;

    // Mark processing immediately
    await supabase
      .from("project_intelligence_queue")
      .update({ status: "processing" })
      .eq("id", queueId);

    // Run the full enrichment — always land on done/failed, never leave as processing
    try {
      const { status, errorMsg } = await enrichProjectLiveIntelligence(supabase, projectId, false);
      if (status === "success" || status === "skipped") {
        await supabase
          .from("project_intelligence_queue")
          .update({ status: "done", last_run_at: new Date().toISOString() })
          .eq("id", queueId);
        succeeded++;
      } else {
        await supabase
          .from("project_intelligence_queue")
          .update({ status: "failed", error_message: errorMsg ?? "Unknown error" })
          .eq("id", queueId);
        failed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Unhandled enrichment error for project", projectId, ":", msg);
      await supabase
        .from("project_intelligence_queue")
        .update({ status: "failed", error_message: msg })
        .eq("id", queueId);
      failed++;
    }
  }

  // 3. Count remaining pending for this priority
  const { count: remaining } = await supabase
    .from("project_intelligence_queue")
    .select("*", { count: "exact", head: true })
    .eq("priority", priority)
    .eq("status", "pending");

  return {
    ok: true,
    priority,
    processed: items.length,
    succeeded,
    failed,
    remaining: remaining ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: CORS_HEADERS });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: CORS_HEADERS });
  }

  console.log("Function started, job_type:", body.job_type);

  try {
    const { job_type, entity_id, force_refresh = false, offset = 0, market_names } = body;

    if (!job_type) {
      return new Response(JSON.stringify({ error: "job_type is required" }), { status: 400, headers: CORS_HEADERS });
    }

    const supabase = getSupabase();
    let result: JobResult | BatchJobResult | QueueBatchResult | { status: string };

    if (job_type === "project_live_intelligence_batch") {
      const priority = body.priority ?? 1;
      result = await runProjectLiveIntelligenceQueueBatch(supabase, priority);
      return new Response(JSON.stringify(result), { status: 200, headers: CORS_HEADERS });
    } else if (job_type === "micro_market") {
      if (entity_id) {
        // Single entity
        const status = await enrichMicroMarket(supabase, entity_id, force_refresh);
        result = {
          success: status === "success" ? 1 : 0,
          errors: status === "error" ? 1 : 0,
          skipped: status === "skipped" ? 1 : 0,
        };
      } else {
        // Batch: named markets or paginated
        result = await runMicroMarketBatch(supabase, force_refresh, offset, market_names);
      }
    } else if (job_type === "market_pulse") {
      const status = await runMarketPulse(supabase);
      result = { status };
    } else if (job_type === "project_live_intelligence") {
      if (entity_id) {
        const { status, projectName, errorMsg } = await enrichProjectLiveIntelligence(supabase, entity_id, force_refresh);
        if (status === "success") {
          return new Response(
            JSON.stringify({ ok: true, project: projectName, status: "enriched" }),
            { status: 200, headers: CORS_HEADERS }
          );
        }
        result = {
          success: 0,
          errors: status === "error" ? 1 : 0,
          skipped: status === "skipped" ? 1 : 0,
          debug_error: errorMsg ?? null,
        } as unknown as JobResult;
      } else {
        result = await runProjectLiveIntelligenceBatch(supabase, force_refresh, offset);
      }
    } else {
      return new Response(
        JSON.stringify({ error: `job_type "${job_type}" not yet implemented` }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return new Response(JSON.stringify({ ok: true, job_type, result }), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("Top level error:", msg, stack);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { headers: CORS_HEADERS, status: 500 }
    );
  }
});
