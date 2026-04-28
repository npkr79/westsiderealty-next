/**
 * Phase 1A — Backfill long_description_html from existing review/overview columns.
 *
 * Many "thin_description" audit hits are false-thin: the page already renders
 * `project_overview_seo` and `westside_realty_review` (see ProjectPageV2:1088-1097),
 * but the audit checks `long_description_html`, which is empty.
 *
 * This script stitches the two existing fields into `long_description_html`,
 * then marks the audit row resolved. Pure column move — no LLM, no fabricated content.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seo-agent/backfill-long-description.mjs
 *   node --env-file=.env.local scripts/seo-agent/backfill-long-description.mjs --dry-run
 *   node --env-file=.env.local scripts/seo-agent/backfill-long-description.mjs --limit 10
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragraphize(text) {
  // Split on blank lines into paragraphs; preserve single line breaks as <br>.
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function buildHtml(overview, review) {
  const parts = [];
  if (overview && overview.trim().length >= 80) {
    parts.push(paragraphize(overview));
  }
  if (review && review.trim().length >= 200) {
    parts.push(`<h2>Westside Realty Expert Review</h2>`);
    parts.push(paragraphize(review));
  }
  return parts.join("\n");
}

async function main() {
  console.log(`[backfill-long-description] dry_run=${DRY_RUN} limit=${LIMIT ?? "none"}`);

  // 1) Pull thin-description audit rows, join project content
  const { data: openIssues, error: issErr } = await supabase
    .from("seo_content_quality")
    .select("id, entity_id, entity_name")
    .eq("issue_type", "thin_description")
    .eq("entity_type", "project")
    .is("resolved_at", null);
  if (issErr) {
    console.error("audit fetch error:", issErr.message);
    process.exit(1);
  }
  console.log(`[1A] open thin_description audit rows: ${openIssues.length}`);

  const projectIds = openIssues.map((r) => r.entity_id);
  if (!projectIds.length) {
    console.log("[1A] nothing to do.");
    return;
  }

  // 2) Pull project content fields. Process in chunks to avoid IN-list limits.
  const CHUNK = 100;
  const projects = [];
  for (let i = 0; i < projectIds.length; i += CHUNK) {
    const chunk = projectIds.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("projects")
      .select("id, project_name, long_description_html, project_overview_seo, westside_realty_review")
      .in("id", chunk);
    if (error) {
      console.error("projects fetch error:", error.message);
      process.exit(1);
    }
    projects.push(...(data || []));
  }
  console.log(`[1A] fetched ${projects.length} project rows`);

  // 3) Build candidate updates
  const candidates = [];
  for (const p of projects) {
    const existing = (p.long_description_html || "").trim();
    if (existing.length >= 200) continue; // already long enough
    const html = buildHtml(p.project_overview_seo, p.westside_realty_review);
    if (html.length < 200) continue; // not enough source content to qualify
    candidates.push({ id: p.id, name: p.project_name, html });
  }
  console.log(`[1A] backfill candidates: ${candidates.length}`);

  const toApply = LIMIT ? candidates.slice(0, LIMIT) : candidates;
  console.log(`[1A] will apply: ${toApply.length}${DRY_RUN ? " (dry-run)" : ""}`);

  if (DRY_RUN) {
    console.log("\nSample:");
    for (const c of toApply.slice(0, 3)) {
      console.log(`  ${c.name}: ${c.html.slice(0, 200)}...`);
    }
    return;
  }

  // 4) Apply updates in batches
  let applied = 0;
  for (const c of toApply) {
    const { error: upErr } = await supabase
      .from("projects")
      .update({ long_description_html: c.html })
      .eq("id", c.id);
    if (upErr) {
      console.error(`update error for ${c.name}:`, upErr.message);
      continue;
    }
    applied++;
  }
  console.log(`[1A] projects updated: ${applied}`);

  // 5) Mark resolved
  const appliedIds = toApply.map((c) => c.id);
  const issueIds = openIssues.filter((i) => appliedIds.includes(i.entity_id)).map((i) => i.id);
  if (issueIds.length) {
    const { error: resErr } = await supabase
      .from("seo_content_quality")
      .update({ resolved_at: new Date().toISOString() })
      .in("id", issueIds);
    if (resErr) console.error("audit resolve error:", resErr.message);
    else console.log(`[1A] audit rows resolved: ${issueIds.length}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
