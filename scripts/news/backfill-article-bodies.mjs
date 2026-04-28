/**
 * One-off backfill: fetch and store full_text for news_articles rows that
 * were inserted before the scraper started capturing article bodies.
 *
 * Usage:
 *   node --env-file=.env.local scripts/news/backfill-article-bodies.mjs
 *   node --env-file=.env.local scripts/news/backfill-article-bodies.mjs --dry-run
 */

import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// Inline copy of the fetcher logic so this script doesn't need a build step.
const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_LENGTH = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
function stripTags(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");
}
function normalize(text) {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}
function extractMain(html) {
  const cleaned = html
    .replace(/<header\b[\s\S]*?<\/header>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, " ");
  const a = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (a && a[1].length > 500) return stripTags(a[1]);
  const m = cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (m && m[1].length > 500) return stripTags(m[1]);
  const ps = cleaned.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi);
  if (ps && ps.length > 0) return ps.map(stripTags).join(" ");
  return stripTags(cleaned);
}
async function fetchBody(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: c.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    if (!r.ok) return null;
    if (!(r.headers.get("content-type") ?? "").includes("html")) return null;
    const html = await r.text();
    if (!html) return null;
    const text = normalize(extractMain(html));
    if (text.length < 200) return null;
    return text.length > MAX_BODY_LENGTH ? text.slice(0, MAX_BODY_LENGTH) : text;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const { data: articles, error } = await supabase
    .from("news_articles")
    .select("id, headline, source_url, full_text")
    .or("full_text.is.null,full_text.eq.")
    .order("scraped_at", { ascending: false });
  if (error) {
    console.error("fetch error:", error.message);
    process.exit(1);
  }
  console.log(`[backfill] articles needing body: ${articles.length} (dry_run=${DRY_RUN})`);

  let success = 0;
  let fail = 0;
  for (const a of articles) {
    process.stdout.write(`  ${a.headline.slice(0, 70)}... `);
    const body = await fetchBody(a.source_url);
    if (!body) {
      console.log("FAIL");
      fail++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`OK (${body.length} chars, dry-run)`);
      success++;
      continue;
    }
    const { error: upErr } = await supabase
      .from("news_articles")
      .update({ full_text: body })
      .eq("id", a.id);
    if (upErr) {
      console.log(`UPDATE FAIL: ${upErr.message}`);
      fail++;
    } else {
      console.log(`OK (${body.length} chars)`);
      success++;
    }
  }
  console.log(`[backfill] success=${success} fail=${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
