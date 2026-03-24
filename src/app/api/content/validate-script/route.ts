import { NextRequest, NextResponse } from "next/server";
import { SCRIPT_SYSTEM_PROMPT } from "@/app/api/content/script/route";

const FORBIDDEN_PATTERNS = [
  /\d+\s*%\s*(annual|per\s*year|annually|guaranteed|assured)/gi,
  /guaranteed\s*(return|income|rental|appreciation)/gi,
  /assured\s*return/gi,
  /highest\s*roi/gi,
  /best\s*investment/gi,
  /exceptional\s*return/gi,
  /sure.shot/gi,
  /risk.free/gi,
  /massive\s*profit/gi,
];

const RISK_WORDS = [
  "risk", "depend", "occupancy", "season", "demand",
  "supply", "liquidity", "caveat", "however", "though",
  "variable", "fluctuat", "maintain", "holding",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { script: string; project_id?: string };
    const { script } = body;

    if (!script?.trim()) return NextResponse.json({ status: "PASS", script: "" });

    // STEP 1 — quick rule-based check
    const violations: string[] = [];

    const wordCount = script.trim().split(/\s+/).length;
    if (wordCount > 160) violations.push(`word_count_exceeded: ${wordCount} words (max 160)`);
    if (wordCount < 120) violations.push(`word_count_too_short: ${wordCount} words (min 120)`);
    for (const pattern of FORBIDDEN_PATTERNS) {
      pattern.lastIndex = 0; // reset global regex state
      if (pattern.test(script)) {
        violations.push(pattern.source);
      }
    }

    const lower = script.toLowerCase();
    const hasRisk = RISK_WORDS.some(w => lower.includes(w));
    if (!hasRisk) violations.push("missing_risk_disclosure");

    if (violations.length === 0) {
      return NextResponse.json({ status: "PASS", script });
    }

    // STEP 2 — AI validator (only if quick check failed)
    let issues: string[] = violations;

    try {
      const aiRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.4-mini",
          input: [
            {
              role: "system",
              content: "You are a compliance validator for real estate investment content in India. Return ONLY valid JSON.",
            },
            {
              role: "user",
              content: `Review this script for violations:
1. Unsupported percentage claims
2. Guaranteed/assured returns language
3. Overly promotional tone
4. Missing risk or constraint
5. Unrealistic pricing precision

Script: ${script}

Return ONLY: {"status":"PASS","issues":[]} or {"status":"FAIL","issues":["issue1","issue2"]}`,
            },
          ],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json() as { output?: Array<{ content?: Array<{ text?: string }> }> };
        const raw = aiData.output?.[0]?.content?.[0]?.text?.trim() ?? "";
        try {
          const parsed = JSON.parse(raw) as { status: string; issues: string[] };
          if (parsed.status === "PASS") {
            return NextResponse.json({ status: "PASS", script });
          }
          if (parsed.status === "FAIL" && Array.isArray(parsed.issues) && parsed.issues.length > 0) {
            issues = parsed.issues;
          }
        } catch {
          // parse failed — fail open
          return NextResponse.json({ status: "PASS", script });
        }
      }
    } catch (err) {
      console.error("[validate-script] AI validator failed:", err);
      return NextResponse.json({ status: "PASS", script });
    }

    // STEP 3 — auto-fix
    try {
      const fixRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.4",
          temperature: 0.3,
          input: [
            { role: "system", content: SCRIPT_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Rewrite this script to fix these issues:
${issues.join(", ")}

The script must be between 120 and 160 words. Current word count is ${wordCount} words. Adjust length as the first priority while fixing other issues.

Rules:
- Remove unsupported statistics — use ranges instead
- Replace guaranteed/promotional language with neutral phrasing
- Add one realistic risk or dependency naturally
- Keep original structure and meaning
- Keep 120-160 words
- Pure narration only — no formatting

Original script:
${script}`,
            },
          ],
        }),
      });

      if (fixRes.ok) {
        const fixData = await fixRes.json() as { output?: Array<{ content?: Array<{ text?: string }> }> };
        const fixedScript = fixData.output?.[0]?.content?.[0]?.text?.trim() ?? "";
        if (fixedScript) {
          return NextResponse.json({
            status: "FIXED",
            original_script: script,
            fixed_script: fixedScript,
            issues_found: issues,
          });
        }
      }
    } catch (err) {
      console.error("[validate-script] auto-fix failed:", err);
    }

    // Auto-fix failed — fail open
    return NextResponse.json({ status: "PASS", script });
  } catch (err) {
    console.error("[validate-script] error:", err);
    return NextResponse.json({ status: "PASS", script: "" });
  }
}
