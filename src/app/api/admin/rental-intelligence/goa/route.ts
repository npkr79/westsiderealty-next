import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { GOA_MARKETS, processMarket } from "@/app/api/cron/rental-intelligence/goa/route";

const allowedRoles = new Set(["admin"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { test_market?: string };
    const { test_market } = body;

    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    const dataQuarter = `${now.getFullYear()}-Q${q}`;

    const markets = test_market
      ? GOA_MARKETS.filter(m => m.slug === test_market)
      : GOA_MARKETS;

    if (markets.length === 0) {
      return NextResponse.json({ error: `Unknown market slug: ${test_market}` }, { status: 400 });
    }

    const results = { success: 0, failed: 0 };

    for (const market of markets) {
      if (markets.length > 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
      try {
        const { ok } = await processMarket(market, dataQuarter);
        if (ok) results.success++; else results.failed++;
      } catch (err) {
        console.error(`[goa-rental-admin] ✗ ${market.slug}:`, err);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      quarter: dataQuarter,
      markets_requested: markets.map(m => m.slug),
      results,
      processed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[goa-rental-admin] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
