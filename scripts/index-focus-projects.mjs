/**
 * Submit all active focus project pages to Google Indexing API.
 *
 * Fetches project slugs directly from Supabase — no manual input needed.
 *
 * Run after deploying schema/metadata improvements:
 *   node --env-file=.env.local scripts/index-focus-projects.mjs
 */

import { requestIndexing } from "./seo-agent/indexing-api.mjs";

const SITE_URL = process.env.GOOGLE_SITE_URL || "https://www.westsiderealty.in";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getFocusProjectSlugs() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/advisor_project_intelligence?select=project_slug,listing_url_slug,city_slug&is_focus_project=eq.true&sale_status=eq.active`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${err}`);
  }

  return res.json();
}

async function main() {
  console.log("Fetching active focus projects from Supabase...");

  const projects = await getFocusProjectSlugs();
  console.log(`Found ${projects.length} active focus project(s)`);

  const urls = new Set([`${SITE_URL}/portfolio`]);

  for (const p of projects) {
    // Portfolio detail page (always exists)
    urls.add(`${SITE_URL}/portfolio/${p.project_slug}`);

    // Also index the main project listing page if linked
    if (p.listing_url_slug && p.city_slug) {
      urls.add(`${SITE_URL}/${p.city_slug}/projects/${p.listing_url_slug}`);
    }
  }

  const urlList = [...urls];
  console.log(`Submitting ${urlList.length} URL(s) to Google Indexing API:\n`);
  urlList.forEach((u) => console.log(`  ${u}`));
  console.log("");

  const results = await requestIndexing(urlList);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ ${succeeded}/${urlList.length} submitted successfully`);
  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    failed.forEach((r) => console.log(`  ${r.url} — ${r.error}`));
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
