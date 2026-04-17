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

// ─── 4. PageSpeed + Core Web Vitals (with Google's exact thresholds) ─────────

// Google's official CWV thresholds
const CWV_THRESHOLDS = {
  lcp:  { good: 2500,  poor: 4000  }, // ms
  inp:  { good: 200,   poor: 500   }, // ms (replaces FID)
  cls:  { good: 0.1,   poor: 0.25  }, // unitless
  fcp:  { good: 1800,  poor: 3000  }, // ms
  ttfb: { good: 800,   poor: 1800  }, // ms
};

function cwvStatus(value, metric) {
  const t = CWV_THRESHOLDS[metric];
  if (!t || value == null) return "unknown";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

function parseMsDisplay(display) {
  // "2.3 s" → 2300, "450 ms" → 450, "0.12" → 120 (CLS special case)
  if (!display) return null;
  const clean = display.trim();
  if (/^\d+(\.\d+)?\s*s$/i.test(clean)) return parseFloat(clean) * 1000;
  if (/^\d+(\.\d+)?\s*ms$/i.test(clean)) return parseFloat(clean);
  if (/^\d+\.\d+$/.test(clean)) return parseFloat(clean); // CLS
  return null;
}

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
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${PAGESPEED_KEY}&category=performance&category=seo&category=accessibility`;
      const res = await fetch(apiUrl);
      if (!res.ok) {
        results.push({ url, error: `HTTP ${res.status}` });
        continue;
      }
      const data = await res.json();
      const audits = data.lighthouseResult?.audits || {};

      const perf = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100);
      const seo  = Math.round((data.lighthouseResult?.categories?.seo?.score ?? 0) * 100);
      const a11y = Math.round((data.lighthouseResult?.categories?.accessibility?.score ?? 0) * 100);

      // Extract raw CWV values
      const lcpMs   = parseMsDisplay(audits["largest-contentful-paint"]?.displayValue);
      const clsVal  = parseMsDisplay(audits["cumulative-layout-shift"]?.displayValue);
      const inpMs   = parseMsDisplay(audits["experimental-interaction-to-next-paint"]?.displayValue)
                   ?? parseMsDisplay(audits["max-potential-fid"]?.displayValue);
      const fcpMs   = parseMsDisplay(audits["first-contentful-paint"]?.displayValue);
      const ttfbMs  = parseMsDisplay(audits["server-response-time"]?.displayValue);

      const cwv = {
        lcp:  { value: lcpMs,  display: audits["largest-contentful-paint"]?.displayValue ?? "n/a",  status: cwvStatus(lcpMs, "lcp"),  threshold: "Good <2.5s" },
        cls:  { value: clsVal, display: audits["cumulative-layout-shift"]?.displayValue ?? "n/a",   status: cwvStatus(clsVal, "cls"),  threshold: "Good <0.1" },
        inp:  { value: inpMs,  display: audits["experimental-interaction-to-next-paint"]?.displayValue ?? "n/a", status: cwvStatus(inpMs, "inp"), threshold: "Good <200ms" },
        fcp:  { value: fcpMs,  display: audits["first-contentful-paint"]?.displayValue ?? "n/a",   status: cwvStatus(fcpMs, "fcp"),  threshold: "Good <1.8s" },
        ttfb: { value: ttfbMs, display: audits["server-response-time"]?.displayValue ?? "n/a",     status: cwvStatus(ttfbMs, "ttfb"), threshold: "Good <800ms" },
      };

      const cwvFailing = Object.entries(cwv)
        .filter(([, v]) => v.status === "poor" || v.status === "needs-improvement")
        .map(([k, v]) => `${k.toUpperCase()}: ${v.display} (${v.status})`);

      const issues = [
        perf < 60 ? `Low performance: ${perf}/100` : null,
        seo  < 85 ? `Low SEO score: ${seo}/100` : null,
        ...cwvFailing,
      ].filter(Boolean);

      results.push({
        url,
        performance: perf,
        seo,
        accessibility: a11y,
        cwv,
        issue: issues.length > 0 ? issues.join("; ") : null,
        status: issues.length > 0 ? "fail" : "ok",
      });
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
  let sitemapUrls = [];
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
      // Extract URLs for crawl error checks (sample up to 30)
      const matches = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      sitemapUrls = matches.slice(0, 30);
    }
  } catch (e) {
    issues.push({ issue: `Sitemap fetch failed: ${e.message}` });
  }
  return { issues, sitemapUrls };
}

// ─── 7. Crawl Error Detection (sample sitemap URLs) ──────────────────────────

async function checkCrawlErrors(sitemapUrls) {
  const errors = [];
  if (!sitemapUrls || sitemapUrls.length === 0) return errors;

  console.error(`[audit] Checking ${sitemapUrls.length} sitemap URLs for crawl errors...`);

  for (const url of sitemapUrls) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": "Westside-SEO-Audit/1.0" },
        signal: AbortSignal.timeout(8000),
        redirect: "manual",
      });

      if (res.status === 404) {
        errors.push({ url, status: 404, type: "not-found", severity: "high", issue: `404 Not Found in sitemap` });
      } else if (res.status === 410) {
        errors.push({ url, status: 410, type: "gone", severity: "medium", issue: `410 Gone — confirm intentional` });
      } else if (res.status >= 500) {
        errors.push({ url, status: res.status, type: "server-error", severity: "critical", issue: `${res.status} Server Error` });
      } else if (res.status >= 301 && res.status <= 308) {
        const location = res.headers.get("location") || "";
        errors.push({ url, status: res.status, type: "redirect", severity: "medium", issue: `Redirect in sitemap → ${location}` });
      }
    } catch (e) {
      errors.push({ url, status: null, type: "timeout", severity: "medium", issue: `Fetch failed: ${e.message}` });
    }
    await new Promise(r => setTimeout(r, 200));
  }

  if (errors.length === 0) {
    console.error("[audit] Crawl check: no errors in sampled sitemap URLs");
  } else {
    console.error(`[audit] Crawl check: ${errors.length} issue(s) in sampled URLs`);
  }
  return errors;
}

// ─── 8. Infrastructure Checks (robots.txt, HTTPS redirect, www redirect) ─────

async function checkInfrastructure() {
  const results = {};

  // robots.txt
  try {
    const res = await fetch(`${BASE_URL}/robots.txt`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      results.robotsTxt = { status: "fail", issue: `robots.txt returned HTTP ${res.status}` };
    } else {
      const text = await res.text();
      const hasDisallowAll = /^Disallow:\s*\/\s*$/m.test(text);
      const hasSitemap = /Sitemap:/i.test(text);
      results.robotsTxt = {
        status: hasDisallowAll ? "fail" : "ok",
        hasSitemapRef: hasSitemap,
        issue: hasDisallowAll ? "robots.txt blocks all crawlers (Disallow: /)" : null,
      };
    }
  } catch (e) {
    results.robotsTxt = { status: "fail", issue: `robots.txt fetch failed: ${e.message}` };
  }

  // HTTP → HTTPS redirect
  const httpUrl = BASE_URL.replace("https://", "http://");
  try {
    const res = await fetch(httpUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
      redirect: "manual",
    });
    if (res.status >= 301 && res.status <= 308) {
      const loc = res.headers.get("location") || "";
      results.httpsRedirect = {
        status: loc.startsWith("https://") ? "ok" : "fail",
        issue: !loc.startsWith("https://") ? `HTTP redirects to ${loc} instead of HTTPS` : null,
      };
    } else {
      results.httpsRedirect = {
        status: "fail",
        issue: `HTTP URL returns ${res.status} instead of redirecting to HTTPS`,
      };
    }
  } catch {
    results.httpsRedirect = { status: "skip", issue: null }; // likely blocked by firewall — not a failure
  }

  // www → canonical redirect
  const wwwUrl = BASE_URL.includes("://www.")
    ? BASE_URL.replace("://www.", "://")
    : BASE_URL.replace("://", "://www.");
  try {
    const res = await fetch(wwwUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000),
      redirect: "manual",
    });
    if (res.status >= 301 && res.status <= 308) {
      results.wwwRedirect = { status: "ok", issue: null };
    } else if (res.status === 200) {
      results.wwwRedirect = {
        status: "fail",
        issue: `Both www and non-www serve content — duplicate URL risk`,
      };
    } else {
      results.wwwRedirect = { status: "ok", issue: null };
    }
  } catch {
    results.wwwRedirect = { status: "skip", issue: null };
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.error("[audit] Starting SEO audit...");

  const [isrViolations, missingCanonicals, missingKeywords, pageSpeed, vercel500s, sitemapResult, infrastructure] = await Promise.all([
    Promise.resolve(findISRViolations()),
    Promise.resolve(findMissingCanonicals()),
    Promise.resolve(findMissingKeywords()),
    checkPageSpeed(),
    checkVercel500s(),
    checkSitemap(),
    checkInfrastructure(),
  ]);

  const sitemapIssues = sitemapResult.issues;
  const crawlErrors = await checkCrawlErrors(sitemapResult.sitemapUrls);

  // CWV summary: count pages with poor/needs-improvement metrics
  const cwvFailing = pageSpeed.filter(p => p.cwv && Object.values(p.cwv).some(v => v.status !== "good" && v.status !== "unknown")).length;

  // Infrastructure issues
  const infraIssues = Object.values(infrastructure).filter(v => v.status === "fail").length;

  const findings = {
    timestamp: new Date().toISOString(),
    summary: {
      isrViolations: isrViolations.length,
      missingCanonicals: missingCanonicals.length,
      missingKeywords: missingKeywords.length,
      pageSpeedIssues: pageSpeed.filter(p => p.status === "fail").length,
      cwvFailing,
      vercel500Paths: vercel500s.length,
      sitemapIssues: sitemapIssues.length,
      crawlErrors: crawlErrors.filter(e => e.type !== "redirect").length,
      crawlRedirects: crawlErrors.filter(e => e.type === "redirect").length,
      infraIssues,
    },
    isrViolations,
    missingCanonicals,
    missingKeywords,
    pageSpeed,
    vercel500s,
    sitemapIssues,
    crawlErrors,
    infrastructure,
  };

  const totalIssues = Object.values(findings.summary).reduce((a, b) => a + b, 0);
  console.error(`[audit] Done. Found ${totalIssues} total issues.`);
  console.error("[audit] Summary:", JSON.stringify(findings.summary, null, 2));

  // Output findings as JSON to stdout (consumed by fix.mjs and agent.mjs)
  console.log(JSON.stringify(findings, null, 2));

  // Exit 1 if there are auto-fixable issues (ISR + canonicals + keywords)
  const autoFixable = isrViolations.length + missingCanonicals.length + missingKeywords.length;
  process.exit(autoFixable > 0 ? 1 : 0);
}

main().catch(e => {
  console.error("[audit] Fatal error:", e);
  process.exit(2);
});
