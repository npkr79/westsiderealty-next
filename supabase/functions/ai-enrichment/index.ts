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

async function callClaude(prompt: string): Promise<string> {
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
      max_tokens: 1024,
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
// MICRO MARKET enrichment
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
    .select("recent_launches, completion_ratio, velocity_score, developer_strength, new_developer_entries")
    .eq("id", microMarketId)
    .maybeSingle();

  const recentLaunches = cache?.recent_launches ?? "unknown";
  const completionRatio = cache?.completion_ratio != null ? `${Math.round(cache.completion_ratio * 100)}%` : "unknown";
  const velocityScore = cache?.velocity_score ?? "unknown";
  const developerStrength = cache?.developer_strength ?? "unknown";
  const newDeveloperEntries = cache?.new_developer_entries ?? "unknown";
  const priceMin = mm.price_per_sqft_min ?? "unknown";
  const priceMax = mm.price_per_sqft_max ?? "unknown";

  console.log("Calling Claude for:", mm.micro_market_name);

  const prompt = `You are a Hyderabad real estate analyst with deep knowledge of the market in 2026.

Analyze this micro-market based on RERA data and your knowledge:

MICRO-MARKET: ${mm.micro_market_name}
CITY: Hyderabad, India
RERA STATS:
- Recent project launches: ${recentLaunches}
- Completion ratio: ${completionRatio}
- Market velocity score: ${velocityScore}/100
- Developer strength: ${developerStrength}%
- New developer entries: ${newDeveloperEntries}
- Price range from records: ₹${priceMin}-${priceMax}/sqft

Based on your knowledge of ${mm.micro_market_name} in Hyderabad:

Return ONLY valid JSON, no other text:
{
  "market_maturity": "Emerging|Growing|Established|Peak",
  "builder_activity": "Low|Moderate|High|Saturated",
  "buyer_profile": "End-use|Investment|Mixed",
  "rental_yield_min": number or null,
  "rental_yield_max": number or null,
  "price_per_sqft_current": number or null,
  "market_summary": "2-3 sentences plain English for buyers",
  "top_developers": ["developer1", "developer2"],
  "key_infrastructure_updates": "text or null",
  "market_risks": "text or null",
  "confidence": "high|medium|low"
}`;

  let parsed: Record<string, unknown>;
  try {
    const raw = await callClaude(prompt);
    console.log("Claude raw response length:", raw.length);
    parsed = parseJsonFromClaude(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Claude error for", mm.micro_market_name, ":", msg);
    await logJob(supabase, { job_type: "micro_market", entity_id: microMarketId, status: "error", message: `Claude error: ${msg}` });
    return "error";
  }

  // Upsert enrichment
  const { error: upsertErr } = await supabase
    .from("micro_market_ai_enrichment")
    .upsert({
      micro_market_id: microMarketId,
      market_maturity: parsed.market_maturity ?? null,
      builder_activity: parsed.builder_activity ?? null,
      buyer_profile: parsed.buyer_profile ?? null,
      rental_yield_min: parsed.rental_yield_min ?? null,
      rental_yield_max: parsed.rental_yield_max ?? null,
      price_per_sqft_current: parsed.price_per_sqft_current ?? null,
      market_summary: parsed.market_summary ?? null,
      top_developers: parsed.top_developers ?? null,
      key_infrastructure_updates: parsed.key_infrastructure_updates ?? null,
      market_risks: parsed.market_risks ?? null,
      confidence: parsed.confidence ?? null,
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
    const raw = await callClaude(prompt);
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
