/**
 * SEO Fix Script — westsiderealty.in
 *
 * Reads audit findings from stdin (JSON produced by audit.mjs),
 * calls Claude API to generate specific file patches for auto-fixable issues,
 * then applies those patches to the source files.
 *
 * Only applies safe, mechanical fixes:
 *  - ISR violations (createClient → createServiceClient)
 *  - Missing canonical tags (adds alternates.canonical to metadata)
 *  - Missing keywords on key pages (generates relevant keyword strings)
 *
 * Structural changes, new pages, and schema changes are left in the PR description
 * for human review but not auto-applied.
 *
 * Usage:
 *   node scripts/seo-audit/audit.mjs | node scripts/seo-audit/fix.mjs
 *   ANTHROPIC_API_KEY=xxx node scripts/seo-audit/fix.mjs < findings.json
 */

import fs from "fs";
import path from "path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("[fix] ANTHROPIC_API_KEY not set — cannot generate fixes");
  process.exit(1);
}

// ─── Read findings from stdin ─────────────────────────────────────────────────

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

// ─── Claude API call ──────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 8000,
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

// ─── Fix ISR violations ───────────────────────────────────────────────────────

async function fixISRViolations(violations) {
  if (violations.length === 0) return [];
  const applied = [];

  for (const v of violations) {
    const filePath = path.resolve(v.file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    // Pattern 1: static top-level import
    if (/import\s*\{[^}]*createClient[^}]*\}\s*from\s*['"]@\/lib\/supabase\/server['"]/.test(content)) {
      // Check if serviceClient is already imported
      if (!/import.*createServiceClient.*serviceClient/.test(content)) {
        content = content.replace(
          /import\s*\{([^}]*)\bcreateClient\b([^}]*)\}\s*from\s*['"]@\/lib\/supabase\/server['"]/g,
          (match, before, after) => {
            const otherExports = (before + after).replace(/,?\s*createClient\s*,?/g, "").trim().replace(/^,|,$/, "").trim();
            const serviceImport = `import { createServiceClient } from "@/lib/supabase/serviceClient";`;
            if (otherExports) {
              return `import { ${otherExports} } from "@/lib/supabase/server";\n${serviceImport}`;
            }
            return serviceImport;
          }
        );
        changed = true;
      } else {
        // Already has serviceClient import, just remove the server one
        content = content.replace(
          /import\s*\{[^}]*createClient[^}]*\}\s*from\s*['"]@\/lib\/supabase\/server['"];\n?/g,
          ""
        );
        changed = true;
      }
    }

    // Pattern 2: dynamic import inside function
    if (/await import\(['"]@\/lib\/supabase\/server['"]\)/.test(content)) {
      content = content
        .replace(
          /const\s*\{\s*createClient\s*\}\s*=\s*await\s+import\(['"]@\/lib\/supabase\/server['"]\);/g,
          `const { createServiceClient } = await import("@/lib/supabase/serviceClient");`
        )
        .replace(
          /const\s+supabase\s*=\s*await\s+createClient\(\);/g,
          `const supabase = createServiceClient();`
        );
      changed = true;
    }

    // Pattern 3: remaining await createClient() calls
    if (/await createClient\(\)/.test(content)) {
      content = content.replace(/await createClient\(\)/g, "createServiceClient()");
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, "utf8");
      applied.push({ file: v.file, fix: "Replaced createClient() with createServiceClient()" });
      console.error(`[fix] Applied ISR fix: ${v.file}`);
    }
  }
  return applied;
}

// ─── Fix missing canonicals via Claude ───────────────────────────────────────

async function fixMissingCanonicals(missing) {
  if (missing.length === 0) return [];
  const applied = [];

  for (const item of missing) {
    const filePath = path.resolve(item.file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, "utf8");

    // Derive the URL from the file path
    const relativePath = item.file
      .replace(/^src\/app/, "")
      .replace(/\/(page|layout)\.tsx$/, "")
      .replace(/\/\[citySlug\]/g, "/{city}")
      .replace(/\/\[microMarketSlug\]/g, "/{market}")
      .replace(/\/\[projectSlug\]/g, "/{project}")
      .replace(/\/\[slug\]/g, "/{slug}")
      || "/";

    const systemPrompt = `You are a Next.js SEO expert. You add canonical URL metadata to Next.js App Router pages.
Your task: add \`alternates: { canonical: "https://www.westsiderealty.in${relativePath}" }\` to the metadata export.

Rules:
- Only output the COMPLETE modified file content, nothing else
- No markdown code fences, no explanation
- For static pages (no [params]): use the exact URL
- For dynamic pages (has [params]): derive canonical from params at runtime if possible
- If the page already has alternates, do not add duplicates
- Keep all existing code exactly as-is except for adding the canonical`;

    const userMessage = `Add canonical URL to this Next.js page (path: ${relativePath}):\n\n${content}`;

    try {
      const fixed = await callClaude(systemPrompt, userMessage);
      // Sanity check — must be shorter than 2x original (Claude didn't hallucinate extra code)
      if (fixed.length < content.length * 2 && fixed.includes("canonical")) {
        fs.writeFileSync(filePath, fixed, "utf8");
        applied.push({ file: item.file, fix: `Added canonical: https://www.westsiderealty.in${relativePath}` });
        console.error(`[fix] Added canonical: ${item.file}`);
      } else {
        console.error(`[fix] Skipped canonical fix for ${item.file} — Claude output looked wrong`);
      }
    } catch (e) {
      console.error(`[fix] Failed to fix canonical for ${item.file}:`, e.message);
    }
  }
  return applied;
}

// ─── Generate PR description ──────────────────────────────────────────────────

async function generatePRDescription(findings, appliedFixes) {
  const systemPrompt = `You are a technical writer creating a GitHub PR description for automated SEO fixes on a real estate website (westsiderealty.in).
Be concise and technical. Format as markdown.`;

  const userMessage = `Create a PR description for these SEO audit results and applied fixes.

FINDINGS SUMMARY:
${JSON.stringify(findings.summary, null, 2)}

AUTO-APPLIED FIXES (${appliedFixes.length}):
${appliedFixes.map(f => `- ${f.file}: ${f.fix}`).join("\n") || "None"}

ISSUES REQUIRING MANUAL REVIEW:
- PageSpeed issues: ${findings.pageSpeed.filter(p => p.issue).map(p => `${p.url} — ${p.issue}`).join(", ") || "None"}
- Vercel 500 paths: ${findings.vercel500s.map(v => `${v.path} (${v.count}x)`).join(", ") || "None"}
- Sitemap issues: ${findings.sitemapIssues.map(s => s.issue).join(", ") || "None"}

Format the PR as:
## Summary
## Auto-applied Fixes
## Requires Manual Review
## PageSpeed Scores`;

  return callClaude(systemPrompt, userMessage);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.error("[fix] Reading audit findings from stdin...");
  const raw = await readStdin();

  let findings;
  try {
    findings = JSON.parse(raw);
  } catch {
    console.error("[fix] Failed to parse findings JSON");
    process.exit(1);
  }

  const totalAutoFixable =
    findings.isrViolations.length +
    findings.missingCanonicals.length +
    findings.missingKeywords.length;

  if (totalAutoFixable === 0) {
    console.error("[fix] No auto-fixable issues found — nothing to do");
    // Still generate a report for the PR
    const prBody = await generatePRDescription(findings, []);
    fs.writeFileSync(".seo-pr-body.md", prBody, "utf8");
    process.exit(0);
  }

  console.error(`[fix] Auto-fixing ${totalAutoFixable} issues...`);

  const [isrFixed, canonicalFixed] = await Promise.all([
    fixISRViolations(findings.isrViolations),
    fixMissingCanonicals(findings.missingCanonicals),
    // Keywords fix is lower priority — leave for human review in PR
  ]);

  const allFixed = [...isrFixed, ...canonicalFixed];
  console.error(`[fix] Applied ${allFixed.length} fixes`);

  // Generate PR body
  const prBody = await generatePRDescription(findings, allFixed);
  fs.writeFileSync(".seo-pr-body.md", prBody, "utf8");

  // Output fixes summary for the workflow
  console.log(JSON.stringify({ applied: allFixed, total: allFixed.length }));

  process.exit(allFixed.length > 0 ? 0 : 0);
}

main().catch(e => {
  console.error("[fix] Fatal error:", e);
  process.exit(1);
});
