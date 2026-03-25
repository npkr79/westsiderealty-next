import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import {
  fetchMarketSummary,
  fetchMarketADR,
  fetchMarketOccupancy,
} from "@/services/airroiService";

// GOA ONLY — do not add other cities here
export const GOA_MARKETS = [
  { slug: "assagao",    name: "Assagao",    district: "Assagao",    locality: "North Goa" },
  { slug: "siolim",     name: "Siolim",     district: "Siolim",     locality: "North Goa" },
  { slug: "anjuna",     name: "Anjuna",     district: "Anjuna",     locality: "North Goa" },
  { slug: "vagator",    name: "Vagator",    district: "Vagator",    locality: "North Goa" },
  { slug: "morjim",     name: "Morjim",     district: "Morjim",     locality: "North Goa" },
  { slug: "mandrem",    name: "Mandrem",    district: "Mandrem",    locality: "North Goa" },
  { slug: "candolim",   name: "Candolim",   district: "Candolim",   locality: "North Goa" },
  { slug: "calangute",  name: "Calangute",  district: "Calangute",  locality: "North Goa" },
  { slug: "baga",       name: "Baga",       district: "Baga",       locality: "North Goa" },
  { slug: "parra",      name: "Parra",      district: "Parra",      locality: "North Goa" },
  { slug: "mapusa",     name: "Mapusa",     district: "Mapusa",     locality: "North Goa" },
  { slug: "porvorim",   name: "Porvorim",   district: "Porvorim",   locality: "North Goa" },
  { slug: "arpora",     name: "Arpora",     district: "Arpora",     locality: "North Goa" },
  { slug: "moira",      name: "Moira",      district: "Moira",      locality: "North Goa" },
  { slug: "aldona",     name: "Aldona",     district: "Aldona",     locality: "North Goa" },
  { slug: "saligao",    name: "Saligao",    district: "Saligao",    locality: "North Goa" },
  { slug: "reis-magos", name: "Reis Magos", district: "Reis Magos", locality: "North Goa" },
  { slug: "panjim",     name: "Panjim",     district: "Panaji",     locality: "North Goa" },
  { slug: "colva",      name: "Colva",      district: "Colva",      locality: "South Goa" },
  { slug: "benaulim",   name: "Benaulim",   district: "Benaulim",   locality: "South Goa" },
  { slug: "palolem",    name: "Palolem",    district: "Palolem",    locality: "South Goa" },
  { slug: "agonda",     name: "Agonda",     district: "Agonda",     locality: "South Goa" },
  { slug: "cavelossim", name: "Cavelossim", district: "Cavelossim", locality: "South Goa" },
  { slug: "majorda",    name: "Majorda",    district: "Majorda",    locality: "South Goa" },
];

const PEAK_MONTHS = [11, 12, 1, 2];
const SHOULDER_MONTHS = [3, 10];
const ASSUMED_PROPERTY_VALUE_INR = 20_000_000;

function avg(rows: Array<{ avg: number }>): number {
  return rows.reduce((s, r) => s + r.avg, 0) / rows.length;
}

function monthOf(dateStr: string): number {
  return new Date(dateStr).getMonth() + 1;
}

interface AirRoiRow { date: string; avg: number }

export async function processMarket(
  market: (typeof GOA_MARKETS)[number],
  dataQuarter: string
) {
  const supabase = createServiceClient();

  const [summaryResult, adrData, occupancyData] = await Promise.all([
    fetchMarketSummary(market.district, market.locality),
    fetchMarketADR(market.district, market.locality),
    fetchMarketOccupancy(market.district, market.locality),
  ]);

  if (!summaryResult) {
    await supabase.from("goa_str_market_data" as never).upsert({
      micro_market_slug: market.slug,
      micro_market_name: market.name,
      airroi_district: market.district,
      data_quarter: dataQuarter,
      fetch_error: "No data returned from AirROI",
    } as never, { onConflict: "micro_market_slug,data_quarter" } as never);
    return { ok: false };
  }

  const summary = summaryResult.data as Record<string, number | null>;

  // Seasonality from ADR timeseries
  let peakADR = null, shoulderADR = null, offseasonADR = null;
  let peakOcc = null, offseasonOcc = null;

  if (adrData && adrData.length > 0) {
    const rows = adrData as AirRoiRow[];
    const peakRows    = rows.filter(r => PEAK_MONTHS.includes(monthOf(r.date)));
    const shoulderRows = rows.filter(r => SHOULDER_MONTHS.includes(monthOf(r.date)));
    const offRows     = rows.filter(r => !PEAK_MONTHS.includes(monthOf(r.date)) && !SHOULDER_MONTHS.includes(monthOf(r.date)));

    if (peakRows.length)    peakADR      = parseFloat(avg(peakRows).toFixed(2));
    if (shoulderRows.length) shoulderADR = parseFloat(avg(shoulderRows).toFixed(2));
    if (offRows.length)     offseasonADR = parseFloat(avg(offRows).toFixed(2));
  }

  if (occupancyData && occupancyData.length > 0) {
    const rows = occupancyData as AirRoiRow[];
    const peakOccRows = rows.filter(r => PEAK_MONTHS.includes(monthOf(r.date)));
    const offOccRows  = rows.filter(r => !PEAK_MONTHS.includes(monthOf(r.date)) && !SHOULDER_MONTHS.includes(monthOf(r.date)));

    if (peakOccRows.length) peakOcc      = parseFloat((avg(peakOccRows) * 100).toFixed(2));
    if (offOccRows.length)  offseasonOcc = parseFloat((avg(offOccRows) * 100).toFixed(2));
  }

  const ttmOccupancy = parseFloat(((summary.ttm_occupancy ?? 0) * 100).toFixed(2));
  const ttmADR       = summary.ttm_avg_rate ?? null;
  const ttmRevpar    = summary.ttm_revpar ?? null;
  const ttmRevenue   = summary.ttm_revenue ?? null;
  const activeListings = summary.active_listings ?? null;

  const grossYield = ttmRevpar
    ? parseFloat(((ttmRevpar * 365) / ASSUMED_PROPERTY_VALUE_INR * 100).toFixed(2))
    : null;

  await supabase.from("goa_str_market_data" as never).upsert({
    micro_market_slug:          market.slug,
    micro_market_name:          market.name,
    airroi_district:            market.district,
    ttm_avg_daily_rate_inr:     ttmADR,
    ttm_occupancy_pct:          ttmOccupancy,
    ttm_revpar_inr:             ttmRevpar,
    ttm_revenue_inr:            ttmRevenue,
    active_listings_count:      activeListings,
    peak_season_adr_inr:        peakADR,
    shoulder_season_adr_inr:    shoulderADR,
    offseason_adr_inr:          offseasonADR,
    peak_season_occupancy_pct:  peakOcc,
    offseason_occupancy_pct:    offseasonOcc,
    gross_yield_estimate_pct:   grossYield,
    raw_summary:                summary,
    raw_adr_timeseries:         adrData,
    raw_occupancy_timeseries:   occupancyData,
    data_quarter:               dataQuarter,
    api_fallback_level:         summaryResult.fallbackLevel,
    fetch_error:                null,
  } as never, { onConflict: "micro_market_slug,data_quarter" } as never);

  console.log(`[goa-rental] ✓ ${market.name} — ADR: ₹${ttmADR}, Occ: ${ttmOccupancy.toFixed(1)}%`);
  return { ok: true };
}

function currentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

const isAuthorized = (request: NextRequest): boolean => {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return authHeader === `Bearer ${secret}`;
};

async function handler(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dataQuarter = currentQuarter();
  const results = { success: 0, failed: 0 };

  for (const market of GOA_MARKETS) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const { ok } = await processMarket(market, dataQuarter);
      if (ok) results.success++; else results.failed++;
    } catch (err) {
      console.error(`[goa-rental] ✗ ${market.name}:`, err);
      results.failed++;
    }
  }

  return NextResponse.json({
    success: true,
    quarter: dataQuarter,
    results,
    processed_at: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
