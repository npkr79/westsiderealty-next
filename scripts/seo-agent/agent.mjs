/**
 * SEO Agent — westsiderealty.in
 *
 * Master orchestrator. Runs the full SEO pipeline in order:
 *
 *   Phase 1 — Code Audit (existing scripts)
 *     a. audit.mjs  — ISR violations, missing canonicals, missing keywords, PageSpeed, Vercel 500s
 *     b. fix.mjs    — Auto-apply safe code fixes (ISR, canonicals)
 *
 *   Phase 2 — GSC-Driven Optimization (new scripts)
 *     c. ctr-audit       — Pull 28-day GSC data, find high-impression / low-CTR pages
 *     d. meta-optimizer  — Claude rewrites title/description per template, grounded in real queries
 *     e. schema-gaps     — Identify missing structured data (reported, not auto-applied)
 *
 *   Phase 3 — Index Updated Pages
 *     f. indexing-api    — Submit changed pages to Google Indexing API
 *
 *   Phase 4 — Submit Sitemap
 *     g. gsc-client      — Re-submit sitemap.xml to GSC
 *
 *   Phase 5 — Report
 *     h. Generate .seo-pr-body.md with full context for GitHub PR
 *
 * Usage:
 *   node scripts/seo-agent/agent.mjs
 *   node scripts/seo-agent/agent.mjs --code-only     (skip GSC phases)
 *   node scripts/seo-agent/agent.mjs --gsc-only      (skip code audit phases)
 *   node scripts/seo-agent/agent.mjs --dry-run       (audit + analyze, no file writes)
 *   node scripts/seo-agent/agent.mjs --no-index      (skip Indexing API)
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SITE_URL           (default: https://www.westsiderealty.in)
 *   PAGESPEED_API_KEY         (optional, for PageSpeed checks)
 *   VERCEL_TOKEN              (optional, for 500 error checks)
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";

import { runCtrAudit } from "./ctr-audit.mjs";
import { runMetaOptimizer } from "./meta-optimizer.mjs";
import { runSchemaAudit } from "./schema-gaps.mjs";
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

  return { ctrResult, metaFixes, schemaGaps };
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

async function generatePrBody({ codeFindings, codeFix, ctrResult, metaFixes, schemaGaps, indexingResults, sitemapResult }) {
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

  // ── Schema gaps ──
  lines.push("### 🏗️ Phase 2b: Schema Gaps (manual action needed)");
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
  let indexingResults = [];
  let sitemapResult = null;

  // Phase 1: Code audit
  if (!GSC_ONLY) {
    codeFindings = await runCodeAudit();
    codeFix = await runCodeFix(codeFindings);
  }

  // Phase 2: GSC-driven optimization
  if (!CODE_ONLY) {
    const gscResults = await runGscPhases();
    ctrResult = gscResults.ctrResult;
    metaFixes = gscResults.metaFixes;
    schemaGaps = gscResults.schemaGaps;
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
    codeFindings,
    codeFix,
    ctrResult,
    metaFixes,
    schemaGaps,
    indexingResults,
    sitemapResult,
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
    codeFixesApplied: codeFix.total,
    metaTemplatesOptimized: metaFixes.length,
    schemaGapsFound: schemaGaps.length,
    schemaGapsHigh: schemaGaps.filter((g) => g.severity === "high").length,
    urlsIndexed: indexingResults.filter((r) => r.success).length,
    sitemapSubmitted: sitemapResult?.success || false,
    siteMetrics: ctrResult?.siteMetrics || null,
    priorityPagesFound: ctrResult?.priorityPages?.length || 0,
    hasChanges:
      codeFix.total > 0 || metaFixes.length > 0,
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
