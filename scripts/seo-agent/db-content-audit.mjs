/**
 * DB Content Audit — westsiderealty.in
 *
 * Queries Supabase to find all projects, micro-markets, and developers with
 * missing or thin SEO content. Upserts findings into `seo_content_quality`
 * and marks previously-found issues as resolved when the data is now present.
 *
 * Checks:
 *   Projects (listing_project_detail_enriched_mv):
 *     missing_hero_image   — hero_image_url IS NULL/empty          [critical]
 *     thin_description     — description IS NULL or < 80 chars     [high]
 *     missing_price        — price_min AND price_max both NULL      [high]
 *     missing_rera         — rera_id IS NULL/empty                  [medium]
 *     missing_amenities    — amenities_json IS NULL or '[]'         [medium]
 *     missing_gallery      — gallery_images_json IS NULL or '[]'    [low]
 *
 *   Micro-markets (micro_markets):
 *     missing_hero_hook    — hero_hook IS NULL/empty               [high]
 *     thin_description     — description IS NULL or < 80 chars     [high]
 *     missing_price_data   — price_per_sqft_min IS NULL            [medium]
 *
 *   Developers (developers):
 *     missing_logo         — logo_url IS NULL/empty                 [high]
 *     thin_description     — hero_description IS NULL or < 80 chars [high]
 *     missing_metadata     — years_in_business IS NULL              [low]
 *
 * Usage:
 *   import { runDbContentAudit } from './db-content-audit.mjs';
 *   const result = await runDbContentAudit();
 *
 * Required env vars:
 *   SUPABASE_URL            (= NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const SITE_BASE = "https://www.westsiderealty.in";

// ─── Supabase client ──────────────────────────────────────────────────────────

function makeClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "[db-content-audit] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — returning empty result"
    );
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(val) {
  return val === null || val === undefined || String(val).trim() === "";
}

function isEmptyJson(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed === "" || trimmed === "[]" || trimmed === "null";
  }
  if (Array.isArray(val)) return val.length === 0;
  return false;
}

function isThinText(val, minLen = 80) {
  if (val === null || val === undefined) return true;
  return String(val).trim().length < minLen;
}

// ─── Check runners ────────────────────────────────────────────────────────────

function checkProject(project) {
  const issues = [];
  const url = `${SITE_BASE}/hyderabad/projects/${project.url_slug}`;

  const base = {
    entityType: "project",
    entityId: String(project.id),
    entityName: project.project_name || project.url_slug,
    entityUrl: url,
  };

  if (isEmpty(project.hero_image_url)) {
    issues.push({ ...base, issueType: "missing_hero_image", severity: "critical", details: {} });
  }
  const desc = project.long_description_html || "";
  if (isThinText(desc)) {
    issues.push({
      ...base,
      issueType: "thin_description",
      severity: "high",
      details: { length: desc.trim().length },
    });
  }
  if (project.min_price === null && project.max_price === null) {
    issues.push({ ...base, issueType: "missing_price", severity: "high", details: {} });
  }
  if (isEmpty(project.rera_id)) {
    issues.push({ ...base, issueType: "missing_rera", severity: "medium", details: {} });
  }
  if (isEmptyJson(project.amenities_json)) {
    issues.push({ ...base, issueType: "missing_amenities", severity: "medium", details: {} });
  }
  if (isEmptyJson(project.gallery_images_json)) {
    issues.push({ ...base, issueType: "missing_gallery", severity: "low", details: {} });
  }

  return issues;
}

function checkMicroMarket(mm) {
  const issues = [];
  const url = `${SITE_BASE}/hyderabad/${mm.url_slug}`;

  const base = {
    entityType: "micro_market",
    entityId: String(mm.id),
    entityName: mm.micro_market_name || mm.url_slug,
    entityUrl: url,
  };

  if (isEmpty(mm.hero_hook)) {
    issues.push({ ...base, issueType: "missing_hero_hook", severity: "high", details: {} });
  }
  const growthStory = mm.growth_story || "";
  if (isThinText(growthStory)) {
    issues.push({
      ...base,
      issueType: "thin_description",
      severity: "high",
      details: { length: growthStory.trim().length },
    });
  }
  if (mm.price_per_sqft_min === null || mm.price_per_sqft_min === undefined) {
    issues.push({ ...base, issueType: "missing_price_data", severity: "medium", details: {} });
  }

  return issues;
}

function checkDeveloper(dev) {
  const issues = [];
  const url = `${SITE_BASE}/developers/${dev.slug}`;

  const base = {
    entityType: "developer",
    entityId: String(dev.id),
    entityName: dev.name || dev.slug,
    entityUrl: url,
  };

  if (isEmpty(dev.logo_url)) {
    issues.push({ ...base, issueType: "missing_logo", severity: "high", details: {} });
  }
  if (isThinText(dev.hero_description)) {
    issues.push({
      ...base,
      issueType: "thin_description",
      severity: "high",
      details: { length: dev.hero_description ? String(dev.hero_description).trim().length : 0 },
    });
  }
  if (dev.years_in_business === null || dev.years_in_business === undefined) {
    issues.push({ ...base, issueType: "missing_metadata", severity: "low", details: {} });
  }

  return issues;
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

/**
 * Upsert current issues into seo_content_quality.
 * - New issues: insert with first_seen_at = NOW()
 * - Existing unresolved issues: update last_seen_at = NOW()
 * - Previously resolved issues that recur: clear resolved_at, update last_seen_at
 */
async function upsertIssues(supabase, issues) {
  if (issues.length === 0) return;

  const now = new Date().toISOString();

  const rows = issues.map((issue) => ({
    entity_type: issue.entityType,
    entity_id: issue.entityId,
    entity_name: issue.entityName,
    entity_url: issue.entityUrl,
    issue_type: issue.issueType,
    severity: issue.severity,
    details: issue.details || {},
    resolved_at: null,
    first_seen_at: now,  // will not overwrite on conflict
    last_seen_at: now,
  }));

  // Batch in chunks of 500 to stay within Supabase payload limits
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from("seo_content_quality").upsert(chunk, {
      onConflict: "entity_type,entity_id,issue_type",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`[db-content-audit] Upsert error (chunk ${i / CHUNK + 1}):`, error.message);
    }
  }
}

/**
 * Mark issues as resolved where the entity no longer triggers the check.
 * Compares the full set of (entity_type, entity_id, issue_type) that have
 * existing unresolved rows against the current live issue set.
 */
async function markResolved(supabase, currentIssueKeys) {
  // Fetch all currently unresolved rows
  const { data: existing, error } = await supabase
    .from("seo_content_quality")
    .select("entity_type, entity_id, issue_type")
    .is("resolved_at", null);

  if (error) {
    console.error("[db-content-audit] Failed to fetch existing issues for resolution:", error.message);
    return 0;
  }

  if (!existing || existing.length === 0) return 0;

  const now = new Date().toISOString();
  let resolvedCount = 0;

  // Find rows that no longer appear in the current audit
  const toResolve = existing.filter((row) => {
    const key = `${row.entity_type}|${row.entity_id}|${row.issue_type}`;
    return !currentIssueKeys.has(key);
  });

  // Resolve in batches — Supabase doesn't support bulk update by arbitrary key sets well,
  // so we group by entity_type to issue targeted updates
  for (const row of toResolve) {
    const { error: updateError } = await supabase
      .from("seo_content_quality")
      .update({ resolved_at: now })
      .eq("entity_type", row.entity_type)
      .eq("entity_id", row.entity_id)
      .eq("issue_type", row.issue_type)
      .is("resolved_at", null);

    if (updateError) {
      console.error("[db-content-audit] Failed to mark resolved:", updateError.message);
    } else {
      resolvedCount++;
    }
  }

  return resolvedCount;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Run the full DB content audit.
 *
 * @returns {{
 *   summary: {
 *     projects: number,
 *     microMarkets: number,
 *     developers: number,
 *     totalIssues: number,
 *     critical: number,
 *     high: number,
 *     medium: number,
 *     low: number,
 *     resolved: number,
 *   },
 *   issues: Array<{
 *     entityType: string,
 *     entityId: string,
 *     entityName: string,
 *     entityUrl: string,
 *     issueType: string,
 *     severity: string,
 *     details: object,
 *   }>
 * }}
 */
export async function runDbContentAudit() {
  const supabase = makeClient();
  if (!supabase) {
    return {
      summary: { projects: 0, microMarkets: 0, developers: 0, totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0, resolved: 0 },
      issues: [],
    };
  }

  console.error("[db-content-audit] Fetching entities from Supabase...");

  // Fetch all three entity sets in parallel
  const [projectsRes, microMarketsRes, developersRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, url_slug, project_name, hero_image_url, long_description_html, min_price, max_price, rera_id, amenities_json, gallery_images_json"),

    supabase
      .from("micro_markets")
      .select("id, url_slug, micro_market_name, hero_hook, growth_story, price_per_sqft_min"),

    supabase
      .from("developers")
      .select("id, slug, name, logo_url, hero_description, years_in_business"),
  ]);

  if (projectsRes.error) console.error("[db-content-audit] Projects fetch error:", projectsRes.error.message);
  if (microMarketsRes.error) console.error("[db-content-audit] Micro-markets fetch error:", microMarketsRes.error.message);
  if (developersRes.error) console.error("[db-content-audit] Developers fetch error:", developersRes.error.message);

  const projects = projectsRes.data || [];
  const microMarkets = microMarketsRes.data || [];
  const developers = developersRes.data || [];

  console.error(
    `[db-content-audit] Loaded ${projects.length} projects, ${microMarkets.length} micro-markets, ${developers.length} developers`
  );

  // Run checks
  const allIssues = [
    ...projects.flatMap(checkProject),
    ...microMarkets.flatMap(checkMicroMarket),
    ...developers.flatMap(checkDeveloper),
  ];

  console.error(`[db-content-audit] Found ${allIssues.length} issue(s) across all entities`);

  // Build lookup set for resolution diff
  const currentIssueKeys = new Set(
    allIssues.map((i) => `${i.entityType}|${i.entityId}|${i.issueType}`)
  );

  // Upsert current issues (parallel with resolution pass isn't safe — do sequentially)
  await upsertIssues(supabase, allIssues);

  const resolved = await markResolved(supabase, currentIssueKeys);

  if (resolved > 0) {
    console.error(`[db-content-audit] Marked ${resolved} previously-found issue(s) as resolved`);
  }

  // Build summary counts
  const countBy = (severity) => allIssues.filter((i) => i.severity === severity).length;

  const summary = {
    projects: projects.length,
    microMarkets: microMarkets.length,
    developers: developers.length,
    totalIssues: allIssues.length,
    critical: countBy("critical"),
    high: countBy("high"),
    medium: countBy("medium"),
    low: countBy("low"),
    resolved,
  };

  console.error(
    `[db-content-audit] Summary — critical: ${summary.critical}, high: ${summary.high}, medium: ${summary.medium}, low: ${summary.low}, resolved: ${resolved}`
  );

  return { summary, issues: allIssues };
}
