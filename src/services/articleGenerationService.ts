import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// City definitions
// ---------------------------------------------------------------------------

const GUARANTEED_CITIES = ["hyderabad", "goa"] as const;

const ROTATING_CITIES = [
  "mumbai",
  "delhi_ncr",
  "bengaluru",
  "pune",
  "chennai",
  "kolkata",
  "ahmedabad",
  "kochi",
  "navi_mumbai_thane",
] as const;

const ALL_CITIES = [...GUARANTEED_CITIES, ...ROTATING_CITIES] as const;
type City = (typeof ALL_CITIES)[number];

const CITY_DISPLAY: Record<City, string> = {
  hyderabad: "Hyderabad",
  goa: "Goa",
  mumbai: "Mumbai",
  delhi_ncr: "Delhi NCR",
  bengaluru: "Bengaluru",
  pune: "Pune",
  chennai: "Chennai",
  kolkata: "Kolkata",
  ahmedabad: "Ahmedabad",
  kochi: "Kochi",
  navi_mumbai_thane: "Navi Mumbai / Thane",
};

// ---------------------------------------------------------------------------
// Week boundary helper (Monday 00:00 IST)
// ---------------------------------------------------------------------------

function getWeekStart(): Date {
  // IST offset: +5:30
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const day = nowIST.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(nowIST);
  monday.setUTCDate(nowIST.getUTCDate() - daysFromMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function weekStartISO(): string {
  return getWeekStart().toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/₹[\d,]+\s*\/?/g, "")      // remove ₹8,211/ price tokens
    .replace(/\d+(\.\d+)?%/g, "")        // remove percentage numbers
    .replace(/[^a-z0-9\s-]/g, "")        // remove remaining special chars
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// City rotation — pick today's 2 cities
// ---------------------------------------------------------------------------

async function pickTodayCities(supabase: SupabaseClient): Promise<[City, City]> {
  const weekStart = weekStartISO();

  // Fetch this week's articles to count city usage
  const { data: weekArticles } = await supabase
    .from("generated_articles")
    .select("city, tomorrow_suggestion, created_at")
    .gte("week_start", weekStart)
    .order("created_at", { ascending: false });

  const usageCount: Partial<Record<City, number>> = {};
  for (const a of weekArticles ?? []) {
    const c = a.city as City;
    usageCount[c] = (usageCount[c] ?? 0) + 1;
  }

  // Check yesterday's suggestion
  const yesterday = weekArticles?.find((a) => {
    const d = new Date(a.created_at);
    const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0] !== today.toISOString().split("T")[0];
  });
  const suggestion = yesterday?.tomorrow_suggestion as string[] | null;

  // Days remaining in week (including today)
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const dayOfWeek = nowIST.getUTCDay();
  const daysLeft = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // days incl today

  // How many articles this week already
  const articlesThisWeek = weekArticles?.length ?? 0;
  const articlesToGenerate = Math.min(daysLeft * 2, 14 - articlesThisWeek);
  if (articlesToGenerate <= 0) {
    // Fallback: start fresh with guaranteed cities
    return ["hyderabad", "goa"];
  }

  // Build candidate pool respecting weekly caps (max 2 per city)
  const available = ALL_CITIES.filter((c) => (usageCount[c] ?? 0) < 2);

  // Use yesterday's suggestion if valid
  if (suggestion?.length === 2) {
    const [c1, c2] = suggestion as City[];
    if (
      available.includes(c1) &&
      available.includes(c2) &&
      c1 !== c2
    ) {
      return [c1, c2];
    }
  }

  // Priority: guaranteed cities that haven't hit their minimum yet
  const guaranteed = GUARANTEED_CITIES.filter(
    (c) => (usageCount[c] ?? 0) < 2 && available.includes(c)
  );

  // Rotating cities not yet used this week first, then least used
  const rotating = [...ROTATING_CITIES]
    .filter((c) => available.includes(c))
    .sort((a, b) => (usageCount[a] ?? 0) - (usageCount[b] ?? 0));

  const pool = [...guaranteed, ...rotating];

  if (pool.length < 2) {
    // Edge case: fallback
    return ["hyderabad", "goa"];
  }

  return [pool[0], pool[1]];
}

// ---------------------------------------------------------------------------
// Fetch relevant news articles for a city from DB
// ---------------------------------------------------------------------------

interface NewsArticle {
  id: string;
  headline: string;
  summary: string | null;
  ai_summary: string | null;
  source_name: string;
  cities: string[];
  category: string;
  scraped_at: string;
}

async function getNewsForCity(
  supabase: SupabaseClient,
  city: City
): Promise<NewsArticle[]> {
  // Look back 7 days for relevant articles
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("news_articles")
    .select("id, headline, summary, ai_summary, source_name, cities, category, scraped_at")
    .gte("scraped_at", since)
    .gte("relevance_score", 6.0)
    .order("relevance_score", { ascending: false })
    .limit(50);

  const all = (data ?? []) as NewsArticle[];

  // Filter to city-tagged articles + national/general articles
  const cityTagged = all.filter((a) => a.cities?.includes(city));
  const general = all.filter(
    (a) => !a.cities?.length || a.cities.length === 0
  );

  // Return up to 8 city-specific + 4 general for context
  return [...cityTagged.slice(0, 8), ...general.slice(0, 4)];
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
  tomorrow_suggestion: [City, City];
}

async function generateWithClaude(
  city1: City,
  city2: City,
  news1: NewsArticle[],
  news2: NewsArticle[]
): Promise<RunOutput> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const formatNews = (articles: NewsArticle[], city: City) => {
    if (!articles.length) return `No recent tagged articles for ${CITY_DISPLAY[city]}. Use your knowledge of recent Indian real estate trends for this city.`;
    return articles
      .map((a) => `- [${a.source_name}] ${a.headline}${a.ai_summary ? `: ${a.ai_summary}` : ""}`)
      .join("\n");
  };

  const userPrompt = `Today produce 2 articles:
- Article 1: ${CITY_DISPLAY[city1]}
- Article 2: ${CITY_DISPLAY[city2]}

## Recent news for ${CITY_DISPLAY[city1]}:
${formatNews(news1, city1)}

## Recent news for ${CITY_DISPLAY[city2]}:
${formatNews(news2, city2)}

Return a single valid JSON object with this exact structure:
{
  "articles": [
    {
      "city": "${city1}",
      "micro_market": "<specific locality/corridor>",
      "seo_headline": "<max 60 chars, includes city or area name>",
      "meta_description": "<max 155 chars>",
      "body": "<400–600 word article in markdown>",
      "whatsapp_summary": "<max 160 chars, ready to paste>",
      "target_persona": "<which buyer type>",
      "drip_placement": "<Day-7|Day-14|Day-30|Day-45>"
    },
    {
      "city": "${city2}",
      "micro_market": "<specific locality/corridor>",
      "seo_headline": "<max 60 chars, includes city or area name>",
      "meta_description": "<max 155 chars>",
      "body": "<400–600 word article in markdown>",
      "whatsapp_summary": "<max 160 chars, ready to paste>",
      "target_persona": "<which buyer type>",
      "drip_placement": "<Day-7|Day-14|Day-30|Day-45>"
    }
  ],
  "market_brief": [
    "<bullet 1 — private intel for Praveen>",
    "<bullet 2>",
    "<bullet 3>",
    "<bullet 4>",
    "<bullet 5>"
  ],
  "tomorrow_suggestion": ["<city_slug_1>", "<city_slug_2>"]
}

tomorrow_suggestion must use these slugs: hyderabad, goa, mumbai, delhi_ncr, bengaluru, pune, chennai, kolkata, ahmedabad, kochi, navi_mumbai_thane
Ensure tomorrow's 2 cities are different from today's and maintain weekly rotation balance.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude did not return valid JSON");

  const parsed = JSON.parse(jsonMatch[0]) as RunOutput;
  return parsed;
}

// ---------------------------------------------------------------------------
// Hero image generation
// ---------------------------------------------------------------------------

const CITY_IMAGE_STYLE: Record<string, string> = {
  hyderabad: "modern luxury apartment towers, Hyderabad skyline, Financial District corridor, professional architectural photography, golden hour warm light",
  goa: "luxury beachfront villa, North Goa coastline, tropical lush greenery, premium holiday home, professional real estate photography, warm sunset light",
  mumbai: "premium high-rise residential tower, Mumbai skyline, sea-facing apartments, professional architectural photography, twilight blue hour",
  bengaluru: "modern tech-corridor apartment complex, Bengaluru, lush green surroundings, professional real estate photography, golden hour",
  pune: "luxury residential development, Pune hills backdrop, professional architectural photography, soft morning light",
  delhi_ncr: "premium high-rise apartments, Delhi NCR skyline, wide boulevard, professional real estate photography, golden hour",
  chennai: "upscale coastal apartment complex, Chennai, ECR beachside, professional architectural photography, warm light",
  kolkata: "premium riverside apartment complex, Kolkata, professional real estate photography, warm golden light",
  ahmedabad: "luxury gated residential community, Ahmedabad, modern architecture, professional real estate photography",
  kochi: "premium backwater-view villa, Kochi Kerala, lush tropical surroundings, professional real estate photography",
  navi_mumbai_thane: "modern premium apartment towers, Navi Mumbai, palm-lined boulevard, professional architectural photography, golden hour",
};

async function generateHeroImage(city: string, microMarket: string, headline: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn("[article-gen] OPENAI_API_KEY not set — skipping image generation");
    return null;
  }

  const cityStyle = CITY_IMAGE_STYLE[city] ?? "premium luxury residential development, India, professional real estate photography, golden hour";
  const prompt = `${cityStyle}, ${microMarket} area, no people, no text, no watermarks, photorealistic, high-end architectural magazine quality`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DALL-E error: ${err}`);
  }

  const data = await res.json();
  return (data.data?.[0]?.url as string) ?? null;
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

  // 1. Pick today's 2 cities
  const [city1, city2] = await pickTodayCities(supabase);
  console.log(`[article-gen] Today's cities: ${city1}, ${city2}`);

  // 2. Fetch relevant news for each city
  const [news1, news2] = await Promise.all([
    getNewsForCity(supabase, city1),
    getNewsForCity(supabase, city2),
  ]);

  // 3. Generate with Claude
  let output: RunOutput;
  try {
    output = await generateWithClaude(city1, city2, news1, news2);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Claude generation failed: ${msg}`);
  }

  // 4. Insert articles into DB
  const weekStart = weekStartISO();
  const articleIds: string[] = [];

  for (const article of output.articles) {
    // Collect source article IDs + metadata for this city
    const cityNews = article.city === city1 ? news1 : news2;
    const sourceIds = cityNews.map((n) => n.id);
    const sourceArticles = cityNews.map((n) => ({
      id: n.id,
      headline: n.headline,
      source_name: n.source_name,
      scraped_at: n.scraped_at,
    }));

    // ── Dedup check 1: same slug already exists (same story, different run) ──
    const slug = slugify(article.seo_headline);
    const { data: existingSlug } = await supabase
      .from("generated_articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existingSlug) {
      console.log(`[article-gen] Skipping duplicate slug "${slug}" for ${article.city}`);
      errors.push(`Skipped duplicate slug: ${slug}`);
      continue;
    }

    // ── Dedup check 2: already have 2 articles for this city this week ──
    const { count: weeklyCount } = await supabase
      .from("generated_articles")
      .select("id", { count: "exact", head: true })
      .eq("city", article.city)
      .eq("week_start", weekStart);
    if ((weeklyCount ?? 0) >= 2) {
      console.log(`[article-gen] Skipping ${article.city} — already ${weeklyCount} articles this week`);
      errors.push(`Skipped ${article.city}: weekly cap reached`);
      continue;
    }

    // Generate a temp id for the slug suffix, then insert
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
        tomorrow_suggestion: output.tomorrow_suggestion,
        week_start: weekStart,
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

      // Generate hero image via DALL-E 3
      try {
        const imageUrl = await generateHeroImage(article.city, article.micro_market, article.seo_headline);
        if (imageUrl) {
          await supabase
            .from("generated_articles")
            .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
            .eq("id", inserted.id);
        }
      } catch (imgErr) {
        const msg = imgErr instanceof Error ? imgErr.message : String(imgErr);
        errors.push(`Image generation failed for ${article.city}: ${msg}`);
        // Non-fatal — article is still inserted
      }
    }
  }

  return {
    articlesGenerated: articleIds.length,
    cities: [city1, city2],
    articleIds,
    errors,
  };
}
