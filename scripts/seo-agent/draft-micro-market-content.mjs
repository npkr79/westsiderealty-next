/**
 * Phase 1C — Generate review-ready content drafts for thin-description micro-markets.
 *
 * 61 micro-markets have empty `growth_story` (the field the audit reads). This
 * script generates drafts using Claude Sonnet 4.6 from structured fields.
 * Drafts land in `output/micro-market-drafts/{slug}.json` for human review.
 *
 * To promote a reviewed draft into the live `micro_markets` row, run:
 *   node --env-file=.env.local scripts/seo-agent/draft-micro-market-content.mjs --promote --slug <url-slug>
 * Or to promote ALL files in output/micro-market-drafts/ (after review):
 *   node --env-file=.env.local scripts/seo-agent/draft-micro-market-content.mjs --promote-all
 *
 * Usage:
 *   node --env-file=.env.local scripts/seo-agent/draft-micro-market-content.mjs           # generate all
 *   node --env-file=.env.local scripts/seo-agent/draft-micro-market-content.mjs --limit 3 # generate 3
 *   node --env-file=.env.local scripts/seo-agent/draft-micro-market-content.mjs --slug bellandur
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const PROMOTE = args.includes("--promote");
const PROMOTE_ALL = args.includes("--promote-all");
const SLUG_IDX = args.indexOf("--slug");
const SLUG = SLUG_IDX > -1 ? args[SLUG_IDX + 1] : null;
const LIMIT_IDX = args.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? Number(args[LIMIT_IDX + 1]) : null;

const DRAFTS_DIR = path.resolve(process.cwd(), "output/micro-market-drafts");
fs.mkdirSync(DRAFTS_DIR, { recursive: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

const MODEL = "claude-sonnet-4-6";

function buildPrompt(mm) {
  const cityName = mm.city_name || "the city";
  const facts = {
    name: mm.micro_market_name,
    slug: mm.url_slug,
    city: cityName,
    pincode: mm.locality_pincode || null,
    pricePerSqftMin: mm.price_per_sqft_min,
    pricePerSqftMax: mm.price_per_sqft_max,
    appreciationMinPct: mm.annual_appreciation_min,
    appreciationMaxPct: mm.annual_appreciation_max,
    rentalYieldMinPct: mm.rental_yield_min,
    rentalYieldMaxPct: mm.rental_yield_max,
    primaryPropertyTypes: mm.primary_property_types,
    keyAdjacentAreas: mm.key_adjacent_areas,
    nearestMmtsStatus: mm.nearest_mmts_status,
    isLuxury: mm.is_luxury,
    existingHeroHook: mm.hero_hook,
  };

  return `You are writing micro-market content for an Indian real estate listings site (westsiderealty.in). The audience is buyers and investors researching a specific micro-market in ${cityName}, India.

The micro-market is "${mm.micro_market_name}" — a locality in ${cityName}. Use only your general knowledge of ${cityName} and the structured facts below. Do NOT confuse this with similarly-named areas in other cities.

Generate FOUR sections:

1) growth_story (300-450 words, plain text paragraphs separated by blank lines): The narrative arc of why this micro-market is worth attention right now. Cover: the catalyst that put this area on the map, the inflection happening today, who is moving here and why, where this is heading next 3-5 years. Concrete and grounded — no marketing fluff. The keyword "${mm.micro_market_name}" should appear in the first sentence, and the city "${cityName}" within the first two sentences.

2) connectivity_details (150-250 words, plain text): How buyers actually get to and from this micro-market — within ${cityName}. Reference the transport infrastructure that actually exists in ${cityName} (the right ring road, metro/local train system, airport, expressways). For Goa locations: mention NH-66, Goa airports (Dabolim/Mopa), distance to Panjim/Margao. For Bangalore: ORR, NICE Road, Kempegowda airport, Namma Metro. For Mumbai: Western/Eastern Express Highway, local trains, BKC, airport. For Delhi/NCR: appropriate expressways, metro, IGI airport. For Hyderabad: ORR, HITEC City, Financial District, RGI airport. Use realistic distances or omit.

3) infrastructure_details (150-250 words, plain text): The physical and civic infrastructure. Roads, water, drainage, planned vs delivered. Schools, hospitals, retail. What works, what is still under-built.

4) inventory_description (120-200 words, plain text): What's available to buy here today. Property types, price band, configurations, project mix (large branded vs boutique), launch vs ready stock.

CRITICAL CONSTRAINTS:
- Do NOT fabricate specific facts (named projects you don't know, distances you can't estimate within 20%, awards, brand quotes).
- Do NOT place this locality in the wrong city. If the name is ambiguous, anchor it to ${cityName} as instructed.
- Use ONLY the facts below plus general knowledge about ${cityName} micro-markets.
- Write in clear, conversational Indian English. No exclamation marks. No "nestled in", "thriving hub", "dream destination" or similar clichés.
- Keyword density target in growth_story: "${mm.micro_market_name}" 3-5 times naturally; "${cityName}" 2-4 times.

FACTS PROVIDED:
${JSON.stringify(facts, null, 2)}

OUTPUT FORMAT — strict JSON, no surrounding text, no markdown fences:
{
  "growth_story": "...",
  "connectivity_details": "...",
  "infrastructure_details": "...",
  "inventory_description": "..."
}`;
}

async function generateDraft(mm) {
  if (!anthropic) {
    console.error("ANTHROPIC_API_KEY not set; cannot generate.");
    process.exit(1);
  }
  const prompt = buildPrompt(mm);
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  function tryParse(s) {
    try { return JSON.parse(s); } catch { return null; }
  }
  // Strip code fences if present
  const stripped = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  let parsed = tryParse(stripped);
  if (!parsed) {
    // Escape raw control chars (newlines/tabs/CR) inside string values.
    // Walk the text and replace control chars that appear inside double-quoted
    // string regions (toggling on each unescaped quote).
    let out = "";
    let inStr = false, esc = false;
    for (const ch of stripped) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === "\\") { out += ch; esc = true; continue; }
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (inStr) {
        if (ch === "\n") { out += "\\n"; continue; }
        if (ch === "\r") { out += "\\r"; continue; }
        if (ch === "\t") { out += "\\t"; continue; }
        const code = ch.charCodeAt(0);
        if (code < 0x20) { out += "\\u" + code.toString(16).padStart(4, "0"); continue; }
      }
      out += ch;
    }
    parsed = tryParse(out);
  }
  if (!parsed) throw new Error("Could not parse model output as JSON");
  return {
    parsed,
    usage: resp.usage,
  };
}

async function generateMode() {
  console.log(`[1C] generate mode (limit=${LIMIT ?? "all"} slug=${SLUG ?? "all"})`);

  // Find thin-description micro-markets
  let q = supabase
    .from("seo_content_quality")
    .select("entity_id")
    .eq("issue_type", "thin_description")
    .eq("entity_type", "micro_market")
    .is("resolved_at", null);
  const { data: open, error } = await q;
  if (error) {
    console.error("audit fetch error:", error.message);
    process.exit(1);
  }
  const ids = open.map((r) => r.entity_id);

  let mmQuery = supabase
    .from("micro_markets")
    .select(
      "id, url_slug, micro_market_name, hero_hook, growth_story, locality_pincode, price_per_sqft_min, price_per_sqft_max, annual_appreciation_min, annual_appreciation_max, rental_yield_min, rental_yield_max, primary_property_types, key_adjacent_areas, nearest_mmts_status, is_luxury, city_id"
    )
    .in("id", ids);
  if (SLUG) mmQuery = mmQuery.eq("url_slug", SLUG);
  const { data: mms, error: mmErr } = await mmQuery;
  if (mmErr) {
    console.error("micro_markets fetch error:", mmErr.message);
    process.exit(1);
  }

  // Hydrate city_name for each micro-market
  const cityIds = [...new Set(mms.map((m) => m.city_id).filter(Boolean))];
  const cityById = new Map();
  if (cityIds.length) {
    const { data: cities } = await supabase
      .from("cities")
      .select("id, city_name")
      .in("id", cityIds);
    for (const c of cities || []) cityById.set(c.id, c.city_name);
  }
  for (const mm of mms) mm.city_name = cityById.get(mm.city_id) || null;

  const todo = LIMIT ? mms.slice(0, LIMIT) : mms;
  console.log(`[1C] generating drafts for ${todo.length} micro-markets`);

  let totalIn = 0,
    totalOut = 0;
  for (const mm of todo) {
    process.stdout.write(`  ${mm.url_slug}... `);
    try {
      const { parsed, usage } = await generateDraft(mm);
      totalIn += usage.input_tokens || 0;
      totalOut += usage.output_tokens || 0;
      const out = {
        url_slug: mm.url_slug,
        micro_market_name: mm.micro_market_name,
        generated_at: new Date().toISOString(),
        model: MODEL,
        usage,
        draft: parsed,
      };
      const file = path.join(DRAFTS_DIR, `${mm.url_slug}.json`);
      fs.writeFileSync(file, JSON.stringify(out, null, 2));
      console.log(`OK (${parsed.growth_story?.length ?? 0} chars growth_story)`);
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
    }
  }

  // Cost projection: claude-sonnet-4-6 ≈ $3/MTok input, $15/MTok output
  const cost = (totalIn / 1_000_000) * 3 + (totalOut / 1_000_000) * 15;
  console.log(
    `[1C] tokens: in=${totalIn} out=${totalOut} | est cost USD $${cost.toFixed(3)} | drafts at ${DRAFTS_DIR}`
  );
}

async function promoteOne(slug) {
  const file = path.join(DRAFTS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    console.error(`no draft file for ${slug}`);
    return false;
  }
  const draft = JSON.parse(fs.readFileSync(file, "utf8")).draft;
  if (!draft.growth_story) {
    console.error(`draft for ${slug} missing growth_story`);
    return false;
  }

  const update = {
    growth_story: draft.growth_story,
    connectivity_details: draft.connectivity_details,
    infrastructure_details: draft.infrastructure_details,
    inventory_description: draft.inventory_description,
  };
  const { error } = await supabase.from("micro_markets").update(update).eq("url_slug", slug);
  if (error) {
    console.error(`promote error for ${slug}: ${error.message}`);
    return false;
  }

  // Mark thin_description audit rows resolved for this micro-market
  const { data: mm } = await supabase.from("micro_markets").select("id").eq("url_slug", slug).single();
  if (mm) {
    await supabase
      .from("seo_content_quality")
      .update({ resolved_at: new Date().toISOString() })
      .eq("entity_type", "micro_market")
      .eq("issue_type", "thin_description")
      .eq("entity_id", String(mm.id))
      .is("resolved_at", null);
  }
  console.log(`[1C] promoted ${slug}`);
  return true;
}

async function promoteMode() {
  if (PROMOTE_ALL) {
    const files = fs.readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".json"));
    let n = 0;
    for (const f of files) {
      const slug = f.replace(/\.json$/, "");
      if (await promoteOne(slug)) n++;
    }
    console.log(`[1C] promoted ${n}/${files.length}`);
  } else if (SLUG) {
    await promoteOne(SLUG);
  } else {
    console.error("--promote requires --slug <slug> or use --promote-all");
    process.exit(1);
  }
}

if (PROMOTE || PROMOTE_ALL) await promoteMode();
else await generateMode();
