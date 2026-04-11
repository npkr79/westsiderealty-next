/**
 * One-time script: Request immediate Google indexing for all active focus project pages.
 *
 * Run once after deploying the new schema/metadata improvements to portfolio pages:
 *   node --env-file=.env.local scripts/index-focus-projects.mjs
 */

import { requestIndexing } from "./seo-agent/indexing-api.mjs";

const SITE_URL = "https://www.westsiderealty.in";

// Hardcoded focus project slugs — update this list as your portfolio changes,
// or swap for a Supabase query if you want to automate it fully.
// Run: SELECT project_slug FROM advisor_project_intelligence WHERE is_focus_project=true AND sale_status='active';
const FOCUS_PROJECT_SLUGS = [
  // Add your active focus project slugs here — from the /portfolio page
  // e.g. "rajapushpa-atria-kokapet", "pws-7-hills", etc.
  // You can get these from: https://www.westsiderealty.in/portfolio
];

async function main() {
  if (FOCUS_PROJECT_SLUGS.length === 0) {
    console.log("No slugs listed. Add your focus project slugs to FOCUS_PROJECT_SLUGS array.");
    console.log("Get them from: https://www.westsiderealty.in/portfolio");
    process.exit(0);
  }

  const urls = [
    `${SITE_URL}/portfolio`,
    ...FOCUS_PROJECT_SLUGS.map((slug) => `${SITE_URL}/portfolio/${slug}`),
  ];

  console.log(`Submitting ${urls.length} URLs to Google Indexing API...`);
  const results = await requestIndexing(urls);

  const succeeded = results.filter((r) => r.success).length;
  console.log(`\nDone: ${succeeded}/${results.length} submitted successfully.`);

  for (const r of results.filter((r) => !r.success)) {
    console.log(`  ❌ Failed: ${r.url} — ${r.error}`);
  }
}

main().catch(console.error);
