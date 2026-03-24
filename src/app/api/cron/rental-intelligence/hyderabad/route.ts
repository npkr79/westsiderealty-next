import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const HYDERABAD_SLUGS = [
  "neopolis", "kokapet", "tellapur", "gandipet", "financial-district", "gachibowli",
  "kondapur", "madhapur", "jubilee-hills", "banjara-hills", "hitech-city", "miyapur",
  "kompally", "mokila", "rajendra-nagar", "budwel", "osman-nagar", "gopanpally",
  "kollur", "manikonda", "puppalaguda", "beeramguda", "serilingampally", "raidurgam",
];

const isAuthorized = (request: NextRequest): boolean => {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return authHeader === `Bearer ${secret}`;
};

function parseJson<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function removeOutliers(prices: number[]): number[] {
  if (prices.length < 5) return prices;
  const sorted = [...prices].sort((a, b) => a - b);
  const trimCount = Math.max(1, Math.floor(sorted.length * 0.05));
  return sorted.slice(trimCount, sorted.length - trimCount);
}

function computeMedian(prices: number[]): number | null {
  if (prices.length === 0) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

type BhkKey = "2bhk" | "3bhk" | "4bhk";
type FurnishingKey = "unfurnished" | "semi_furnished" | "furnished";

interface RentStats {
  min: number | null;
  max: number | null;
  median: number | null;
  count: number;
}

interface ApifyListing {
  min_price?: number | string;
  price?: number | string;
  bedroom_num?: string | number;
  furnish?: string | number;
  min_area_sqft?: number | string;
  area?: number | string;
  gated?: string;
  society_name?: string;
}

interface CommercialJson {
  office_grade_a: { min_psf: number | null; max_psf: number | null; median_psf: number | null };
  office_standard: { min_psf: number | null; max_psf: number | null; median_psf: number | null };
  office_bare_shell: { min_psf: number | null; max_psf: number | null; median_psf: number | null };
  sources: string[];
}

function furnishCodeToKey(code: string | number | undefined): FurnishingKey {
  const c = String(code ?? "");
  if (c === "1") return "furnished";
  if (c === "4") return "unfurnished";
  return "semi_furnished";
}

async function fetchApifyListings(slug: string, bhk: 2 | 3 | 4): Promise<ApifyListing[]> {
  const url99acres = `https://www.99acres.com/${bhk}-bhk-flats-for-rent-in-${slug}-hyderabad-ffid`;

  // Step 1 — Start the run
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/stealth_mode~99acres-property-search-scraper/runs?token=${process.env.APIFY_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [url99acres],
        max_items_per_url: 50,
        ignore_url_failures: true,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"],
          apifyProxyCountry: "IN",
        },
      }),
    },
  );
  const runData = await runResponse.json() as { data?: { id?: string; defaultDatasetId?: string; status?: string } };
  const runId = runData?.data?.id;
  if (!runId) {
    console.log(`[rental-intel] apify no run ID, response was:`, JSON.stringify(runData).slice(0, 300));
    return [];
  }

  console.log(`[rental-intel] apify run started:`, runId);

  // Step 2 — Poll until finished (max 60 seconds)
  let status = "RUNNING";
  let attempts = 0;
  while (status === "RUNNING" || status === "READY") {
    await new Promise((r) => setTimeout(r, 3000));
    attempts++;
    if (attempts > 20) throw new Error(`Apify timeout after 60s for ${slug} ${bhk}bhk`);

    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${process.env.APIFY_API_TOKEN}`,
    );
    const statusData = await statusRes.json() as { data?: { status?: string } };
    status = statusData?.data?.status ?? "FAILED";
    console.log(`[rental-intel] apify run status:`, status, "attempt:", attempts);
  }

  // Step 3 — Fetch results
  const datasetId = runData?.data?.defaultDatasetId;
  const resultsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_API_TOKEN}`,
  );
  const listings = await resultsRes.json() as ApifyListing[];
  console.log(`[rental-intel] apify listings count:`, listings?.length);
  return Array.isArray(listings) ? listings : [];
}

const BHK_CAPS: Record<BhkKey, number> = { "2bhk": 150000, "3bhk": 200000, "4bhk": 300000 };

async function scrapeResidentialData(slug: string): Promise<{
  bhk_types: Record<BhkKey, { all: RentStats }>;
  sample_counts: Record<BhkKey, number>;
} | null> {
  const [listings2, listings3, listings4] = await Promise.all([
    fetchApifyListings(slug, 2),
    fetchApifyListings(slug, 3),
    fetchApifyListings(slug, 4),
  ]);

  const bhkListingsMap: Record<BhkKey, ApifyListing[]> = {
    "2bhk": listings2,
    "3bhk": listings3,
    "4bhk": listings4,
  };

  // Group prices by BHK only — all furnishings combined, gated only, valid price
  const groups: Record<BhkKey, number[]> = { "2bhk": [], "3bhk": [], "4bhk": [] };
  const BHK_KEYS: BhkKey[] = ["2bhk", "3bhk", "4bhk"];

  // Log sample raw prices for debugging
  console.log(`[rental-intel] sample prices ${slug} 3bhk:`,
    listings3.slice(0, 3).map(l => l.min_price));

  for (const bhk of BHK_KEYS) {
    for (const listing of bhkListingsMap[bhk]) {
      const rawPrice = listing.min_price ?? listing.price ?? "0";
      const price = parseInt(String(rawPrice).replace(/[^0-9]/g, ""), 10);
      if (listing.gated !== "Y" || price <= 0 || price > 500000) continue;
      groups[bhk].push(price);
    }
  }

  // Build result — apply outlier removal then hard BHK cap
  const bhk_types = {} as Record<BhkKey, { all: RentStats }>;
  const sample_counts = {} as Record<BhkKey, number>;

  for (const bhk of BHK_KEYS) {
    sample_counts[bhk] = groups[bhk].length;
    const prices = removeOutliers(groups[bhk]).filter(p => p <= BHK_CAPS[bhk]);
    const sorted = [...prices].sort((a, b) => a - b);
    const medianRent = computeMedian(prices);
    console.log(`[rental-intel] apify ${slug} ${bhk} — listings: ${bhkListingsMap[bhk].length} gated: ${sample_counts[bhk]} median rent: ${medianRent ?? "null"}`);
    bhk_types[bhk] = {
      all: {
        min: sorted.length > 0 ? sorted[0] : null,
        max: sorted.length > 0 ? sorted[sorted.length - 1] : null,
        median: medianRent,
        count: prices.length,
      },
    };
  }

  return { bhk_types, sample_counts };
}

async function fetchCommercialData(marketName: string, slug: string): Promise<CommercialJson | null> {
  const prompt = `Research current commercial office rental rates in ${marketName}, Hyderabad as of ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "office_grade_a": { "min_psf": <number|null>, "max_psf": <number|null>, "median_psf": <number|null> },
  "office_standard": { "min_psf": <number|null>, "max_psf": <number|null>, "median_psf": <number|null> },
  "office_bare_shell": { "min_psf": <number|null>, "max_psf": <number|null>, "median_psf": <number|null> },
  "sources": ["<url1>", "<url2>"]
}

All rates are per sqft per month in INR. If no commercial office space exists in this market, use null for all psf values.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-search-preview-2025-03-11",
      web_search_options: {},
      messages: [
        { role: "system", content: "You are a real estate data analyst. Return ONLY valid JSON, no markdown, no explanation." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    console.error(`[rental-intel] OpenAI commercial error for ${slug}: ${res.status} ${await res.text().catch(() => "")}`);
    return null;
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const commercialRaw = data?.choices?.[0]?.message?.content ?? null;
  const commercialJson = commercialRaw ? parseJson<CommercialJson>(commercialRaw) : null;
  console.log(`[rental-intel] commercial parsed for ${slug}:`, JSON.stringify(commercialJson).slice(0, 200));
  return commercialJson;
}

async function fetchClaudeResidentialVerdict(
  marketName: string,
  threeBhkSemiMedian: number,
  rentPsf3bhk: number,
  grossYield: number,
): Promise<string | null> {
  const totalReturn = grossYield + 8.0;
  const impliedMonthlyRent = Math.round(rentPsf3bhk * 1800);
  const prompt = `You are a senior real estate investment analyst at Westside Realty, Hyderabad. Write a practical 4-5 sentence investor verdict for ${marketName} based on this data.

Rental data (gated community apartments only):
3BHK rent per sqft: ₹${rentPsf3bhk.toFixed(0)}/sqft/month (semi-furnished)
Standard 3BHK size: 1800 sqft
Implied monthly rent for 1800 sqft flat: ₹${impliedMonthlyRent.toLocaleString("en-IN")}/month
3BHK semi-furnished median rent (actual): ₹${threeBhkSemiMedian.toLocaleString("en-IN")}/month
Purchase price benchmark: ₹13,000/sqft = ₹2.34Cr for 1800 sqft
Gross rental yield: ${grossYield.toFixed(1)}%
Estimated annual appreciation: 8% (Hyderabad western corridor avg)
Total estimated annual return: ${totalReturn.toFixed(1)}%
FD benchmark: 7%

Your verdict must:
1. Lead with the total return story (yield + appreciation combined), not just yield alone
2. Mention that rental rates quoted are for fully gated communities only — open plots and standalone buildings command 20-30% less
3. Note that furnished apartments command 40-60% premium but have higher vacancy risk
4. Compare total return (yield + appreciation) vs FD rate of 7%
5. Give one honest caveat about the market

Write in plain conversational English. No bullet points. Under 100 words.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error(`[rental-intel] Claude residential verdict error for ${marketName}: ${res.status}`);
    return null;
  }

  const data = await res.json() as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text?.trim() ?? null;
}

async function fetchClaudeCommercialVerdict(
  marketName: string,
  commercialJson: CommercialJson | null,
): Promise<string | null> {
  const gradeA = commercialJson?.office_grade_a;
  const standard = commercialJson?.office_standard;
  const prompt = `You are a senior real estate investment analyst at Westside Realty, Hyderabad. Write a practical 4-5 sentence investor verdict for commercial office space in ${marketName}.

Commercial rental data:
Grade A: ₹${gradeA?.min_psf ?? "N/A"}–${gradeA?.max_psf ?? "N/A"}/sqft/month
Standard: ₹${standard?.min_psf ?? "N/A"}–${standard?.max_psf ?? "N/A"}/sqft/month

Typical commercial property price in this market: ₹12,000–15,000/sqft
Calculate gross yield = (monthly_rent_psf × 12) / purchase_price_psf × 100
Use Grade A median psf for yield calculation.

Your verdict must:
1. State the gross yield for Grade A commercial
2. Compare to residential yield and FD rate
3. Mention typical lease terms (3-5 years, locked in) as advantage
4. Note minimum investment size (typically 2000+ sqft = ₹2.4Cr+)
5. One honest risk

Write in plain conversational English. No bullet points. Under 100 words.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error(`[rental-intel] Claude commercial verdict error for ${marketName}: ${res.status}`);
    return null;
  }

  const data = await res.json() as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text?.trim() ?? null;
}

async function processMarket(
  slug: string,
  supabase: ReturnType<typeof createServiceClient>,
  dataMonth: string,
  dataPeriod: string,
): Promise<{ residentialRows: number; commercialRows: number; verdictGenerated: boolean }> {
  const { data: mmRow } = await supabase
    .from("micro_markets")
    .select("id, micro_market_name, cities!inner(url_slug)")
    .eq("url_slug", slug)
    .eq("cities.url_slug" as never, "hyderabad")
    .maybeSingle();

  if (!mmRow) {
    console.warn(`[rental-intel] micro_market not found for slug: ${slug}`);
    return { residentialRows: 0, commercialRows: 0, verdictGenerated: false };
  }

  const micro_market_id = mmRow.id as string;
  const marketName = (mmRow.micro_market_name as string) ?? slug;

  let residentialRowsWritten = 0;
  let commercialRowsWritten = 0;

  // Fetch residential (Apify) and commercial (OpenAI) in parallel
  const [scrapedData, commercialJson] = await Promise.all([
    scrapeResidentialData(slug),
    fetchCommercialData(marketName, slug),
  ]);

  // Build residential upsert rows (3 rows: one per BHK, furnishing_type = 'all')
  const bhkTypes = ["2bhk", "3bhk", "4bhk"] as const;
  const residentialUpsertRows: Record<string, unknown>[] = [];

  for (const bhk of bhkTypes) {
    const stats = scrapedData?.bhk_types?.[bhk]?.all;
    residentialUpsertRows.push({
      micro_market_id,
      city_slug: "hyderabad",
      property_type: bhk,
      furnishing_type: "all",
      rent_min: stats?.min ?? null,
      rent_max: stats?.max ?? null,
      rent_median: stats?.median ?? null,
      rent_psf_min: null,
      rent_psf_max: null,
      sample_count: stats?.count ?? null,
      source_urls: null,
      ai_observations: null,
      data_month: dataMonth,
    });
  }

  const { error: resErr } = await supabase
    .from("rental_market_data" as never)
    .upsert(residentialUpsertRows as never[], { onConflict: "micro_market_id,property_type,furnishing_type,data_month" });

  if (resErr) {
    console.error(`[rental-intel] residential upsert error for ${slug}:`, resErr.message);
  } else {
    residentialRowsWritten = residentialUpsertRows.length;
  }

  // Build commercial upsert rows (3 rows) — delete-then-insert (furnishing_type is null)
  const commercialGrades = [
    { key: "office_grade_a" as const, type: "office_grade_a" },
    { key: "office_standard" as const, type: "office_standard" },
    { key: "office_bare_shell" as const, type: "office_bare_shell" },
  ];
  const commercialUpsertRows: Record<string, unknown>[] = commercialGrades.map(({ key, type }) => {
    const grade = commercialJson?.[key];
    return {
      micro_market_id,
      city_slug: "hyderabad",
      property_type: type,
      furnishing_type: null,
      rent_min: null,
      rent_max: null,
      rent_median: null,
      rent_psf_min: grade?.min_psf ?? null,
      rent_psf_max: grade?.max_psf ?? null,
      sample_count: null,
      source_urls: commercialJson?.sources ?? null,
      ai_observations: null,
      data_month: dataMonth,
    };
  });

  const { error: comDelErr } = await supabase
    .from("rental_market_data" as never)
    .delete()
    .eq("micro_market_id" as never, micro_market_id)
    .eq("data_month" as never, dataMonth)
    .in("property_type" as never, ["office_grade_a", "office_standard", "office_bare_shell"]);

  if (comDelErr) console.error(`[rental-intel] commercial delete error for ${slug}:`, comDelErr.message);

  const { error: comErr } = await supabase
    .from("rental_market_data" as never)
    .insert(commercialUpsertRows as never[]);

  if (comErr) {
    console.error(`[rental-intel] commercial insert error for ${slug}:`, comErr.message);
  } else {
    commercialRowsWritten = commercialUpsertRows.length;
  }

  // Yield calculation — rent-per-sqft methodology, 3BHK benchmark
  const STD_SIZES = { "2bhk": 1100, "3bhk": 1800, "4bhk": 2200 } as const;
  const PURCHASE_PSF = { "2bhk": 12000, "3bhk": 13000, "4bhk": 14000 } as const;

  const threeBhkMedian = scrapedData?.bhk_types?.["3bhk"]?.all?.median ?? null;
  const rentPsf3bhk = threeBhkMedian != null ? threeBhkMedian / STD_SIZES["3bhk"] : null;
  const grossYield = rentPsf3bhk != null ? (rentPsf3bhk * 12) / PURCHASE_PSF["3bhk"] * 100 : 0;
  const totalReturn = grossYield > 0 ? grossYield + 8.0 : 0;
  const vs_fd_rate = grossYield > 0 ? (grossYield + 8.0) - 7.0 : null;
  const highlight_stat = grossYield > 0 && rentPsf3bhk != null
    ? `₹${rentPsf3bhk.toFixed(0)}/sqft/mo → ${grossYield.toFixed(1)}% yield + 8% appreciation = ~${totalReturn.toFixed(1)}% total return`
    : null;

  // Claude verdicts (residential + commercial in parallel)
  const [residentialVerdict, commercialVerdict] = await Promise.all([
    threeBhkMedian != null && rentPsf3bhk != null
      ? fetchClaudeResidentialVerdict(marketName, threeBhkMedian, rentPsf3bhk, grossYield)
      : Promise.resolve(null),
    fetchClaudeCommercialVerdict(marketName, commercialJson),
  ]);
  console.log(`[rental-intel] commercial verdict for ${slug}:`, commercialVerdict?.slice(0, 100));

  // Upsert to micro_market_rental_intelligence
  const { error: intelErr } = await supabase
    .from("micro_market_rental_intelligence" as never)
    .upsert([
      {
        micro_market_id,
        city_slug: "hyderabad",
        intelligence_type: "residential",
        yield_data: scrapedData ?? {},
        ai_verdict: residentialVerdict,
        vs_fd_rate,
        vs_city_avg: null,
        highlight_stat,
        data_period: dataPeriod,
        generated_at: new Date().toISOString(),
      },
      {
        micro_market_id,
        city_slug: "hyderabad",
        intelligence_type: "commercial",
        yield_data: commercialJson ?? {},
        ai_verdict: commercialVerdict,
        vs_fd_rate: null,
        vs_city_avg: null,
        highlight_stat: null,
        data_period: dataPeriod,
        generated_at: new Date().toISOString(),
      },
    ] as never[], { onConflict: "micro_market_id,intelligence_type,data_period" });

  if (intelErr) console.error(`[rental-intel] intelligence upsert error for ${slug}:`, intelErr.message);

  return {
    residentialRows: residentialRowsWritten,
    commercialRows: commercialRowsWritten,
    verdictGenerated: residentialVerdict != null || commercialVerdict != null,
  };
}

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const run_id = new Date().toISOString();
  const supabase = createServiceClient();

  const { searchParams } = request.nextUrl;
  const slugsParam = searchParams.get("slugs");
  const targetSlugs = slugsParam
    ? slugsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : HYDERABAD_SLUGS;

  const now = new Date();
  const dataMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split("T")[0];
  const dataPeriod = now.toLocaleString("en-US", { month: "short", year: "numeric" });

  console.log(`[rental-intel] starting run ${run_id} — ${targetSlugs.length} markets, period=${dataPeriod}, source=apify_99acres`);

  const markets_failed: string[] = [];
  let residential_rows_upserted = 0;
  let commercial_rows_upserted = 0;
  let verdicts_generated = 0;
  let markets_processed = 0;

  // Process in chunks of 3 with 2s delay between batches
  const chunks = chunkArray(targetSlugs, 3);
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 2000));

    const results = await Promise.all(
      chunks[i].map(async (slug) => {
        try {
          const result = await processMarket(slug, supabase, dataMonth, dataPeriod);
          return { slug, ...result, failed: false };
        } catch (err) {
          console.error(`[rental-intel] FAILED ${slug}:`, err);
          return { slug, residentialRows: 0, commercialRows: 0, verdictGenerated: false, failed: true };
        }
      }),
    );

    for (const r of results) {
      if (r.failed) {
        markets_failed.push(r.slug);
      } else {
        markets_processed++;
        residential_rows_upserted += r.residentialRows;
        commercial_rows_upserted += r.commercialRows;
        if (r.verdictGenerated) verdicts_generated++;
      }
    }
  }

  const duration_ms = Date.now() - start;
  console.log(`[rental-intel] run complete — processed=${markets_processed} failed=${markets_failed.length} duration=${duration_ms}ms`);

  return NextResponse.json({
    run_id,
    markets_processed,
    markets_failed,
    residential_rows_upserted,
    commercial_rows_upserted,
    verdicts_generated,
    duration_ms,
    data_source: "apify_99acres",
  });
}
