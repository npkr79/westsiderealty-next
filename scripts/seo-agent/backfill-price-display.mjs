/**
 * Phase 2A — Backfill price_display_string from micro-market price band.
 *
 * Many "missing_price" audit hits have null min_price/max_price but the
 * project's micro_market does have price_per_sqft_min/max. This script
 * sets `price_display_string` to a per-sqft band so the page shows useful
 * pricing instead of "Contact for details".
 *
 * Audit rows are NOT marked resolved — project-specific min_price is still
 * unknown. This is a UX/SEO improvement, not an audit fix.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seo-agent/backfill-price-display.mjs
 *   node --env-file=.env.local scripts/seo-agent/backfill-price-display.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? Number(process.argv[LIMIT_IDX + 1]) : null;

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

function fmtINR(n) {
  return Number(n).toLocaleString("en-IN");
}

function buildPriceString(min, max) {
  if (!min) return null;
  if (max && max > min) return `₹${fmtINR(min)}–₹${fmtINR(max)} / sqft`;
  return `From ₹${fmtINR(min)} / sqft`;
}

async function main() {
  console.log(`[backfill-price-display] dry_run=${DRY_RUN} limit=${LIMIT ?? "none"}`);

  const { data: openIssues, error: issErr } = await supabase
    .from("seo_content_quality")
    .select("id, entity_id")
    .eq("issue_type", "missing_price")
    .is("resolved_at", null);
  if (issErr) {
    console.error("audit fetch error:", issErr.message);
    process.exit(1);
  }
  console.log(`[2A] open missing_price audit rows: ${openIssues.length}`);

  const projectIds = openIssues.map((r) => r.entity_id);
  if (!projectIds.length) return;

  // Fetch projects + their micro-market band
  const CHUNK = 100;
  const projects = [];
  for (let i = 0; i < projectIds.length; i += CHUNK) {
    const chunk = projectIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("projects")
      .select("id, project_name, min_price, max_price, price_display_string, micro_market_id")
      .in("id", chunk);
    if (error) {
      console.error("projects fetch error:", error.message);
      process.exit(1);
    }
    projects.push(...(data || []));
  }

  const mmIds = [...new Set(projects.map((p) => p.micro_market_id).filter(Boolean))];
  const { data: mms, error: mmErr } = await supabase
    .from("micro_markets")
    .select("id, micro_market_name, price_per_sqft_min, price_per_sqft_max")
    .in("id", mmIds);
  if (mmErr) {
    console.error("micro_markets fetch error:", mmErr.message);
    process.exit(1);
  }
  const mmById = new Map(mms.map((m) => [m.id, m]));

  // Build candidate updates
  const candidates = [];
  for (const p of projects) {
    if (p.price_display_string && p.price_display_string.trim()) continue;
    if (!p.micro_market_id) continue;
    const mm = mmById.get(p.micro_market_id);
    if (!mm || !mm.price_per_sqft_min) continue;
    const str = buildPriceString(mm.price_per_sqft_min, mm.price_per_sqft_max);
    if (!str) continue;
    candidates.push({ id: p.id, name: p.project_name, str });
  }
  console.log(`[2A] backfill candidates: ${candidates.length}`);

  const toApply = LIMIT ? candidates.slice(0, LIMIT) : candidates;
  console.log(`[2A] will apply: ${toApply.length}${DRY_RUN ? " (dry-run)" : ""}`);

  if (DRY_RUN) {
    for (const c of toApply.slice(0, 5)) {
      console.log(`  ${c.name}: ${c.str}`);
    }
    return;
  }

  let applied = 0;
  for (const c of toApply) {
    const { error: upErr } = await supabase
      .from("projects")
      .update({ price_display_string: c.str })
      .eq("id", c.id);
    if (upErr) {
      console.error(`update error for ${c.name}:`, upErr.message);
      continue;
    }
    applied++;
  }
  console.log(`[2A] projects updated: ${applied}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
