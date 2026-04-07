/**
 * SEO Audit Script — westsiderealty.in
 *
 * Runs the following checks:
 *  1. ISR violations  — pages with `revalidate` that still use cookie-based createClient()
 *  2. Missing canonical — public pages with generateMetadata but no alternates.canonical
 *  3. Missing keywords  — generateMetadata calls with no keywords field
 *  4. PageSpeed scores  — calls Google PageSpeed Insights API on key URLs
 *  5. Vercel 500 errors — queries Vercel API for 500s in the last 7 days
 *
 * Outputs a JSON findings object to stdout.
 * Exit code 0 = no issues, 1 = issues found.
 *
 * Usage:
 *   node scripts/seo-audit/audit.mjs
 *   PAGESPEED_API_KEY=xxx VERCEL_TOKEN=xxx VERCEL_PROJECT_ID=xxx VERCEL_TEAM_ID=xxx node scripts/seo-audit/audit.mjs
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE_URL = "https://www.westsiderealty.in";
const SRC_DIR = path.resolve("src/app");
const PAGESPEED_KEY = process.env.PAGESPEED_API_KEY || "";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || "prj_KQuJgWs1m8ARaMzZ7tGv1dMEa3n5";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || "team_CtEO7DHy9bOzA7xzcAVOEsov";

// ─── 1. ISR Violations ────────────────────────────────────────────────────────

function findISRViolations() {
  const violations = [];
  try {
    // Find all page.tsx files under src/app (not inside api/, dashboard/, crm/, etc.)
    const result = execSync(
      `grep -rln "supabase/server" "${SRC_DIR}" --include="page.tsx" --include="route.ts"`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();

    if (!result) return violations;

    for (const filePath of result.split("\n").filter(Boolean)) {
      // Skip protected/API routes
      if (/\/(api|dashboard|crm|admin|auth|pipeline|routing|tasks|whatsapp|journeys|settings|leads)\//.test(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf8");
      const hasRevalidate = /export const revalidate\s*=/.test(content);
      const hasCookieClient = /createClient\s*\(\s*\)/.test(content) ||
                               /await createClient\b/.test(content) ||
                               /import.*createClient.*supabase\/server/.test(content);

      if (hasRevalidate && hasCookieClient) {
        violations.push({
          file: filePath.replace(process.cwd() + "/", ""),
          issue: "ISR page uses cookie-based createClient() — causes 500 on revalidation",
          fix: "Replace createClient() with createServiceClient() from @/lib/supabase/serviceClient",
        });
      }
    }
  } catch {
    // grep returns exit 1 when no matches — that's fine
  }
  return violations;
}

// ─── 2. Missing Canonical Tags ────────────────────────────────────────────────

function findMissingCanonicals() {
  const missing = [];
  try {
    // Find pages that export metadata/generateMetadata but don't have canonical
    const result = execSync(
      `grep -rln "generateMetadata\\|export const metadata" "${SRC_DIR}" --include="page.tsx" --include="layout.tsx"`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();

    if (!result) return missing;

    for (const filePath of result.split("\n").filter(Boolean)) {
      // Skip protected routes and very dynamic pages
      if (/\/(dashboard|crm|admin|auth|pipeline|routing|tasks|whatsapp|journeys|settings|leads)\//.test(filePath)) continue;

      const content = fs.readFileSync(filePath, "utf8");
      const hasCanonical = /canonical|alternates/.test(content);
      const hasMetadata = /generateMetadata|export const metadata/.test(content);

      if (hasMetadata && !hasCanonical) {
        missing.push({
          file: filePath.replace(process.cwd() + "/", ""),
          issue: "Page exports metadata but has no canonical URL (alternates.canonical)",
          fix: "Add alternates: { canonical: 'https://www.westsiderealty.in/...' } to metadata",
        });
      }
    }
  } catch { /* no matches */ }
  return missing;
}

// ─── 3. Missing Keywords ──────────────────────────────────────────────────────

function findMissingKeywords() {
  const missing = [];
  // Only check the highest-traffic page types
  const keyPages = [
    "src/app/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/developers/page.tsx",
    "src/app/commercial-investments/page.tsx",
  ];

  for (const rel of keyPages) {
    const filePath = path.resolve(rel);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");
    const hasMetadata = /generateMetadata|export const metadata/.test(content);
    const hasKeywords = /keywords\s*:/.test(content);

    if (hasMetadata && !hasKeywords) {
      missing.push({
        file: rel,
        issue: "High-traffic page has metadata but no keywords field",
        fix: "Add keywords: 'relevant, comma, separated, keywords' to metadata",
      });
    }
  }
  return missing;
}

// ─── 4. PageSpeed Scores ──────────────────────────────────────────────────────

async function checkPageSpeed() {
  const results = [];
  if (!PAGESPEED_KEY) {
    console.error("[audit] PAGESPEED_API_KEY not set — skipping PageSpeed checks");
    return results;
  }

  const KEY_URLS = [
    `${BASE_URL}/`,
    `${BASE_URL}/hyderabad`,
    `${BASE_URL}/goa`,
    `${BASE_URL}/hyderabad/kokapet`,
    `${BASE_URL}/hyderabad/projects`,
  ];

  for (const url of KEY_URLS) {
    try {
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${PAGESPEED_KEY}&category=performance&category=seo`;
      const res = await fetch(apiUrl);
      if (!res.ok) {
        results.push({ url, error: `HTTP ${res.status}` });
        continue;
      }
      const data = await res.json();
      const perf = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
      const seo = Math.round((data.lighthouseResult?.categories?.seo?.score ?? 0) * 100);
      const lcp = data.lighthouseResult?.audits?.["largest-contentful-paint"]?.displayValue ?? "n/a";
      const cls = data.lighthouseResult?.audits?.["cumulative-layout-shift"]?.displayValue ?? "n/a";

      if (perf < 60 || seo < 85) {
        results.push({
          url,
          performance: perf,
          seo,
          lcp,
          cls,
          issue: [
            perf < 60 ? `Low performance score: ${perf}/100` : null,
            seo < 85 ? `Low SEO score: ${seo}/100` : null,
          ].filter(Boolean).join("; "),
        });
      } else {
        results.push({ url, performance: perf, seo, lcp, cls, status: "ok" });
      }
    } catch (e) {
      results.push({ url, error: String(e) });
    }
    // Rate limit: PageSpeed API allows ~25 req/100s on free tier
    await new Promise(r => setTimeout(r, 2000));
  }
  return results;
}

// ─── 5. Vercel 500 Errors ─────────────────────────────────────────────────────

async function checkVercel500s() {
  if (!VERCEL_TOKEN) {
    console.error("[audit] VERCEL_TOKEN not set — skipping Vercel 500 check");
    return [];
  }

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://api.vercel.com/v2/deployments/${VERCEL_PROJECT_ID}/events?teamId=${VERCEL_TEAM_ID}&limit=50&statusCode=500&since=${encodeURIComponent(since)}`;

    // Use Vercel runtime logs endpoint instead
    const logsUrl = `https://api.vercel.com/v1/projects/${VERCEL_PROJECT_ID}/logs?teamId=${VERCEL_TEAM_ID}&limit=100&statusCode=500`;
    const res = await fetch(logsUrl, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const logs = Array.isArray(data) ? data : (data.logs ?? []);

    // Group 500s by path
    const pathCounts = {};
    for (const log of logs) {
      const p = log.path || log.url || "unknown";
      pathCounts[p] = (pathCounts[p] || 0) + 1;
    }

    return Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({
        path,
        count,
        issue: `${count} 500 error(s) on ${path} in the last 7 days`,
      }));
  } catch (e) {
    console.error("[audit] Vercel log check failed:", e);
    return [];
  }
}

// ─── 6. Sitemap Validity ──────────────────────────────────────────────────────

async function checkSitemap() {
  const issues = [];
  try {
    const res = await fetch(`${BASE_URL}/sitemap.xml`, {
      headers: { "User-Agent": "Westside-SEO-Audit/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      issues.push({ issue: `Sitemap returned HTTP ${res.status}` });
    } else {
      const text = await res.text();
      const urlCount = (text.match(/<url>/g) || []).length;
      if (urlCount < 100) {
        issues.push({ issue: `Sitemap has only ${urlCount} URLs — expected 100+. Possible generation failure.` });
      } else {
        console.error(`[audit] Sitemap OK — ${urlCount} URLs`);
      }
    }
  } catch (e) {
    issues.push({ issue: `Sitemap fetch failed: ${e.message}` });
  }
  return issues;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.error("[audit] Starting SEO audit...");

  const [isrViolations, missingCanonicals, missingKeywords, pageSpeed, vercel500s, sitemapIssues] = await Promise.all([
    Promise.resolve(findISRViolations()),
    Promise.resolve(findMissingCanonicals()),
    Promise.resolve(findMissingKeywords()),
    checkPageSpeed(),
    checkVercel500s(),
    checkSitemap(),
  ]);

  const findings = {
    timestamp: new Date().toISOString(),
    summary: {
      isrViolations: isrViolations.length,
      missingCanonicals: missingCanonicals.length,
      missingKeywords: missingKeywords.length,
      pageSpeedIssues: pageSpeed.filter(p => p.issue).length,
      vercel500Paths: vercel500s.length,
      sitemapIssues: sitemapIssues.length,
    },
    isrViolations,
    missingCanonicals,
    missingKeywords,
    pageSpeed,
    vercel500s,
    sitemapIssues,
  };

  const totalIssues = Object.values(findings.summary).reduce((a, b) => a + b, 0);
  console.error(`[audit] Done. Found ${totalIssues} total issues.`);
  console.error("[audit] Summary:", JSON.stringify(findings.summary, null, 2));

  // Output findings as JSON to stdout (consumed by fix.mjs)
  console.log(JSON.stringify(findings, null, 2));

  // Exit 1 if there are auto-fixable issues (ISR + canonicals + keywords)
  const autoFixable = isrViolations.length + missingCanonicals.length + missingKeywords.length;
  process.exit(autoFixable > 0 ? 1 : 0);
}

main().catch(e => {
  console.error("[audit] Fatal error:", e);
  process.exit(2);
});
