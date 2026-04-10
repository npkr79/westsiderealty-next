/**
 * Meta Optimizer — westsiderealty.in
 *
 * Uses CTR audit results (from ctr-audit.mjs) to rewrite title and description
 * for pages/templates with a significant CTR gap.
 *
 * Strategy:
 *  - Groups priority pages by template type (e.g. micro-market, project-detail)
 *  - For dynamic templates: reads the generateMetadata function and asks Claude
 *    to improve the formula, so the fix applies to ALL pages of that type
 *  - For static pages (homepage etc.): directly rewrites the metadata object
 *
 * Claude is given the actual GSC queries driving impressions for each page,
 * so rewrites are grounded in what people are actually searching for.
 *
 * Output: array of { file, originalContent, newContent, pagesAffected, summary }
 */

import fs from "fs";
import path from "path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BASE_URL = "https://www.westsiderealty.in";

// Map template → source file (relative to repo root)
const TEMPLATE_FILES = {
  homepage: "src/app/page.tsx",
  "city-hub": "src/app/[citySlug]/page.tsx",
  "micro-market": "src/app/[citySlug]/[microMarketSlug]/page.tsx",
  "micro-market-category": "src/app/[citySlug]/[microMarketSlug]/[category]/page.tsx",
  "project-detail": "src/app/[citySlug]/projects/[projectSlug]/page.tsx",
  "city-projects-index": "src/app/[citySlug]/projects/page.tsx",
  "smart-link": "src/app/homes/[slug]/page.tsx",
  "blog-article": "src/app/blog/[slug]/page.tsx",
  "insight-article": "src/app/insights/[slug]/page.tsx",
  "developer-profile": "src/app/developers/[slug]/page.tsx",
  "property-listing": "src/app/hyderabad/buy/[listingSlug]/page.tsx",
};

// Only optimize templates where we have enough signal (total impressions threshold)
const MIN_TEMPLATE_IMPRESSIONS = 1000;

// Templates to skip (e.g. protected/non-public)
const SKIP_TEMPLATES = new Set(["other", "portfolio"]);

async function callClaude(systemPrompt, userMessage) {
  if (!ANTHROPIC_API_KEY) throw new Error("[meta-optimizer] ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

/**
 * Group priority pages by template and compute aggregate metrics.
 */
function groupByTemplate(priorityPages) {
  const groups = {};

  for (const page of priorityPages) {
    const t = page.template;
    if (SKIP_TEMPLATES.has(t)) continue;

    if (!groups[t]) {
      groups[t] = {
        template: t,
        file: TEMPLATE_FILES[t] || null,
        pages: [],
        totalImpressions: 0,
        totalPriorityScore: 0,
      };
    }

    groups[t].pages.push(page);
    groups[t].totalImpressions += page.impressions;
    groups[t].totalPriorityScore += page.priorityScore;
  }

  // Sort by total priority score (highest impact templates first)
  return Object.values(groups)
    .filter((g) => g.totalImpressions >= MIN_TEMPLATE_IMPRESSIONS && g.file)
    .sort((a, b) => b.totalPriorityScore - a.totalPriorityScore);
}

/**
 * Build a concise GSC context string for Claude — top queries + page examples.
 */
function buildGscContext(group) {
  const lines = [];

  lines.push(`Template: ${group.template}`);
  lines.push(`Pages in this template with CTR gap: ${group.pages.length}`);
  lines.push(`Total impressions (28d): ${group.totalImpressions}`);
  lines.push("");

  lines.push("Top example pages (highest priority first):");
  const examples = group.pages.slice(0, 5);
  for (const page of examples) {
    lines.push(`  URL: ${page.url}`);
    lines.push(
      `  Impressions: ${page.impressions}, CTR: ${(page.ctr * 100).toFixed(2)}%, ` +
      `Position: ${page.position}, Expected CTR: ${(page.expectedCtr * 100).toFixed(1)}%`
    );
    if (page.topQueries && page.topQueries.length > 0) {
      const top5 = page.topQueries.slice(0, 5);
      lines.push(`  Top queries: ${top5.map((q) => `"${q.query}" (${q.impressions} impr)`).join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Ask Claude to improve the title/description formula for a dynamic template.
 * Returns the complete modified file content.
 */
async function optimizeDynamicTemplate(group, fileContent) {
  const systemPrompt = `You are an SEO expert for a real estate website (RE/MAX Westside Realty, westsiderealty.in) in Hyderabad, India.

Your task: improve the generateMetadata() function in a Next.js App Router page.tsx file to produce more compelling, click-worthy titles and descriptions.

Rules:
1. Title: max 60 characters. Include the primary keyword people search for + a specific value signal (price, RERA, count, location).
2. Description: max 155 characters. Include a call-to-action. Use specific details (price range, project count, locality name).
3. Use the actual GSC search queries provided — these are what real users type. Mirror their language.
4. For Indian real estate: include ₹ price signals, "RERA verified", "ready to move", "possession by" where data is available in params.
5. Keep the code structure intact — only change the title/description string templates inside generateMetadata.
6. Output ONLY the complete modified file content. No markdown fences. No explanation.
7. Never hardcode dynamic values that come from params or database — use template literals with existing variables.`;

  const userMessage = `REAL GSC DATA FOR THIS TEMPLATE:
${buildGscContext(group)}

CURRENT FILE (${group.file}):
${fileContent}

Improve the title and description in generateMetadata to better match what users search for and drive more clicks.
Return the complete file.`;

  return callClaude(systemPrompt, userMessage);
}

/**
 * Ask Claude to improve the metadata for a static page directly.
 */
async function optimizeStaticPage(page, fileContent) {
  const systemPrompt = `You are an SEO expert for a real estate website (RE/MAX Westside Realty, westsiderealty.in) in Hyderabad, India.

Your task: improve the static metadata (title and description) in a Next.js page.tsx file.

Rules:
1. Title: max 60 characters. Include primary search keywords + a value signal.
2. Description: max 155 characters. Include a call-to-action. Be specific.
3. Use the provided GSC queries as evidence of what users search for — mirror their language.
4. Output ONLY the complete modified file content. No markdown fences. No explanation.`;

  const topQueries = (page.topQueries || []).slice(0, 8).map((q) => `"${q.query}"`).join(", ");

  const userMessage = `PAGE URL: ${page.url}
Current CTR: ${(page.ctr * 100).toFixed(2)}% (expected: ${(page.expectedCtr * 100).toFixed(1)}%)
Impressions: ${page.impressions} | Clicks: ${page.clicks}

TOP SEARCH QUERIES LANDING ON THIS PAGE:
${topQueries}

CURRENT FILE:
${fileContent}

Rewrite the title and description to better match user intent. Return the complete file.`;

  return callClaude(systemPrompt, userMessage);
}

/**
 * Run meta optimization across all priority template groups.
 *
 * @param {import('./ctr-audit.mjs').CtrAuditResult} ctrResult
 * @returns {Promise<Array<MetaFix>>}
 */
export async function runMetaOptimizer(ctrResult) {
  if (!ctrResult.priorityPages || ctrResult.priorityPages.length === 0) {
    console.error("[meta-optimizer] No priority pages — nothing to optimize");
    return [];
  }

  const groups = groupByTemplate(ctrResult.priorityPages);
  console.error(
    `[meta-optimizer] ${groups.length} template group(s) to optimize: ` +
    groups.map((g) => g.template).join(", ")
  );

  const fixes = [];

  for (const group of groups) {
    const filePath = path.resolve(group.file);

    if (!fs.existsSync(filePath)) {
      console.error(`[meta-optimizer] File not found: ${group.file} — skipping`);
      continue;
    }

    const originalContent = fs.readFileSync(filePath, "utf8");

    // Skip if no generateMetadata (no point rewriting a non-SEO file)
    const hasMetadata =
      /generateMetadata|export const metadata/.test(originalContent);
    if (!hasMetadata) {
      console.error(`[meta-optimizer] No metadata export in ${group.file} — skipping`);
      continue;
    }

    console.error(`[meta-optimizer] Optimizing ${group.file} (${group.pages.length} pages)...`);

    try {
      let newContent;

      if (group.template === "homepage") {
        // Static page — use single-page optimizer
        newContent = await optimizeStaticPage(group.pages[0], originalContent);
      } else {
        // Dynamic template — improve the formula
        newContent = await optimizeDynamicTemplate(group, originalContent);
      }

      // Safety checks
      if (!newContent || newContent.length < originalContent.length * 0.5) {
        console.error(`[meta-optimizer] Output too short for ${group.file} — skipping`);
        continue;
      }
      if (newContent.length > originalContent.length * 3) {
        console.error(`[meta-optimizer] Output too long for ${group.file} — skipping`);
        continue;
      }
      if (!newContent.includes("generateMetadata") && !newContent.includes("export const metadata")) {
        console.error(`[meta-optimizer] Claude dropped metadata export in ${group.file} — skipping`);
        continue;
      }

      // Write the fix
      fs.writeFileSync(filePath, newContent, "utf8");

      // Extract what changed for the PR summary
      const oldTitleMatch = originalContent.match(/title:\s*["'`]([^"'`]+)/);
      const newTitleMatch = newContent.match(/title:\s*["'`]([^"'`]+)/);

      fixes.push({
        file: group.file,
        template: group.template,
        pagesAffected: group.pages.length,
        totalImpressions: group.totalImpressions,
        oldTitle: oldTitleMatch?.[1] || "(dynamic)",
        newTitle: newTitleMatch?.[1] || "(dynamic)",
        topUrls: group.pages.slice(0, 3).map((p) => p.url),
      });

      console.error(
        `[meta-optimizer] Fixed ${group.file} — affects ~${group.pages.length} pages`
      );
    } catch (err) {
      console.error(`[meta-optimizer] Failed to optimize ${group.file}:`, err.message);
    }

    // Rate limit between Claude calls
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.error(`[meta-optimizer] Done. ${fixes.length} template(s) optimized.`);
  return fixes;
}
