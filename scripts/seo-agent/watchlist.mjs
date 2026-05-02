/**
 * Watchlist — westsiderealty.in SEO Agent
 *
 * Tracks which page templates recently had metadata changes.
 * When a template is watchlisted, the weekly health check applies a
 * tighter alert threshold (10% impression drop instead of 25%) for
 * the three weeks following the change.
 *
 * Why: a bulk title rewrite across 100+ pages looks fine in normal
 * thresholds until it's too late. Watchlisting catches the early signal.
 *
 * Supabase table required:
 *   CREATE TABLE seo_watchlist (
 *     template   TEXT PRIMARY KEY,
 *     added_at   DATE NOT NULL,
 *     reason     TEXT,
 *     expires_at DATE NOT NULL
 *   );
 *
 * Required env vars:
 *   SUPABASE_URL  (= NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

function makeClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[watchlist] WARNING: Supabase env vars not set — watchlist disabled");
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Map source files → template names (matches ctr-audit.mjs classifyUrl output)
const METADATA_FILES = {
  "src/app/page.tsx": "homepage",
  "src/app/[citySlug]/page.tsx": "city-hub",
  "src/app/[citySlug]/[microMarketSlug]/page.tsx": "micro-market",
  "src/app/[citySlug]/[microMarketSlug]/[category]/page.tsx": "micro-market-category",
  "src/app/[citySlug]/projects/[projectSlug]/page.tsx": "project-detail",
  "src/app/[citySlug]/projects/page.tsx": "city-projects-index",
  "src/app/homes/[slug]/page.tsx": "smart-link",
  "src/app/insights/[slug]/page.tsx": "insight-article",
  "src/app/developers/[slug]/page.tsx": "developer",
  "src/app/hyderabad/buy/[listingSlug]/page.tsx": "property-listing",
};

/**
 * Inspect the latest git commit for changes to generateMetadata files.
 * Returns an array of { file, template } for each affected template.
 *
 * Run after code fixes are committed — compares HEAD~1 to HEAD.
 */
export function detectChangedTemplates() {
  try {
    const diff = execSync(
      "git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD 2>/dev/null",
      { encoding: "utf8" }
    );
    const changedFiles = diff.trim().split("\n").filter(Boolean);
    const affected = [];
    for (const file of changedFiles) {
      const template = METADATA_FILES[file];
      if (template) affected.push({ file, template });
    }
    return affected;
  } catch {
    return [];
  }
}

/**
 * Add templates to the watchlist. Each entry auto-expires in 3 weeks.
 *
 * @param {string[]} templates - template names to watchlist
 * @param {string}   reason    - human-readable reason (logged in DB)
 * @returns {Promise<number>}  - number of rows upserted
 */
export async function addToWatchlist(templates, reason = "metadata change detected") {
  const supabase = makeClient();
  if (!supabase || templates.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const expiry = new Date();
  expiry.setUTCDate(expiry.getUTCDate() + 21); // 3 weeks
  const expiresAt = expiry.toISOString().slice(0, 10);

  const rows = templates.map(t => ({
    template: t,
    added_at: today,
    reason,
    expires_at: expiresAt,
  }));

  const { error } = await supabase
    .from("seo_watchlist")
    .upsert(rows, { onConflict: "template" });

  if (error) {
    console.error("[watchlist] Upsert error:", error.message);
    return 0;
  }

  console.error(`[watchlist] Watchlisted: ${templates.join(", ")} (expires ${expiresAt})`);
  return rows.length;
}

/**
 * Return currently active watchlist entries (not yet expired).
 *
 * @returns {Promise<Array<{ template, added_at, reason, expires_at }>>}
 */
export async function getWatchlist() {
  const supabase = makeClient();
  if (!supabase) return [];

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("seo_watchlist")
    .select("template, added_at, reason, expires_at")
    .gte("expires_at", today)
    .order("added_at", { ascending: false });

  if (error) {
    console.error("[watchlist] Query error:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Detect changed templates from git and watchlist them automatically.
 * Called from agent Phase 1b after code fixes are applied.
 *
 * @returns {Promise<number>} - templates added to watchlist
 */
export async function autoUpdateWatchlist() {
  const changed = detectChangedTemplates();
  if (changed.length === 0) {
    console.error("[watchlist] No metadata file changes in last commit");
    return 0;
  }
  const templates = [...new Set(changed.map(c => c.template))];
  const reason = `Metadata changed in: ${changed.map(c => c.file).join(", ")}`;
  return addToWatchlist(templates, reason);
}
