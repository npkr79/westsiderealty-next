/**
 * On-Page SEO Audit — westsiderealty.in
 *
 * Fetches key pages and checks:
 *   1. H1 presence and count (missing or multiple)
 *   2. Title tag length (50-60 chars optimal)
 *   3. Meta description length (150-160 chars optimal)
 *   4. OG image presence (og:image tag)
 *   5. Images missing alt text
 *   6. Canonical tag presence
 *
 * Does not require API keys — fetches live pages directly.
 * Returns an array of on-page findings per page.
 */

const SITE_URL = process.env.GOOGLE_SITE_URL || "https://www.westsiderealty.in";

const KEY_PAGES = [
  { url: `${SITE_URL}/`,                                  label: "Homepage" },
  { url: `${SITE_URL}/hyderabad`,                         label: "City Hub — Hyderabad" },
  { url: `${SITE_URL}/hyderabad/projects`,                label: "Projects Index" },
  { url: `${SITE_URL}/hyderabad/kokapet`,                 label: "Micro-Market — Kokapet" },
  { url: `${SITE_URL}/hyderabad/narsingi`,                label: "Micro-Market — Narsingi" },
  { url: `${SITE_URL}/about`,                             label: "About" },
  { url: `${SITE_URL}/commercial`,                        label: "Commercial" },
  { url: `${SITE_URL}/opportunities`,                     label: "Opportunities" },
  { url: `${SITE_URL}/blog`,                              label: "Blog Index" },
];

function extractMeta(html, name) {
  // og: and twitter: tags
  const og = html.match(new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
           || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, "i"));
  if (og) return og[1];
  // name= tags
  const nm = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
           || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"));
  return nm ? nm[1] : null;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function countH1s(html) {
  return (html.match(/<h1[\s>]/gi) || []).length;
}

function countImgsWithoutAlt(html) {
  const imgTags = html.match(/<img[^>]+>/gi) || [];
  return imgTags.filter(tag => !/alt\s*=\s*["'][^"']+["']/i.test(tag)).length;
}

function hasCanonical(html) {
  return /<link[^>]+rel=["']canonical["'][^>]+href/i.test(html)
      || /<link[^>]+href[^>]+rel=["']canonical["']/i.test(html);
}

/**
 * Audit a single page's on-page signals.
 */
async function auditPage({ url, label }) {
  const findings = [];

  let html;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Westside-SEO-Audit/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      return [{ url, label, severity: "high", check: "fetch", issue: `Page returned HTTP ${res.status}` }];
    }
    html = await res.text();
  } catch (e) {
    return [{ url, label, severity: "medium", check: "fetch", issue: `Fetch failed: ${e.message}` }];
  }

  // Title tag
  const title = extractTitle(html);
  if (!title) {
    findings.push({ url, label, severity: "critical", check: "title", issue: "Missing <title> tag" });
  } else if (title.length < 30) {
    findings.push({ url, label, severity: "high", check: "title-short", issue: `Title too short: ${title.length} chars ("${title.slice(0, 60)}")` });
  } else if (title.length > 65) {
    findings.push({ url, label, severity: "medium", check: "title-long", issue: `Title too long: ${title.length} chars — will be truncated in SERP ("${title.slice(0, 65)}…")` });
  }

  // Meta description
  const metaDesc = extractMeta(html, "description");
  if (!metaDesc) {
    findings.push({ url, label, severity: "high", check: "meta-description", issue: "Missing meta description" });
  } else if (metaDesc.length < 100) {
    findings.push({ url, label, severity: "medium", check: "meta-description-short", issue: `Meta description too short: ${metaDesc.length} chars` });
  } else if (metaDesc.length > 165) {
    findings.push({ url, label, severity: "medium", check: "meta-description-long", issue: `Meta description too long: ${metaDesc.length} chars — will be truncated` });
  }

  // H1
  const h1Count = countH1s(html);
  if (h1Count === 0) {
    findings.push({ url, label, severity: "high", check: "h1-missing", issue: "No H1 tag found on page" });
  } else if (h1Count > 1) {
    findings.push({ url, label, severity: "medium", check: "h1-multiple", issue: `Multiple H1 tags: ${h1Count} found (should be exactly 1)` });
  }

  // OG image
  const ogImage = extractMeta(html, "og:image");
  if (!ogImage) {
    findings.push({ url, label, severity: "medium", check: "og-image", issue: "Missing og:image — links shared to social media will show no preview image" });
  }

  // Alt text
  const imgsWithoutAlt = countImgsWithoutAlt(html);
  if (imgsWithoutAlt > 0) {
    findings.push({ url, label, severity: "medium", check: "alt-text", issue: `${imgsWithoutAlt} image(s) missing alt text` });
  }

  // Canonical
  if (!hasCanonical(html)) {
    findings.push({ url, label, severity: "high", check: "canonical", issue: "No canonical link tag found" });
  }

  if (findings.length === 0) {
    findings.push({ url, label, severity: "ok", check: "all", issue: null });
  }

  return findings;
}

/**
 * Run on-page audit across all key pages.
 *
 * @returns {Promise<OnPageAuditResult>}
 */
export async function runOnPageAudit() {
  console.error(`[on-page-audit] Auditing ${KEY_PAGES.length} key pages...`);

  const allFindings = [];

  for (const page of KEY_PAGES) {
    const findings = await auditPage(page);
    allFindings.push(...findings.filter(f => f.severity !== "ok"));
    console.error(`  [on-page-audit] ${page.label}: ${findings.filter(f => f.severity !== "ok").length} issue(s)`);
    await new Promise(r => setTimeout(r, 500));
  }

  const summary = {
    pagesAudited: KEY_PAGES.length,
    critical: allFindings.filter(f => f.severity === "critical").length,
    high: allFindings.filter(f => f.severity === "high").length,
    medium: allFindings.filter(f => f.severity === "medium").length,
  };

  console.error(
    `[on-page-audit] Done. ${summary.critical} critical, ${summary.high} high, ${summary.medium} medium`
  );

  return { summary, findings: allFindings };
}
