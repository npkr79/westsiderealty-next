import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// City + Region definitions
// ---------------------------------------------------------------------------

const REGIONS = {
  south: ["hyderabad", "bengaluru", "chennai"] as const,
  west:  ["goa", "mumbai", "pune", "ahmedabad"] as const,
  north: ["delhi_ncr", "gurugram", "noida", "jaipur"] as const,
  east:  ["kolkata", "kochi"] as const,
} as const;

type Region = keyof typeof REGIONS;
type City = (typeof REGIONS)[Region][number];

// Flat list for slugify / display lookups
const ALL_CITIES = [
  ...REGIONS.south,
  ...REGIONS.west,
  ...REGIONS.north,
  ...REGIONS.east,
] as const;

const CITY_DISPLAY: Record<City, string> = {
  hyderabad:   "Hyderabad",
  bengaluru:   "Bengaluru",
  chennai:     "Chennai",
  goa:         "Goa",
  mumbai:      "Mumbai",
  pune:        "Pune",
  ahmedabad:   "Ahmedabad",
  delhi_ncr:   "Delhi NCR",
  gurugram:    "Gurugram",
  noida:       "Noida",
  jaipur:      "Jaipur",
  kolkata:     "Kolkata",
  kochi:       "Kochi",
};

// State name for fallback Serper queries
const CITY_STATE: Record<City, string> = {
  hyderabad:  "Telangana",
  bengaluru:  "Karnataka",
  chennai:    "Tamil Nadu",
  goa:        "Goa",
  mumbai:     "Maharashtra",
  pune:       "Maharashtra",
  ahmedabad:  "Gujarat",
  delhi_ncr:  "Delhi NCR",
  gurugram:   "Haryana",
  noida:      "Uttar Pradesh",
  jaipur:     "Rajasthan",
  kolkata:    "West Bengal",
  kochi:      "Kerala",
};

// ---------------------------------------------------------------------------
// Phase 1 — Regional Round-Robin Schedule
// ---------------------------------------------------------------------------
// Each day maps to two regions. Within each region we pick the city
// with the fewest articles in the last 30 days (least-used-first).
//
// Day: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const DAY_SCHEDULE: Record<number, [Region, Region]> = {
  0: ["west",  "east"],   // Sun
  1: ["south", "west"],   // Mon
  2: ["north", "east"],   // Tue
  3: ["south", "north"],  // Wed
  4: ["west",  "east"],   // Thu
  5: ["south", "west"],   // Fri
  6: ["north", "south"],  // Sat
};

async function pickTodayCities(supabase: SupabaseClient): Promise<[City, City]> {
  // Day of week in IST
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const dayOfWeek = nowIST.getUTCDay();
  const [regionA, regionB] = DAY_SCHEDULE[dayOfWeek];

  // Load 30-day usage counts per city
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentArticles } = await supabase
    .from("generated_articles")
    .select("city")
    .gte("updated_at", since30d);

  const usageCount: Partial<Record<City, number>> = {};
  for (const a of recentArticles ?? []) {
    const c = a.city as City;
    if (ALL_CITIES.includes(c)) usageCount[c] = (usageCount[c] ?? 0) + 1;
  }

  // Pick least-used city from each region
  function pickFromRegion(region: Region): City {
    const cities = [...REGIONS[region]] as City[];
    cities.sort((a, b) => (usageCount[a] ?? 0) - (usageCount[b] ?? 0));
    return cities[0];
  }

  const city1 = pickFromRegion(regionA);
  let city2 = pickFromRegion(regionB);
  // Ensure distinct (edge case: both regions happen to pick same city)
  if (city2 === city1) {
    const fallbacks = ([...REGIONS[regionB]] as City[]).filter((c) => c !== city1);
    city2 = fallbacks[0] ?? (city1 === "hyderabad" ? "goa" : "hyderabad");
  }

  console.log(`[article-gen] Day ${dayOfWeek} → regions ${regionA}+${regionB} → ${city1}, ${city2}`);
  return [city1, city2];
}

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function slugify(text: string | undefined | null): string {
  if (!text) return `article-${Date.now()}`;
  return text
    .toLowerCase()
    .replace(/₹[\d,]+\s*\/?/g, "")
    .replace(/\d+(\.\d+)?%/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// Phase 2 — Serper news-first with fallback chain
// ---------------------------------------------------------------------------

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

async function callSerper(query: string): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "in", hl: "en", num: 8 }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.organic ?? []) as SerperResult[];
  } catch {
    return [];
  }
}

// Returns formatted news snippets grounded in today's web results.
// Fallback chain: city RE news → state RE policy → city infrastructure.
async function fetchLiveNewsForCity(city: City): Promise<string> {
  const cityName = CITY_DISPLAY[city];
  const stateName = CITY_STATE[city];
  const monthYear = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  // Primary: city-specific real estate news
  const primary = await callSerper(`"${cityName}" real estate property market news ${monthYear}`);
  if (primary.length >= 2) {
    return formatSerperResults(primary, cityName);
  }

  // Fallback 1: state-level RE policy
  const stateFallback = await callSerper(`${stateName} real estate policy housing news 2025 2026`);
  if (stateFallback.length >= 1) {
    console.log(`[article-gen] Using state fallback for ${city}`);
    return formatSerperResults(stateFallback, cityName);
  }

  // Fallback 2: city infrastructure as RE catalyst
  const infraFallback = await callSerper(`${cityName} metro rail highway infrastructure project 2025 2026 real estate`);
  if (infraFallback.length >= 1) {
    console.log(`[article-gen] Using infra fallback for ${city}`);
    return formatSerperResults(infraFallback, cityName);
  }

  return `No live news found for ${cityName}. Write based on current market knowledge.`;
}

function formatSerperResults(results: SerperResult[], cityName: string): string {
  const top = results.slice(0, 5);
  const lines = top.map((r) => {
    const date = r.date ? ` (${r.date})` : "";
    return `- ${r.title}${date}\n  ${r.snippet}`;
  });
  return `Live web news for ${cityName}:\n${lines.join("\n")}`;
}

// ---------------------------------------------------------------------------
// Fetch DB news articles for a city (keep as supplemental context)
// ---------------------------------------------------------------------------

interface DbNewsArticle {
  id: string;
  headline: string;
  summary: string | null;
  ai_summary: string | null;
  source_name: string;
  cities: string[];
  category: string;
  scraped_at: string;
}

async function getDbNewsForCity(
  supabase: SupabaseClient,
  city: City
): Promise<DbNewsArticle[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("news_articles")
    .select("id, headline, summary, ai_summary, source_name, cities, category, scraped_at")
    .gte("scraped_at", since)
    .gte("relevance_score", 6.0)
    .order("relevance_score", { ascending: false })
    .limit(50);

  const all = (data ?? []) as DbNewsArticle[];
  const cityTagged = all.filter((a) => a.cities?.includes(city));
  const general = all.filter((a) => !a.cities?.length);
  return [...cityTagged.slice(0, 6), ...general.slice(0, 3)];
}

// ---------------------------------------------------------------------------
// Phase 3 — Semantic Dedup (60-day rolling archive)
// ---------------------------------------------------------------------------

function jaccardSimilarity(a: string | undefined | null, b: string | undefined | null): number {
  if (!a || !b) return 0;
  const tokenize = (s: string) =>
    new Set(
      s.toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3) // skip short words
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

interface ArchivedArticle {
  seo_headline: string;
  city: string;
  micro_market: string | null;
}

async function loadRecentHeadlines(supabase: SupabaseClient): Promise<ArchivedArticle[]> {
  const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("generated_articles")
    .select("seo_headline, city, micro_market")
    .gte("updated_at", since60d);
  return (data ?? []) as ArchivedArticle[];
}

// Uses Claude Haiku to extract core entities from two headlines and compare them.
async function isSameEventByEntities(
  anthropic: Anthropic,
  titleA: string,
  titleB: string
): Promise<boolean> {
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: `Compare these two real estate article headlines and extract core entities from each.
Return JSON only: {"a": {"developer":"","location":"","event_type":""}, "b": {"developer":"","location":"","event_type":""}, "same_event": true/false}
If 2 or more entities match exactly, set same_event=true.

Title A: ${titleA}
Title B: ${titleB}`,
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return false;
    const parsed = JSON.parse(match[0]) as { same_event: boolean };
    return parsed.same_event === true;
  } catch {
    return false;
  }
}

async function isDuplicateArticle(
  anthropic: Anthropic,
  candidateTitle: string,
  archive: ArchivedArticle[]
): Promise<boolean> {
  for (const archived of archive) {
    const sim = jaccardSimilarity(candidateTitle, archived.seo_headline);
    if (sim >= 0.5) {
      // Similarity threshold hit — do deeper entity check with Haiku
      const sameEvent = await isSameEventByEntities(
        anthropic,
        candidateTitle,
        archived.seo_headline
      );
      if (sameEvent) {
        console.log(
          `[article-gen] Semantic dedup: "${candidateTitle}" matches "${archived.seo_headline}" (sim=${sim.toFixed(2)})`
        );
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Claude article generation
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the India Real Estate News Intelligence Agent for Westside Realty (westsiderealty.in). Your operator is Praveen Reddy, founder of Westside Realty.

## YOUR PURPOSE
You produce authoritative, data-backed real estate articles educating buyers and investors across India's major metros. Your content establishes Westside Realty as a national real estate authority and generates SEO traffic for westsiderealty.in.

## CONTENT RULES
- Always write from expertise, never from a selling position
- Never use: "exciting opportunity", "don't miss out", "golden chance", "dream home"
- Always cite specific numbers: price per sqft, rental yield %, appreciation %, RERA numbers where available
- Always connect macro news to a specific micro-market and a specific buyer type
- Use ₹ and Indian number format (lakhs, crores) throughout
- Tone: authoritative, data-backed — like a JLL or Anarock market report
- Length: 400–600 words per article
- Language: English only
- Each article must name at least one specific locality/corridor, not just the city
- Use the live web news provided as the primary source — prioritise recent factual data over general knowledge

## HYDERABAD CONTEXT
Core micro-markets: Kokapet, Narsingi, Tellapur, Gachibowli, Financial District, Kondapur, Manikonda
Emerging: Bachupally, Kollur, Patancheru, Pocharam, Beeramguda, Nagole
Key developers: Godrej, MyHome, Prestige, Anvita, Sumadhura, Aparna, Aliens
Track: RERA Telangana, ORR development, Metro Phase II, HMDA approvals
Personas: IT professional 28–38 ₹60L–₹1.5Cr | HNI investor 40–55 ₹1.5Cr–₹5Cr | Commercial investor ₹5Cr+

## GOA CONTEXT
Micro-markets: North Goa (Calangute, Candolim, Anjuna, Arpora, Porvorim), South Goa (Vasco, Margao, Colva), emerging (Saligao, Moira, Aldona)
Key angles: holiday home rental yields, CRZ updates, NH-66, Mopa airport impact, RERA Goa
Developers: Kolte-Patil, Tata Housing, local Goa developers
Personas: HNI second-home buyer ₹1Cr–₹5Cr | NRI rental yield investor | Retiree lifestyle buyer ₹80L–₹2Cr

## NATIONAL COVERAGE
Connect national macro-events to the specific city: RBI rates → EMI impact, Budget → which segment benefits, Infrastructure → price impact on specific corridors, IT/GCC → residential demand.

## WHAT TO TRACK
1. RERA updates (state-specific)
2. Infrastructure: metro, expressways, airports, IT parks
3. Micro-market price movements with PSF data
4. Tier-1 developer launches (Godrej, Prestige, Brigade, Sobha, Lodha, Tata, DLF)
5. Home loan rate changes and EMI impact
6. IT/GCC signals as leading indicator for residential demand
7. Budget and policy (PMAY, stamp duty waivers, FSI changes)
8. NRI and HNI investment signals`;

interface GeneratedArticle {
  city: City;
  micro_market: string;
  seo_headline: string;
  meta_description: string;
  body: string;
  whatsapp_summary: string;
  target_persona: string;
  drip_placement: "Day-7" | "Day-14" | "Day-30" | "Day-45";
}

interface RunOutput {
  articles: GeneratedArticle[];
  market_brief: string[];
}

async function generateWithClaude(
  city1: City,
  city2: City,
  liveNews1: string,
  liveNews2: string,
  dbNews1: DbNewsArticle[],
  dbNews2: DbNewsArticle[]
): Promise<RunOutput> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const formatDbNews = (articles: DbNewsArticle[], city: City) => {
    if (!articles.length) return "";
    return `\nSupplemental DB articles for ${CITY_DISPLAY[city]}:\n` +
      articles.map((a) => `- [${a.source_name}] ${a.headline}${a.ai_summary ? `: ${a.ai_summary}` : ""}`).join("\n");
  };

  const userPrompt = `Today produce 2 articles:
- Article 1: ${CITY_DISPLAY[city1]}
- Article 2: ${CITY_DISPLAY[city2]}

## Live web news for ${CITY_DISPLAY[city1]}:
${liveNews1}
${formatDbNews(dbNews1, city1)}

## Live web news for ${CITY_DISPLAY[city2]}:
${liveNews2}
${formatDbNews(dbNews2, city2)}

Ground each article in the live web news above. Prioritise recent facts, specific numbers, and named developments from the news snippets.
Call the generate_articles tool with both articles and the market brief.`;

  // Use tool use instead of text JSON — Anthropic handles serialisation, so
  // markdown in article bodies (quotes, backticks, newlines) never breaks parsing.
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,  // 2 full articles + market brief can exceed 4096
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "generate_articles",
        description: "Output the two generated real estate articles and market brief",
        input_schema: {
          type: "object" as const,
          properties: {
            articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  city:             { type: "string" },
                  micro_market:     { type: "string" },
                  seo_headline:     { type: "string", description: "max 60 chars" },
                  meta_description: { type: "string", description: "max 155 chars" },
                  body:             { type: "string", description: "400-600 word article in markdown" },
                  whatsapp_summary: { type: "string", description: "max 160 chars" },
                  target_persona:   { type: "string" },
                  drip_placement:   { type: "string", enum: ["Day-7", "Day-14", "Day-30", "Day-45"] },
                },
                required: ["city", "micro_market", "seo_headline", "meta_description", "body", "whatsapp_summary", "target_persona", "drip_placement"],
              },
            },
            market_brief: {
              type: "array",
              items: { type: "string" },
              description: "5 private intel bullets for Praveen",
            },
          },
          required: ["articles", "market_brief"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "generate_articles" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not call the generate_articles tool");
  }

  const result = toolBlock.input as RunOutput;

  // Validate articles array before returning — catch missing required fields early
  if (!Array.isArray(result.articles) || result.articles.length === 0) {
    throw new Error("Tool response missing articles array");
  }
  for (const a of result.articles) {
    if (!a.city) throw new Error(`Article missing city field`);
    if (!a.seo_headline) throw new Error(`Article for ${a.city} missing seo_headline`);
    if (!a.body) throw new Error(`Article for ${a.city} missing body`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Hero image generation — gpt-image-1 (high quality) + Cloudinary upload
// ---------------------------------------------------------------------------

// Extract plain text from the first N paragraphs of a markdown body.
function extractFirstParagraphs(markdown: string, count = 2): string {
  return markdown
    .split(/\n{2,}/)                        // split on blank lines
    .map((p) => p.replace(/[#*_`>~[\]]/g, "").trim()) // strip markdown syntax
    .filter((p) => p.length > 40)           // skip headings/short lines
    .slice(0, count)
    .join(" ");
}

async function generateHeroImage(
  headline: string,
  body: string,
  articleId: string,
): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;

  const context = extractFirstParagraphs(body, 2);

  const prompt = [
    `Create a premium editorial hero image for a real estate news article.`,
    `Article title: "${headline}"`,
    `Context: ${context.slice(0, 400)}`,
    `Style: photorealistic, high-end architectural magazine quality, wide cinematic shot.`,
    `NO text, NO watermarks, NO logos, NO people's faces.`,
    `Composition: subject centred horizontally, clear sky or clean background at top third,`,
    `main subject (building / skyline / infrastructure) fills the centre of the frame`,
    `so the image works when cropped to any aspect ratio without key elements being cut off.`,
    `Lighting: bright natural daylight or golden hour — crisp, professional.`,
  ].join(" ");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1536x1024",   // landscape 3:2 — closest to 16:9 gpt-image-1 supports
      quality: "high",
      output_format: "jpeg",
    }),
  });

  if (!res.ok) throw new Error(`gpt-image-1 error: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const b64: string = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("gpt-image-1 returned no image data");

  // Upload to Cloudinary for a permanent URL
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    analytics:  false,
  });

  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `article-heroes/${articleId}`, public_id: "hero", overwrite: true, resource_type: "image" },
      (err, result) => { if (err || !result) reject(err); else resolve(result); }
    );
    stream.end(Buffer.from(b64, "base64"));
  });

  console.log(`[article-gen] Hero image uploaded: ${uploadResult.secure_url}`);
  return uploadResult.secure_url;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface ArticleRunResult {
  articlesGenerated: number;
  cities: string[];
  articleIds: string[];
  errors: string[];
}

export async function runArticleGeneration(
  supabase: SupabaseClient
): Promise<ArticleRunResult> {
  const errors: string[] = [];
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // 1. Pick today's 2 cities via regional round-robin
  const [city1, city2] = await pickTodayCities(supabase);

  // 2. Early exit if both already done today
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { data: todayArticles } = await supabase
    .from("generated_articles")
    .select("city")
    .in("city", [city1, city2])
    .gte("updated_at", todayStart.toISOString());
  const citiesAlreadyDone = new Set((todayArticles ?? []).map((a: { city: string }) => a.city));
  const citiesToGenerate = [city1, city2].filter((c) => !citiesAlreadyDone.has(c));

  if (citiesToGenerate.length === 0) {
    console.log("[article-gen] Both cities already have articles today — skipping");
    return { articlesGenerated: 0, cities: [city1, city2], articleIds: [], errors: ["Already generated today"] };
  }

  const c1 = citiesToGenerate[0];
  const c2 = citiesToGenerate[1] ?? citiesToGenerate[0];

  // 3. Load 60-day headline archive for semantic dedup
  const headlineArchive = await loadRecentHeadlines(supabase);

  // 4. Fetch live news (Serper) + DB news in parallel
  const [liveNews1, liveNews2, dbNews1, dbNews2] = await Promise.all([
    fetchLiveNewsForCity(c1),
    fetchLiveNewsForCity(c2),
    getDbNewsForCity(supabase, c1),
    getDbNewsForCity(supabase, c2),
  ]);

  console.log(`[article-gen] Generating for: ${c1}, ${c2}`);

  // 5. Generate with Claude (grounded in live Serper news)
  let output: RunOutput;
  try {
    output = await generateWithClaude(c1, c2, liveNews1, liveNews2, dbNews1, dbNews2);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Claude generation failed: ${msg}`);
  }

  // 6. Insert articles, with dedup guards
  const articleIds: string[] = [];

  for (const article of output.articles) {
    const cityNews = article.city === c1 ? dbNews1 : dbNews2;
    const sourceIds = cityNews.map((n) => n.id);
    const sourceArticles = cityNews.map((n) => ({
      id: n.id, headline: n.headline, source_name: n.source_name, scraped_at: n.scraped_at,
    }));

    // Dedup A: exact slug match
    const slug = slugify(article.seo_headline);
    const { data: existingSlug } = await supabase
      .from("generated_articles").select("id").eq("slug", slug).maybeSingle();
    if (existingSlug) {
      console.log(`[article-gen] Skipping duplicate slug "${slug}"`);
      errors.push(`Skipped duplicate slug: ${slug}`);
      continue;
    }

    // Dedup B: already generated for this city today
    const { count: todayCount } = await supabase
      .from("generated_articles")
      .select("id", { count: "exact", head: true })
      .eq("city", article.city)
      .gte("updated_at", todayStart.toISOString());
    if ((todayCount ?? 0) >= 1) {
      console.log(`[article-gen] Skipping ${article.city} — already generated today`);
      errors.push(`Skipped ${article.city}: already generated today`);
      continue;
    }

    // Dedup C: semantic similarity against 60-day archive (Phase 3)
    const isDup = await isDuplicateArticle(anthropic, article.seo_headline, headlineArchive);
    if (isDup) {
      errors.push(`Skipped semantic duplicate: ${article.seo_headline}`);
      continue;
    }

    const tempId = crypto.randomUUID();
    const { data: inserted, error } = await supabase
      .from("generated_articles")
      .insert({
        id: tempId,
        city: article.city,
        micro_market: article.micro_market,
        seo_headline: article.seo_headline.slice(0, 60),
        meta_description: article.meta_description.slice(0, 155),
        body: article.body,
        slug,
        whatsapp_summary: article.whatsapp_summary.slice(0, 160),
        target_persona: article.target_persona,
        drip_placement: article.drip_placement,
        status: "draft",
        source_article_ids: sourceIds,
        source_articles: sourceArticles,
        market_brief: output.market_brief,
        week_start: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      errors.push(`Insert failed for ${article.city}: ${error.message}`);
      continue;
    }

    if (inserted) {
      articleIds.push(inserted.id);
      try {
        const imageUrl = await generateHeroImage(article.seo_headline, article.body, inserted.id);
        if (imageUrl) {
          await supabase
            .from("generated_articles")
            .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
            .eq("id", inserted.id);
        }
      } catch (imgErr) {
        const msg = imgErr instanceof Error ? imgErr.message : String(imgErr);
        errors.push(`Image generation failed for ${article.city}: ${msg}`);
      }
    }
  }

  return { articlesGenerated: articleIds.length, cities: [c1, c2], articleIds, errors };
}
