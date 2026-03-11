import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const revalidate = 300;

export interface TickerMarket {
  name: string;
  slug: string;
  pricePerSqft: number | null;
  maturity: string | null;
  entryTiming: string | null;
}

export async function GET(request: NextRequest) {
  const citySlug = request.nextUrl.searchParams.get("citySlug") ?? "hyderabad";

  try {
    const supabase = createServiceClient();

    const { data: markets } = await supabase
      .from("micro_markets")
      .select("id, micro_market_name, url_slug, price_per_sqft_min")
      .eq("city_slug", citySlug)
      .not("url_slug", "is", null)
      .limit(20);

    if (!markets?.length) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
      });
    }

    const ids = markets.map((m) => m.id);

    const { data: enrichment } = await supabase
      .from("micro_market_ai_enrichment" as never)
      .select("micro_market_id, market_maturity, entry_timing, price_per_sqft_current")
      .in("micro_market_id", ids) as { data: Array<{ micro_market_id: string; market_maturity: string | null; entry_timing: string | null; price_per_sqft_current: number | null }> | null };

    const enrichMap = new Map(
      (enrichment ?? []).map((e) => [e.micro_market_id, e])
    );

    const result: TickerMarket[] = markets
      .filter((m) => m.url_slug && m.micro_market_name)
      .map((m) => {
        const enrich = enrichMap.get(m.id);
        return {
          name: m.micro_market_name,
          slug: m.url_slug,
          pricePerSqft: enrich?.price_per_sqft_current ?? m.price_per_sqft_min ?? null,
          maturity: enrich?.market_maturity ?? null,
          entryTiming: enrich?.entry_timing ?? null,
        };
      });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[ticker-markets]", err);
    return NextResponse.json([], { status: 500 });
  }
}
