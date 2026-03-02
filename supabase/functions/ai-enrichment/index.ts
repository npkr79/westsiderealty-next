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
  job_type: "micro_market" | "project" | "developer" | "market_pulse";
  entity_id?: string;
  force_refresh?: boolean;
  offset?: number;
  market_names?: string[];
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
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Job log helper
// ---------------------------------------------------------------------------

async function logJob(
  supabase: ReturnType<typeof getSupabase>,
  opts: {
    job_type: string;
    entity_id?: string | null;
    status: "success" | "error" | "skipped";
    message?: string;
  }
) {
  await supabase.from("ai_enrichment_job_log").insert({
    job_type: opts.job_type,
    entity_id: opts.entity_id ?? null,
    status: opts.status,
    message: opts.message ?? null,
    created_at: new Date().toISOString(),
  });
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

  // Check freshness — skip if enriched within 25 days unless force_refresh
  if (!forceRefresh) {
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
    let result: JobResult | BatchJobResult | { status: string };

    if (job_type === "micro_market") {
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
