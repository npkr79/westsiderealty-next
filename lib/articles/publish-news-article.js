#!/usr/bin/env node
/**
 * Publish a news article to generated_articles and upload its hero image.
 *
 * Usage:
 *   node lib/articles/publish-news-article.js <image-path> <article-json-path>
 *
 * Or import and call publishNewsArticle() programmatically.
 *
 * article-json shape:
 * {
 *   slug:            string   (url-safe, e.g. "maharashtra-vpc-reform-2026")
 *   city:            string   ("maharashtra" | "india" | "hyderabad" | "mumbai" | ...)
 *   micro_market:    string   (e.g. "State Policy" | "Western Suburbs" | ...)
 *   seo_headline:    string   (article title shown on page)
 *   meta_description:string  (subtitle / OG description, ≤160 chars ideal)
 *   body:            string   (full article in Markdown — the page converts to HTML)
 *   target_persona:  string   (e.g. "Home Buyers & Investors")
 *   drip_placement:  string   ("awareness" | "consideration" | "decision")
 *   published_at:    string   (ISO date, e.g. "2026-04-25")
 * }
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://imqlfztriragzypplbqa.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWxmenRyaXJhZ3p5cHBsYnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg1NTQxMCwiZXhwIjoyMDYyNDMxNDEwfQ.YKK-usj8GIwOY6sZD203lY1FauidsZX6o_pH4xs_gTg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

async function uploadImage(imagePath, slug) {
  const ext = path.extname(imagePath).toLowerCase().replace(".", "") || "jpg";
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const fileName = `news/${slug}.${ext}`;

  console.log(`Uploading: ${imagePath} → blog-images/${fileName}`);
  const buffer = fs.readFileSync(imagePath);

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  console.log(`Image URL: ${data.publicUrl}`);
  return data.publicUrl;
}

async function publishNewsArticle(article, imageUrl) {
  const payload = {
    slug: article.slug,
    city: article.city,
    micro_market: article.micro_market,
    seo_headline: article.seo_headline,
    meta_description: article.meta_description,
    body: article.body,
    target_persona: article.target_persona,
    drip_placement: article.drip_placement || "awareness",
    whatsapp_summary: article.whatsapp_summary || article.meta_description,
    week_start: article.week_start || getMonday(article.published_at || new Date().toISOString().split("T")[0]),
    published_at: article.published_at || new Date().toISOString().split("T")[0],
    status: "published",
    image_url: imageUrl,
  };

  const { data: existing } = await supabase
    .from("generated_articles")
    .select("id")
    .eq("slug", article.slug)
    .maybeSingle();

  if (existing) {
    console.log(`Updating existing article id=${existing.id}…`);
    const { error } = await supabase
      .from("generated_articles")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw new Error(`Update failed: ${error.message}`);
    console.log("Updated.");
    return existing.id;
  }

  const { data, error } = await supabase
    .from("generated_articles")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);
  console.log(`Inserted id=${data.id}`);
  return data.id;
}

// ── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  const [, , imagePath, articleJsonPath] = process.argv;

  if (!imagePath || !articleJsonPath) {
    console.error(
      "Usage: node lib/articles/publish-news-article.js <image-path> <article-json-path>"
    );
    process.exit(1);
  }

  if (!fs.existsSync(imagePath))
    throw new Error(`Image not found: ${imagePath}`);
  if (!fs.existsSync(articleJsonPath))
    throw new Error(`Article JSON not found: ${articleJsonPath}`);

  const article = JSON.parse(fs.readFileSync(articleJsonPath, "utf8"));
  const imageUrl = await uploadImage(imagePath, article.slug);
  const id = await publishNewsArticle(article, imageUrl);

  console.log(
    `\nLive at: https://www.westsiderealty.in/news-articles/${article.slug}`
  );
  console.log(`Article ID: ${id}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}

module.exports = { uploadImage, publishNewsArticle };
