/**
 * SEO Agent — westsiderealty.in
 *
 * Master orchestrator. Runs the full SEO pipeline in order:
 *
 *   Phase 1 — Code Audit
 *     a. audit.mjs         — ISR violations, canonicals, keywords, CWV, crawl errors, robots, HTTPS
 *     b. fix.mjs           — Auto-apply safe code fixes
 *
 *   Phase 2 — GSC + Intelligence
 *     c. ctr-audit         — 5000-page GSC pull, high-impression / low-CTR detection
 *     d. meta-optimizer    — Claude rewrites title/description per template
 *     e. schema-gaps       — Missing structured data (reported + recommendations)
 *     f. on-page-audit     — Live H1, alt text, OG image, canonical checks on key pages
 *     g. db-content-audit  — Supabase scan: all projects/micro-markets/developers for thin content
 *     h. ctr-trends        — Store weekly GSC snapshot, surface CTR drops vs 4-week baseline
 *     i. competitor-keywords — GSC rank 11-50 gaps + optional SerpAPI competitor data
 *     j. content-gaps      — Page-2 quick wins, missing locality pages, declining content
 *     k. faq-generator     — Write FAQPage JSON-LD TypeScript helpers for all templates
 *     l. position-tracker  — Track 100 target keywords weekly, alert on drops
 *     m. backlink-audit    — SerpAPI brand mentions, competitor scale, indexed page counts
 *     n. serp-features     — Featured snippets, PAA, local pack tracking per keyword
 *     o. keyword-difficulty — Score each keyword gap 0-100 by who dominates top 10
 *     p. content-scorer    — Rule-based + Claude quality score for all projects/micro-markets
 *     q. crux-audit        — CrUX API real-user CWV data for all project + micro-market pages
 *
 *   Phase 3 — Index Updated Pages
 *     m. indexing-api      — Submit changed pages to Google Indexing API
 *
 *   Phase 4 — Submit Sitemap
 *     n. gsc-client        — Re-submit sitemap.xml to GSC
 *
 *   Phase 5 — Report
 *     o. Generate .seo-pr-body.md with full audit context for GitHub PR
 *
 * Usage:
 *   node scripts/seo-agent/agent.mjs
 *   node scripts/seo-agent/agent.mjs --code-only     (Phase 1 only)
 *   node scripts/seo-agent/agent.mjs --gsc-only      (Phases 2-4 only)
 *   node scripts/seo-agent/agent.mjs --dry-run       (audit + analyze, no writes)
 *   node scripts/seo-agent/agent.mjs --no-index      (skip Indexing API)
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SITE_URL            (default: https://www.westsiderealty.in)
 *   SUPABASE_URL               (for DB content audit + CTR trends + keyword tracking)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   PAGESPEED_API_KEY          (optional — for PageSpeed/CWV checks)
 *   VERCEL_TOKEN               (optional — for 500 error checks)
 *   SERPAPI_KEY                (optional — for competitor keyword data)
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";

import { runCtrAudit } from "./ctr-audit.mjs";
import { runMetaOptimizer } from "./meta-optimizer.mjs";
import { runSchemaAudit } from "./schema-gaps.mjs";
import { runOnPageAudit } from "./on-page-audit.mjs";
import { runDbContentAudit } from "./db-content-audit.mjs";
import { storeCtrSnapshot, getCtrTrends } from "./ctr-trends.mjs";
import { runCompetitorKeywords } from "./competitor-keywords.mjs";
import { runContentGaps } from "./content-gaps.mjs";
import { runFaqGenerator } from "./faq-generator.mjs";
import { runPositionTracker } from "./position-tracker.mjs";
import { runBacklinkAudit } from "./backlink-audit.mjs";
import { runSerpFeatures } from "./serp-features.mjs";
import { runKeywordDifficulty } from "./keyword-difficulty.mjs";
import { runContentScorer } from "./content-scorer.mjs";
import { runCruxAudit } from "./crux-audit.mjs";
import { requestIndexing } from "./indexing-api.mjs";
import { submitSitemap, daysAgo } from "./gsc-client.mjs";

const SITE_URL = process.env.GOOGLE_SITE_URL || "https://www.westsiderealty.in";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const args = process.argv.slice(2);
const CODE_ONLY = args.includes("--code-only");
const GSC_ONLY = args.includes("--gsc-only");
const DRY_RUN = args.includes("--dry-run");
const NO_INDEX = args.includes("--no-index");

if (DRY_RUN) console.error("[agent] DRY RUN — no file writes or API submissions");

// ─── Phase 1: Code Audit ──────────────────────────────────────────────────────

async function runCodeAudit() {
  console.error("\n[agent] ═══ Phase 1a: Code Audit ═══");

  let codeFindings = null;

  try {
    const auditResult = spawnSync(
      "node",
      ["scripts/seo-audit/audit.mjs"],
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 120_000 }
    );

    // audit.mjs writes JSON to stdout, logs to stderr
    if (auditResult.stderr) process.stderr.write(auditResult.stderr);

    if (auditResult.stdout) {
      try {
        codeFindings = JSON.parse(auditResult.stdout);
      } catch {
        console.error("[agent] Could not parse audit.mjs output as JSON");
      }
    }
  } catch (err) {
    console.error("[agent] audit.mjs failed:", err.message);
  }

  return codeFindings;
}

async function runCodeFix(findings) {
  if (!findings || !ANTHROPIC_API_KEY) return { applied: [], total: 0 };
  if (DRY_RUN) {
    console.error("[agent] DRY RUN — skipping code fixes");
    return { applied: [], total: 0 };
  }

  const autoFixable =
    (findings.summary?.isrViolations || 0) +
    (findings.summary?.missingCanonicals || 0) +
    (findings.summary?.missingKeywords || 0);

  if (autoFixable === 0) {
    console.error("[agent] ═══ Phase 1b: Code Fix — no auto-fixable issues");
    return { applied: [], total: 0 };
  }

  console.error(`\n[agent] ═══ Phase 1b: Code Fix — ${autoFixable} auto-fixable issue(s) ═══`);

  try {
    const fixInput = JSON.stringify(findings);
    const fixResult = spawnSync(
      "node",
      ["scripts/seo-audit/fix.mjs"],
      {
        input: fixInput,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 180_000,
        env: { ...process.env },
      }
    );

    if (fixResult.stderr) process.stderr.write(fixResult.stderr);

    if (fixResult.stdout) {
      try {
        return JSON.parse(fixResult.stdout);
      } catch {
        console.error("[agent] Could not parse fix.mjs output");
      }
    }
  } catch (err) {
    console.error("[agent] fix.mjs failed:", err.message);
  }

  return { applied: [], total: 0 };
}

// ─── Phase 2: GSC-Driven Optimization ────────────────────────────────────────

async function runGscPhases() {
  console.error("\n[agent] ═══ Phase 2a: GSC CTR Audit ═══");

  let ctrResult = null;
  let metaFixes = [];
  let schemaGaps = [];

  // CTR audit
  try {
    ctrResult = await runCtrAudit({ fetchQueriesPerPage: !DRY_RUN });
  } catch (err) {
    console.error("[agent] CTR audit failed:", err.message);
    ctrResult = { error: err.message, priorityPages: [], siteMetrics: null, templateBreakdown: {} };
  }

  // Meta optimization
  if (!DRY_RUN && ctrResult && !ctrResult.error) {
    console.error("\n[agent] ═══ Phase 2b: Meta Optimization ═══");
    try {
      metaFixes = await runMetaOptimizer(ctrResult);
    } catch (err) {
      console.error("[agent] Meta optimizer failed:", err.message);
    }
  } else if (DRY_RUN && ctrResult) {
    console.error(
      `[agent] DRY RUN — would optimize ${ctrResult.priorityPages?.length || 0} priority pages`
    );
  }

  // Schema gaps (analysis only — always runs, doesn't write files)
  console.error("\n[agent] ═══ Phase 2c: Schema Gap Analysis ═══");
  try {
    schemaGaps = runSchemaAudit();
  } catch (err) {
    console.error("[agent] Schema audit failed:", err.message);
  }

  // On-page audit
  console.error("\n[agent] ═══ Phase 2d: On-Page SEO Audit ═══");
  let onPageResult = { summary: {}, findings: [] };
  try {
    onPageResult = await runOnPageAudit();
  } catch (err) {
    console.error("[agent] On-page audit failed:", err.message);
  }

  // DB content quality audit — scans ALL projects/micro-markets/developers in Supabase
  console.error("\n[agent] ═══ Phase 2e: DB Content Quality Audit ═══");
  let dbContentResult = { summary: { totalIssues: 0 }, issues: [] };
  try {
    dbContentResult = await runDbContentAudit();
  } catch (err) {
    console.error("[agent] DB content audit failed:", err.message);
  }

  // CTR trend snapshot — store weekly metrics, detect drops vs 4-week baseline
  console.error("\n[agent] ═══ Phase 2f: CTR Trend Snapshot ═══");
  let ctrTrends = [];
  try {
    if (ctrResult && ctrResult.priorityPages && !DRY_RUN) {
      const allPageRows = (ctrResult.templateBreakdown
        ? Object.values(ctrResult.templateBreakdown).flatMap(t => t.pages || [])
        : []);
      // Use raw ctrResult rows for full-site snapshot (re-pull 5000 rows if available)
      const snapshotData = ctrResult._allRows || ctrResult.priorityPages;
      await storeCtrSnapshot(snapshotData);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      ctrTrends = await getCtrTrends(weekStart.toISOString().slice(0, 10));
      console.error(`[agent] CTR trends: ${ctrTrends.length} pages with drops/improvements`);
    }
  } catch (err) {
    console.error("[agent] CTR trends failed:", err.message);
  }

  // Competitor keyword gap analysis
  console.error("\n[agent] ═══ Phase 2g: Competitor Keyword Analysis ═══");
  let competitorResult = { gscOpportunities: 0, totalGaps: 0, topOpportunities: [] };
  try {
    competitorResult = await runCompetitorKeywords();
  } catch (err) {
    console.error("[agent] Competitor keywords failed:", err.message);
  }

  // Content gap analysis — page 2/3 wins, missing locality pages, declining content
  console.error("\n[agent] ═══ Phase 2h: Content Gap Analysis ═══");
  let contentGaps = { quickWins: [], missingPages: [], decliningPages: [], ctrOpportunities: [], summary: {} };
  try {
    contentGaps = await runContentGaps();
  } catch (err) {
    console.error("[agent] Content gaps failed:", err.message);
  }

  // FAQ generator — writes TypeScript FAQ helper files (code change goes into PR)
  console.error("\n[agent] ═══ Phase 2i: FAQ Schema Generator ═══");
  let faqResult = { projectFaqFileWritten: false, microMarketFaqFileWritten: false };
  try {
    if (!DRY_RUN) {
      faqResult = await runFaqGenerator();
    } else {
      console.error("[agent] DRY RUN — skipping FAQ file writes");
    }
  } catch (err) {
    console.error("[agent] FAQ generator failed:", err.message);
  }

  // Position tracker — 100 target keywords, weekly ranking, drop alerts
  console.error("\n[agent] ═══ Phase 2j: Position Tracker ═══");
  let positionResult = { keywordsTracked: 0, keywordsFound: 0, drops: [], improvements: [] };
  try {
    positionResult = await runPositionTracker();
  } catch (err) {
    console.error("[agent] Position tracker failed:", err.message);
  }

  // Backlink audit — SerpAPI brand mentions + competitor scale comparison
  console.error("\n[agent] ═══ Phase 2k: Backlink Audit ═══");
  let backlinkResult = { ourIndexedPages: 0, brandMentions: 0, topMentioningDomains: [], competitorScale: [], linkableAssets: 0, summary: "" };
  try {
    backlinkResult = await runBacklinkAudit();
  } catch (err) {
    console.error("[agent] Backlink audit failed:", err.message);
  }

  // SERP features — featured snippet, PAA, local pack per keyword
  console.error("\n[agent] ═══ Phase 2l: SERP Feature Tracking ═══");
  let serpFeaturesResult = { keywordsChecked: 0, featuredSnippetOpportunities: 0, paaOpportunities: 0, localPackPresence: 0, weOwnSnippets: 0, topOpportunities: [], summary: "" };
  try {
    serpFeaturesResult = await runSerpFeatures();
  } catch (err) {
    console.error("[agent] SERP features failed:", err.message);
  }

  // Keyword difficulty — score each gap 0-100 by who dominates the top 10
  console.error("\n[agent] ═══ Phase 2m: Keyword Difficulty Scoring ═══");
  let keywordDifficultyResult = { keywordsScored: 0, lowDifficulty: 0, mediumDifficulty: 0, highDifficulty: 0, quickWinKeywords: [], summary: "" };
  try {
    keywordDifficultyResult = await runKeywordDifficulty();
  } catch (err) {
    console.error("[agent] Keyword difficulty failed:", err.message);
  }

  // Content scorer — rule-based + Claude quality scores for all projects/micro-markets
  console.error("\n[agent] ═══ Phase 2n: Content Quality Scorer ═══");
  let contentScorerResult = { projectsScored: 0, microMarketsScored: 0, avgProjectScore: 0, avgMicroMarketScore: 0, lowScoreProjects: 0, lowScoreMicroMarkets: 0, claudeSuggestionsGenerated: 0, topIssues: [], summary: "" };
  try {
    contentScorerResult = await runContentScorer();
  } catch (err) {
    console.error("[agent] Content scorer failed:", err.message);
  }

  // CrUX audit — real-user CWV from Chrome UX Report API for all pages
  console.error("\n[agent] ═══ Phase 2o: CrUX Audit (all pages) ═══");
  let cruxResult = { urlsChecked: 0, urlsWithData: 0, urlsGood: 0, urlsNeedsImprovement: 0, urlsPoor: 0, worstPages: [], summary: "" };
  try {
    cruxResult = await runCruxAudit();
  } catch (err) {
    console.error("[agent] CrUX audit failed:", err.message);
  }

  return {
    ctrResult, metaFixes, schemaGaps, onPageResult,
    dbContentResult, ctrTrends, competitorResult, contentGaps, faqResult, positionResult,
    backlinkResult, serpFeaturesResult, keywordDifficultyResult, contentScorerResult, cruxResult,
  };
}

// ─── Phase 3: Index Updated Pages ────────────────────────────────────────────

async function indexChangedPages(metaFixes) {
  if (NO_INDEX || DRY_RUN || metaFixes.length === 0) {
    if (metaFixes.length > 0) {
      console.error(
        `[agent] Skipping indexing for ${metaFixes.length} changed template(s) (--no-index or --dry-run)`
      );
    }
    return [];
  }

  console.error("\n[agent] ═══ Phase 3: Request Indexing ═══");

  // Collect URLs affected by meta changes — use known high-impression pages from those templates
  const urlsToIndex = new Set();
  for (const fix of metaFixes) {
    for (const url of fix.topUrls || []) {
      urlsToIndex.add(url);
    }
  }

  // Always re-index the homepage if it changed
  if (metaFixes.some((f) => f.template === "homepage")) {
    urlsToIndex.add(SITE_URL);
    urlsToIndex.add(SITE_URL + "/");
  }

  const urlList = [...urlsToIndex].slice(0, 50); // safety cap
  if (urlList.length === 0) return [];

  try {
    return await requestIndexing(urlList);
  } catch (err) {
    console.error("[agent] Indexing API failed:", err.message);
    return [];
  }
}

// ─── Phase 4: Submit Sitemap ──────────────────────────────────────────────────

async function submitSitemapToGsc() {
  if (DRY_RUN) {
    console.error("[agent] DRY RUN — skipping sitemap submission");
    return null;
  }

  console.error("\n[agent] ═══ Phase 4: Sitemap Submission ═══");
  try {
    const result = await submitSitemap(`${SITE_URL}/sitemap.xml`);
    console.error("[agent] Sitemap submitted:", result.message);
    return result;
  } catch (err) {
    console.error("[agent] Sitemap submission failed:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── Phase 5: Generate PR Body ────────────────────────────────────────────────

async function generatePrBody({ codeFindings, codeFix, ctrResult, metaFixes, schemaGaps, onPageResult, dbContentResult, ctrTrends, competitorResult, contentGaps, faqResult, positionResult, backlinkResult, serpFeaturesResult, keywordDifficultyResult, contentScorerResult, cruxResult, indexingResults, sitemapResult }) {
  const lines = [];
  const now = new Date().toISOString().slice(0, 10);

  lines.push(`## SEO Agent Report — ${now}`);
  lines.push("");
  lines.push("> Automated weekly SEO optimization. Review changes before merging.");
  lines.push("");

  // ── Site metrics ──
  if (ctrResult?.siteMetrics) {
    const m = ctrResult.siteMetrics;
    lines.push("### 📊 Site Performance (last 28 days)");
    lines.push("");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Clicks | ${m.totalClicks.toLocaleString()} |`);
    lines.push(`| Total Impressions | ${m.totalImpressions.toLocaleString()} |`);
    lines.push(`| Site-wide CTR | ${(m.siteCtr * 100).toFixed(2)}% |`);
    lines.push(`| Target CTR | ~2.0% |`);
    lines.push(`| CTR Gap | ${((0.02 - m.siteCtr) * 100).toFixed(2)}pp |`);
    lines.push("");
  }

  // ── Code fixes ──
  lines.push("### 🔧 Phase 1: Code Fixes");
  lines.push("");
  if (codeFix?.applied?.length > 0) {
    lines.push(`Applied **${codeFix.total}** auto-fix(es):`);
    for (const fix of codeFix.applied) {
      lines.push(`- \`${fix.file}\` — ${fix.fix}`);
    }
  } else {
    lines.push("No auto-fixable code issues found.");
  }

  if (codeFindings?.summary) {
    const s = codeFindings.summary;
    lines.push("");
    lines.push("**Audit summary:**");
    if (s.pageSpeedIssues > 0) lines.push(`- ⚠️ PageSpeed issues: ${s.pageSpeedIssues}`);
    if (s.vercel500Paths > 0) lines.push(`- ⚠️ Vercel 500 paths: ${s.vercel500Paths}`);
    if (s.sitemapIssues > 0) lines.push(`- ⚠️ Sitemap issues: ${s.sitemapIssues}`);

    const pagespeedRows = (codeFindings.pageSpeed || []).filter(p => p.issue);
    if (pagespeedRows.length > 0) {
      lines.push("");
      lines.push("**PageSpeed details:**");
      for (const p of pagespeedRows) {
        lines.push(`- \`${p.url}\` — Perf: ${p.performance}/100, SEO: ${p.seo}/100, LCP: ${p.lcp}`);
      }
    }
  }
  lines.push("");

  // ── Meta fixes ──
  lines.push("### ✍️ Phase 2a: Meta Optimization");
  lines.push("");
  if (metaFixes && metaFixes.length > 0) {
    lines.push(`Rewrote title/description formulas for **${metaFixes.length}** template(s):`);
    lines.push("");
    for (const fix of metaFixes) {
      lines.push(`#### \`${fix.file}\` (${fix.template})`);
      lines.push(`Affects ~**${fix.pagesAffected}** pages | ${fix.totalImpressions.toLocaleString()} impressions/28d`);
      if (fix.oldTitle !== "(dynamic)") {
        lines.push(`- Before: \`${fix.oldTitle}\``);
        lines.push(`- After: \`${fix.newTitle}\``);
      }
      lines.push("");
    }
  } else {
    lines.push("No meta rewrites this run (either no CTR gap or dry run).");
    lines.push("");
  }

  // ── CTR priority pages ──
  if (ctrResult?.priorityPages?.length > 0) {
    lines.push("### 📉 CTR Opportunity Pages (top 10)");
    lines.push("");
    lines.push("| Page | Impressions | CTR | Expected | Gap |");
    lines.push("|------|-------------|-----|----------|-----|");
    for (const p of ctrResult.priorityPages.slice(0, 10)) {
      const shortUrl = p.url.replace("https://www.westsiderealty.in", "");
      lines.push(
        `| \`${shortUrl}\` | ${p.impressions} | ${(p.ctr * 100).toFixed(1)}% | ${(p.expectedCtr * 100).toFixed(1)}% | ${(p.ctrGap * 100).toFixed(1)}pp |`
      );
    }
    lines.push("");
  }

  // ── On-page audit ──
  lines.push("### 🔍 Phase 2b: On-Page SEO Audit");
  lines.push("");
  if (onPageResult?.findings?.length > 0) {
    const critical = onPageResult.findings.filter(f => f.severity === "critical");
    const high = onPageResult.findings.filter(f => f.severity === "high");
    const medium = onPageResult.findings.filter(f => f.severity === "medium");

    if (critical.length > 0) {
      lines.push(`**${critical.length} critical issue(s):**`);
      for (const f of critical) {
        lines.push(`- \`${f.label}\`: ${f.issue}`);
      }
      lines.push("");
    }
    if (high.length > 0) {
      lines.push(`**${high.length} high-priority issue(s):**`);
      for (const f of high) {
        lines.push(`- \`${f.label}\`: ${f.issue}`);
      }
      lines.push("");
    }
    if (medium.length > 0) {
      lines.push(`**${medium.length} medium-priority issue(s):**`);
      for (const f of medium) {
        lines.push(`- \`${f.label}\`: ${f.issue}`);
      }
      lines.push("");
    }
  } else {
    lines.push("✅ All key pages pass on-page checks.");
    lines.push("");
  }

  // ── Crawl errors from code audit ──
  if (codeFindings?.crawlErrors?.length > 0) {
    const errors = codeFindings.crawlErrors.filter(e => e.type !== "redirect");
    const redirects = codeFindings.crawlErrors.filter(e => e.type === "redirect");
    if (errors.length > 0) {
      lines.push("### ⚠️ Crawl Errors (from sitemap sample)");
      lines.push("");
      for (const e of errors) {
        lines.push(`- \`${e.url}\` — **${e.status || e.type}**: ${e.issue}`);
      }
      lines.push("");
    }
    if (redirects.length > 0) {
      lines.push(`> ${redirects.length} sitemap URL(s) redirect — these should be updated to canonical URLs in the sitemap.`);
      lines.push("");
    }
  }

  // ── Infrastructure ──
  if (codeFindings?.infrastructure) {
    const infraIssues = Object.entries(codeFindings.infrastructure)
      .filter(([, v]) => v.status === "fail");
    if (infraIssues.length > 0) {
      lines.push("### 🔒 Infrastructure Issues");
      lines.push("");
      for (const [check, v] of infraIssues) {
        lines.push(`- **${check}**: ${v.issue}`);
      }
      lines.push("");
    }
  }

  // ── CWV details from PageSpeed ──
  if (codeFindings?.pageSpeed?.length > 0) {
    const cwvIssues = codeFindings.pageSpeed.filter(p =>
      p.cwv && Object.values(p.cwv).some(v => v.status === "poor" || v.status === "needs-improvement")
    );
    if (cwvIssues.length > 0) {
      lines.push("### ⚡ Core Web Vitals");
      lines.push("");
      lines.push("| Page | LCP | CLS | INP | FCP | TTFB |");
      lines.push("|------|-----|-----|-----|-----|------|");
      for (const p of cwvIssues) {
        const { lcp, cls, inp, fcp, ttfb } = p.cwv;
        const fmt = (m) => m ? `${m.display} (${m.status})` : "n/a";
        const short = p.url.replace("https://www.westsiderealty.in", "") || "/";
        lines.push(`| \`${short}\` | ${fmt(lcp)} | ${fmt(cls)} | ${fmt(inp)} | ${fmt(fcp)} | ${fmt(ttfb)} |`);
      }
      lines.push("");
    }
  }

  // ── Schema gaps ──
  lines.push("### 🏗️ Phase 2c: Schema Gaps (manual action needed)");
  lines.push("");
  if (schemaGaps && schemaGaps.length > 0) {
    const high = schemaGaps.filter((g) => g.severity === "high");
    const medium = schemaGaps.filter((g) => g.severity === "medium");

    if (high.length > 0) {
      lines.push(`**${high.length} high-priority gap(s):**`);
      for (const gap of high) {
        lines.push(`- \`${gap.file}\`: ${gap.description}`);
        if (gap.recommendation) {
          lines.push(`  <details><summary>Recommended fix</summary>`);
          lines.push(`  \n  \`\`\`typescript\n  ${gap.recommendation.trim()}\n  \`\`\`\n  </details>`);
        }
      }
      lines.push("");
    }

    if (medium.length > 0) {
      lines.push(`**${medium.length} medium-priority gap(s):**`);
      for (const gap of medium) {
        lines.push(`- \`${gap.file}\`: ${gap.description}`);
      }
      lines.push("");
    }
  } else {
    lines.push("No schema gaps found.");
    lines.push("");
  }

  // ── Template CTR breakdown ──
  if (ctrResult?.templateBreakdown) {
    const breakdown = Object.entries(ctrResult.templateBreakdown)
      .filter(([, t]) => t.totalImpressions > 500)
      .sort(([, a], [, b]) => b.totalImpressions - a.totalImpressions)
      .slice(0, 8);

    if (breakdown.length > 0) {
      lines.push("### 📋 CTR by Template Type");
      lines.push("");
      lines.push("| Template | Pages | Impressions | CTR |");
      lines.push("|----------|-------|-------------|-----|");
      for (const [template, t] of breakdown) {
        lines.push(
          `| ${template} | ${t.pageCount} | ${t.totalImpressions.toLocaleString()} | ${(t.avgCtr * 100).toFixed(2)}% |`
        );
      }
      lines.push("");
    }
  }

  // ── DB Content Quality ──
  if (dbContentResult?.summary?.totalIssues > 0) {
    const s = dbContentResult.summary;
    lines.push("### 🗄️ Database Content Quality");
    lines.push("");
    lines.push(`Found **${s.totalIssues}** content quality issue(s) across your database records:`);
    lines.push(`- Critical: ${s.critical || 0} | High: ${s.high || 0} | Medium: ${s.medium || 0} | Low: ${s.low || 0}`);
    lines.push(`- Projects audited: ${s.projects || 0} | Micro-markets: ${s.microMarkets || 0} | Developers: ${s.developers || 0}`);
    lines.push("");
    const criticalIssues = (dbContentResult.issues || []).filter(i => i.severity === "critical").slice(0, 5);
    const highIssues = (dbContentResult.issues || []).filter(i => i.severity === "high").slice(0, 8);
    if (criticalIssues.length > 0) {
      lines.push("**Critical — fix immediately:**");
      for (const i of criticalIssues) {
        lines.push(`- \`${i.entityType}/${i.entityName}\`: ${i.issueType.replace(/_/g, " ")} → [${i.entityUrl}](${i.entityUrl})`);
      }
      lines.push("");
    }
    if (highIssues.length > 0) {
      lines.push("**High priority:**");
      for (const i of highIssues) {
        lines.push(`- \`${i.entityType}/${i.entityName}\`: ${i.issueType.replace(/_/g, " ")}`);
      }
      if ((dbContentResult.issues || []).filter(i => i.severity === "high").length > 8) {
        lines.push(`- _(and ${(dbContentResult.issues || []).filter(i => i.severity === "high").length - 8} more — see seo_content_quality table)_`);
      }
      lines.push("");
    }
  } else {
    lines.push("### 🗄️ Database Content Quality");
    lines.push("");
    lines.push("✅ All database records pass content quality checks.");
    lines.push("");
  }

  // ── CTR Trends ──
  if (ctrTrends && ctrTrends.length > 0) {
    lines.push("### 📉 CTR Trend Alerts (vs 4-week baseline)");
    lines.push("");
    lines.push("| Page | CTR Now | CTR 4w Ago | Delta | Position | Pos 4w Ago |");
    lines.push("|------|---------|------------|-------|----------|------------|");
    for (const t of ctrTrends.slice(0, 10)) {
      const short = t.page_url.replace("https://www.westsiderealty.in", "") || "/";
      lines.push(
        `| \`${short}\` | ${(t.ctr * 100).toFixed(2)}% | ${(t.prev_ctr * 100).toFixed(2)}% | ${t.ctrDelta > 0 ? "+" : ""}${(t.ctrDelta * 100).toFixed(2)}pp | ${t.position?.toFixed(1)} | ${t.prev_position?.toFixed(1)} |`
      );
    }
    lines.push("");
  }

  // ── Competitor Keywords ──
  if (competitorResult?.totalGaps > 0 || competitorResult?.topOpportunities?.length > 0) {
    lines.push("### 🎯 Keyword Opportunities");
    lines.push("");
    lines.push(`Found **${competitorResult.gscOpportunities || 0}** GSC keyword gaps (ranking 11-50 with impressions)`);
    if (competitorResult.serpApiKeywords > 0) {
      lines.push(` + **${competitorResult.serpApiKeywords}** competitor keyword gaps from SerpAPI`);
    }
    lines.push("");
    if (competitorResult.topOpportunities?.length > 0) {
      lines.push("**Top opportunities (by impression × position gap):**");
      lines.push("");
      lines.push("| Keyword | Our Position | Impressions | Template | Action |");
      lines.push("|---------|-------------|-------------|----------|--------|");
      for (const k of competitorResult.topOpportunities.slice(0, 10)) {
        lines.push(`| ${k.keyword} | ${k.our_position?.toFixed(1) || "—"} | ${k.impressions} | ${k.recommended_template} | ${k.recommended_action?.slice(0, 60)}… |`);
      }
      lines.push("");
    }
  }

  // ── Content Gaps ──
  if (contentGaps?.quickWins?.length > 0 || contentGaps?.missingPages?.length > 0) {
    lines.push("### 📋 Content Gaps & Quick Wins");
    lines.push("");

    if (contentGaps.quickWins?.length > 0) {
      lines.push(`**Page 2/3 Quick Wins** — ${contentGaps.quickWins.length} pages ranking 11-20 that need a push:`);
      lines.push("");
      lines.push("| Page | Position | Impressions | Est. Click Gain | Template |");
      lines.push("|------|----------|-------------|-----------------|----------|");
      for (const w of contentGaps.quickWins.slice(0, 8)) {
        const short = w.url.replace("https://www.westsiderealty.in", "") || "/";
        lines.push(`| \`${short}\` | ${w.position?.toFixed(1)} | ${w.impressions} | +${Math.round(w.estimatedClickGain || 0)} | ${w.template} |`);
      }
      lines.push("");
    }

    if (contentGaps.missingPages?.length > 0) {
      lines.push(`**Missing Locality Pages** — ${contentGaps.missingPages.length} localities with search demand but no page:`);
      lines.push("");
      for (const m of contentGaps.missingPages.slice(0, 8)) {
        lines.push(`- **${m.locality}** — ${m.totalImpressions} impressions/month — create \`/hyderabad/${m.localitySlug}\``);
      }
      lines.push("");
    }

    if (contentGaps.decliningPages?.length > 0) {
      lines.push(`**Declining Content** — ${contentGaps.decliningPages.length} pages losing position (need refresh):`);
      for (const d of contentGaps.decliningPages.slice(0, 5)) {
        const short = d.url.replace("https://www.westsiderealty.in", "");
        lines.push(`- \`${short}\` — dropped ${d.positionDrop?.toFixed(1)} positions (now ${d.currentPosition?.toFixed(1)})`);
      }
      lines.push("");
    }
  }

  // ── Position Tracker ──
  if (positionResult?.drops?.length > 0 || positionResult?.keywordsFound > 0) {
    lines.push("### 🎯 Target Keyword Rankings");
    lines.push("");
    lines.push(`Tracking **${positionResult.keywordsTracked}** target keywords — **${positionResult.keywordsFound}** found in GSC data`);
    if (positionResult.notRanking?.length > 0) {
      lines.push(` | **${positionResult.notRanking.length}** keywords not yet ranking`);
    }
    lines.push("");
    if (positionResult.drops?.length > 0) {
      lines.push("**⚠️ Position Drops (>3 places this week):**");
      for (const d of positionResult.drops.slice(0, 8)) {
        lines.push(`- "${d.keyword}": pos ${d.previousPosition?.toFixed(1)} → ${d.currentPosition?.toFixed(1)} (−${Math.abs(d.delta).toFixed(1)})`);
      }
      lines.push("");
    }
    if (positionResult.improvements?.length > 0) {
      lines.push("**✅ Position Gains (>3 places this week):**");
      for (const i of positionResult.improvements.slice(0, 5)) {
        lines.push(`- "${i.keyword}": pos ${i.previousPosition?.toFixed(1)} → ${i.currentPosition?.toFixed(1)} (+${Math.abs(i.delta).toFixed(1)})`);
      }
      lines.push("");
    }
  }

  // ── FAQ Generator ──
  if (faqResult?.projectFaqFileWritten || faqResult?.microMarketFaqFileWritten) {
    lines.push("### ❓ FAQ Schema Files");
    lines.push("");
    lines.push("Auto-generated FAQPage JSON-LD helper functions:");
    if (faqResult.projectFaqFileWritten) {
      lines.push(`- \`src/data/seo/project-faqs.ts\` — covers ~${faqResult.projectCount} project pages`);
      lines.push("  → **Action needed:** Import and call `generateProjectFaq(project)` in the project detail page template");
    }
    if (faqResult.microMarketFaqFileWritten) {
      lines.push(`- \`src/data/seo/micromarket-faqs.ts\` — covers ~${faqResult.microMarketCount} micro-market pages`);
      lines.push("  → **Action needed:** Import and call `generateMicroMarketFaq(microMarket, projects)` in the micro-market page template");
    }
    lines.push("");
  }

  // ── Backlink Audit ──
  if (backlinkResult?.ourIndexedPages > 0 || backlinkResult?.brandMentions > 0) {
    lines.push("### 🔗 Backlink & Authority Signals");
    lines.push("");
    lines.push(`| Signal | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Our indexed pages | ${backlinkResult.ourIndexedPages?.toLocaleString() || "—"} |`);
    lines.push(`| Brand mentions (non-site) | ${backlinkResult.brandMentions || 0} |`);
    lines.push(`| Linkable assets (projects+markets) | ${backlinkResult.linkableAssets || 0} |`);
    if (backlinkResult.competitorScale?.length > 0) {
      lines.push("");
      lines.push("**Competitor content scale:**");
      for (const c of backlinkResult.competitorScale) {
        lines.push(`- \`${c.domain}\` — ${c.indexedPages?.toLocaleString() || "unknown"} indexed pages`);
      }
    }
    if (backlinkResult.topMentioningDomains?.length > 0) {
      lines.push("");
      lines.push("**Top domains mentioning us:** " + backlinkResult.topMentioningDomains.slice(0, 5).join(", "));
    }
    lines.push("");
  }

  // ── SERP Features ──
  if (serpFeaturesResult?.keywordsChecked > 0) {
    lines.push("### ✨ SERP Feature Opportunities");
    lines.push("");
    lines.push(`Checked **${serpFeaturesResult.keywordsChecked}** keywords | We own **${serpFeaturesResult.weOwnSnippets}** featured snippet(s)`);
    lines.push("");
    lines.push(`| Opportunity | Count |`);
    lines.push(`|-------------|-------|`);
    lines.push(`| Featured snippets to steal | ${serpFeaturesResult.featuredSnippetOpportunities} |`);
    lines.push(`| PAA box opportunities | ${serpFeaturesResult.paaOpportunities} |`);
    lines.push(`| Local pack presence | ${serpFeaturesResult.localPackPresence} |`);
    if (serpFeaturesResult.topOpportunities?.length > 0) {
      lines.push("");
      lines.push("**Top SERP feature targets:**");
      for (const o of serpFeaturesResult.topOpportunities.slice(0, 5)) {
        lines.push(`- "${o.keyword}" → **${o.opportunity}** (top competitor: ${o.top_competitor || "—"})`);
      }
    }
    lines.push("");
  }

  // ── Keyword Difficulty ──
  if (keywordDifficultyResult?.keywordsScored > 0) {
    lines.push("### 🎯 Keyword Difficulty Scores");
    lines.push("");
    lines.push(`Scored **${keywordDifficultyResult.keywordsScored}** keyword gaps:`);
    lines.push(`- 🟢 LOW (quick wins): ${keywordDifficultyResult.lowDifficulty} keywords`);
    lines.push(`- 🟡 MEDIUM (1-3 months): ${keywordDifficultyResult.mediumDifficulty} keywords`);
    lines.push(`- 🔴 HIGH (6+ months): ${keywordDifficultyResult.highDifficulty} keywords`);
    if (keywordDifficultyResult.quickWinKeywords?.length > 0) {
      lines.push("");
      lines.push("**Quick win keywords (LOW difficulty + pos 11-30):**");
      lines.push("");
      lines.push("| Keyword | Position | Opportunity Score |");
      lines.push("|---------|----------|------------------|");
      for (const k of keywordDifficultyResult.quickWinKeywords.slice(0, 8)) {
        lines.push(`| ${k.keyword} | ${k.our_position?.toFixed(1) || "—"} | ${k.opportunity_score} |`);
      }
    }
    lines.push("");
  }

  // ── Content Scores ──
  if (contentScorerResult?.projectsScored > 0 || contentScorerResult?.microMarketsScored > 0) {
    lines.push("### 📝 Content Quality Scores");
    lines.push("");
    lines.push(`| Entity | Scored | Avg Score | Below 50 |`);
    lines.push(`|--------|--------|-----------|----------|`);
    lines.push(`| Projects | ${contentScorerResult.projectsScored} | ${contentScorerResult.avgProjectScore?.toFixed(0)}/100 | ${contentScorerResult.lowScoreProjects} |`);
    lines.push(`| Micro-markets | ${contentScorerResult.microMarketsScored} | ${contentScorerResult.avgMicroMarketScore?.toFixed(0)}/100 | ${contentScorerResult.lowScoreMicroMarkets} |`);
    if (contentScorerResult.topIssues?.length > 0) {
      lines.push("");
      lines.push("**Lowest-scoring pages (need content improvement):**");
      for (const issue of contentScorerResult.topIssues.slice(0, 6)) {
        lines.push(`- \`${issue.entity_type}/${issue.entity_slug}\` — Score: **${issue.score}/100** | Missing: ${(issue.missing_fields || []).join(", ")}`);
        if (issue.claude_suggestion) {
          lines.push(`  > 💡 ${issue.claude_suggestion}`);
        }
      }
    }
    lines.push("");
  }

  // ── CrUX Audit ──
  if (cruxResult?.urlsWithData > 0) {
    lines.push("### ⚡ Real-User Core Web Vitals (CrUX)");
    lines.push("");
    lines.push(`Checked **${cruxResult.urlsChecked}** URLs | **${cruxResult.urlsWithData}** with real-user data`);
    lines.push("");
    lines.push(`| Status | Pages |`);
    lines.push(`|--------|-------|`);
    lines.push(`| ✅ Good | ${cruxResult.urlsGood} |`);
    lines.push(`| ⚠️ Needs Improvement | ${cruxResult.urlsNeedsImprovement} |`);
    lines.push(`| ❌ Poor | ${cruxResult.urlsPoor} |`);
    if (cruxResult.worstPages?.length > 0) {
      lines.push("");
      lines.push("**Pages with poorest CWV (need immediate attention):**");
      lines.push("");
      lines.push("| Page | LCP | INP | CLS | Status |");
      lines.push("|------|-----|-----|-----|--------|");
      for (const p of cruxResult.worstPages.slice(0, 8)) {
        const short = p.url.replace("https://www.westsiderealty.in", "") || "/";
        const lcp = p.lcp_p75 ? `${(p.lcp_p75 / 1000).toFixed(1)}s` : "—";
        const inp = p.inp_p75 ? `${p.inp_p75}ms` : "—";
        const cls = p.cls_p75 != null ? p.cls_p75 : "—";
        lines.push(`| \`${short}\` | ${lcp} | ${inp} | ${cls} | ${p.overall_status} |`);
      }
    }
    lines.push("");
  }

  // ── Indexing ──
  if (indexingResults && indexingResults.length > 0) {
    const succeeded = indexingResults.filter((r) => r.success).length;
    lines.push("### 🔍 Phase 3: Indexing Requests");
    lines.push(`Submitted **${succeeded}/${indexingResults.length}** URL(s) to Google Indexing API.`);
    lines.push("");
  }

  // ── Sitemap ──
  if (sitemapResult) {
    lines.push("### 🗺️ Phase 4: Sitemap");
    lines.push(
      sitemapResult.success
        ? "✅ Sitemap re-submitted to Google Search Console."
        : `⚠️ Sitemap submission failed: ${sitemapResult.error}`
    );
    lines.push("");
  }

  lines.push("---");
  lines.push("*Generated by the SEO Agent — [westsiderealty.in](https://www.westsiderealty.in)*");

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.error("[agent] ╔═══════════════════════════════════════════╗");
  console.error("[agent] ║  Westside Realty SEO Agent starting...   ║");
  console.error("[agent] ╚═══════════════════════════════════════════╝");

  const startTime = Date.now();

  let codeFindings = null;
  let codeFix = { applied: [], total: 0 };
  let ctrResult = null;
  let metaFixes = [];
  let schemaGaps = [];
  let onPageResult = { summary: {}, findings: [] };
  let dbContentResult = { summary: { totalIssues: 0, critical: 0, high: 0 }, issues: [] };
  let ctrTrends = [];
  let competitorResult = { gscOpportunities: 0, totalGaps: 0, topOpportunities: [] };
  let contentGaps = { quickWins: [], missingPages: [], decliningPages: [], ctrOpportunities: [], summary: {} };
  let faqResult = { projectFaqFileWritten: false, microMarketFaqFileWritten: false };
  let positionResult = { keywordsTracked: 0, keywordsFound: 0, drops: [], improvements: [] };
  let backlinkResult = { ourIndexedPages: 0, brandMentions: 0, topMentioningDomains: [], competitorScale: [], linkableAssets: 0, summary: "" };
  let serpFeaturesResult = { keywordsChecked: 0, featuredSnippetOpportunities: 0, paaOpportunities: 0, localPackPresence: 0, weOwnSnippets: 0, topOpportunities: [], summary: "" };
  let keywordDifficultyResult = { keywordsScored: 0, lowDifficulty: 0, mediumDifficulty: 0, highDifficulty: 0, quickWinKeywords: [], summary: "" };
  let contentScorerResult = { projectsScored: 0, microMarketsScored: 0, avgProjectScore: 0, avgMicroMarketScore: 0, lowScoreProjects: 0, lowScoreMicroMarkets: 0, claudeSuggestionsGenerated: 0, topIssues: [], summary: "" };
  let cruxResult = { urlsChecked: 0, urlsWithData: 0, urlsGood: 0, urlsNeedsImprovement: 0, urlsPoor: 0, worstPages: [], summary: "" };
  let indexingResults = [];
  let sitemapResult = null;

  // Phase 1: Code audit
  if (!GSC_ONLY) {
    codeFindings = await runCodeAudit();
    codeFix = await runCodeFix(codeFindings);
  }

  // Phase 2: GSC-driven + intelligence phases
  if (!CODE_ONLY) {
    const gscResults = await runGscPhases();
    ctrResult = gscResults.ctrResult;
    metaFixes = gscResults.metaFixes;
    schemaGaps = gscResults.schemaGaps;
    onPageResult = gscResults.onPageResult;
    dbContentResult = gscResults.dbContentResult;
    ctrTrends = gscResults.ctrTrends;
    competitorResult = gscResults.competitorResult;
    contentGaps = gscResults.contentGaps;
    faqResult = gscResults.faqResult;
    positionResult = gscResults.positionResult;
    backlinkResult = gscResults.backlinkResult;
    serpFeaturesResult = gscResults.serpFeaturesResult;
    keywordDifficultyResult = gscResults.keywordDifficultyResult;
    contentScorerResult = gscResults.contentScorerResult;
    cruxResult = gscResults.cruxResult;
  }

  // Phase 3: Index changed pages
  if (!CODE_ONLY) {
    indexingResults = await indexChangedPages(metaFixes);
  }

  // Phase 4: Submit sitemap
  if (!CODE_ONLY) {
    sitemapResult = await submitSitemapToGsc();
  }

  // Phase 5: Generate PR body
  const prBody = await generatePrBody({
    codeFindings, codeFix, ctrResult, metaFixes, schemaGaps, onPageResult,
    dbContentResult, ctrTrends, competitorResult, contentGaps, faqResult, positionResult,
    backlinkResult, serpFeaturesResult, keywordDifficultyResult, contentScorerResult, cruxResult,
    indexingResults, sitemapResult,
  });

  if (!DRY_RUN) {
    fs.writeFileSync(".seo-pr-body.md", prBody, "utf8");
    console.error("\n[agent] PR body written to .seo-pr-body.md");
  }

  // JSON summary to stdout (for GitHub Actions output parsing)
  const summary = {
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    dryRun: DRY_RUN,
    // Phase 1
    codeFixesApplied: codeFix.total,
    // Phase 2
    metaTemplatesOptimized: metaFixes.length,
    schemaGapsFound: schemaGaps.length,
    schemaGapsHigh: schemaGaps.filter((g) => g.severity === "high").length,
    onPageIssues: (onPageResult?.findings?.length || 0),
    onPageCritical: onPageResult?.summary?.critical || 0,
    onPageHigh: onPageResult?.summary?.high || 0,
    dbContentIssues: dbContentResult?.summary?.totalIssues || 0,
    dbContentCritical: dbContentResult?.summary?.critical || 0,
    ctrDropAlerts: ctrTrends?.length || 0,
    keywordGaps: competitorResult?.totalGaps || 0,
    quickWins: contentGaps?.quickWins?.length || 0,
    missingLocalities: contentGaps?.missingPages?.length || 0,
    keywordsTracked: positionResult?.keywordsTracked || 0,
    keywordDrops: positionResult?.drops?.length || 0,
    faqFilesUpdated: (faqResult?.projectFaqFileWritten ? 1 : 0) + (faqResult?.microMarketFaqFileWritten ? 1 : 0),
    // New phases
    ourIndexedPages: backlinkResult?.ourIndexedPages || 0,
    brandMentions: backlinkResult?.brandMentions || 0,
    featuredSnippetOpportunities: serpFeaturesResult?.featuredSnippetOpportunities || 0,
    weOwnSnippets: serpFeaturesResult?.weOwnSnippets || 0,
    keywordDifficultyScored: keywordDifficultyResult?.keywordsScored || 0,
    lowDifficultyKeywords: keywordDifficultyResult?.lowDifficulty || 0,
    contentLowScorePages: (contentScorerResult?.lowScoreProjects || 0) + (contentScorerResult?.lowScoreMicroMarkets || 0),
    cruxUrlsChecked: cruxResult?.urlsChecked || 0,
    cruxUrlsPoor: cruxResult?.urlsPoor || 0,
    // Phase 3-4
    urlsIndexed: indexingResults.filter((r) => r.success).length,
    sitemapSubmitted: sitemapResult?.success || false,
    // Site metrics
    siteMetrics: ctrResult?.siteMetrics || null,
    priorityPagesFound: ctrResult?.priorityPages?.length || 0,
    hasChanges: codeFix.total > 0 || metaFixes.length > 0 || (faqResult?.projectFaqFileWritten) || (faqResult?.microMarketFaqFileWritten),
  };

  console.log(JSON.stringify(summary, null, 2));

  console.error(
    `\n[agent] Done in ${((Date.now() - startTime) / 1000).toFixed(1)}s. ` +
    `${summary.codeFixesApplied} code fix(es), ${summary.metaTemplatesOptimized} meta template(s) updated.`
  );

  // Exit 0 always — GitHub Actions reads summary.hasChanges to decide on PR
  process.exit(0);
}

main().catch((err) => {
  console.error("[agent] Fatal error:", err);
  process.exit(1);
});
