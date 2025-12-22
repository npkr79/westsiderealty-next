#!/usr/bin/env tsx
/**
 * Script to immediately regenerate sitemap and submit to Google Search Console
 * 
 * Usage:
 *   npm run submit-sitemap
 *   or
 *   tsx scripts/submit-sitemap.ts
 * 
 * This script:
 * 1. Triggers sitemap regeneration
 * 2. Submits sitemap to Google Search Console
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.westsiderealty.in";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;
const API_URL = process.env.NEXT_PUBLIC_API_URL || BASE_URL;

async function submitSitemap() {
  console.log("🔄 Regenerating sitemap and submitting to Google Search Console...");
  console.log(`📍 Sitemap URL: ${SITEMAP_URL}`);
  console.log(`🔗 API Endpoint: ${API_URL}/api/sitemap/regenerate\n`);

  try {
    // Step 1: Regenerate sitemap by fetching it
    console.log("Step 1: Regenerating sitemap...");
    const sitemapResponse = await fetch(SITEMAP_URL, {
      method: "GET",
      headers: {
        "User-Agent": "WestsideRealty-SitemapBot/1.0",
      },
      cache: "no-store",
    });

    if (!sitemapResponse.ok) {
      throw new Error(`Failed to regenerate sitemap: ${sitemapResponse.status} ${sitemapResponse.statusText}`);
    }

    const sitemapContent = await sitemapResponse.text();
    console.log("✅ Sitemap regenerated successfully");
    console.log(`   Size: ${(sitemapContent.length / 1024).toFixed(2)} KB\n`);

    // Step 2: Submit to Google Search Console via API
    console.log("Step 2: Submitting to Google Search Console...");
    const apiKey = process.env.SITEMAP_API_KEY;
    const response = await fetch(`${API_URL}/api/sitemap/regenerate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Successfully submitted to Google Search Console!");
      console.log(`   Message: ${data.message}`);
      if (data.gscSubmission) {
        console.log(`   GSC Status: ${data.gscSubmission.message}`);
      }
    } else {
      console.log("⚠️  Sitemap regenerated but GSC submission had issues:");
      console.log(`   ${data.message}`);
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
    }

    console.log(`\n📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🌐 Sitemap: ${SITEMAP_URL}`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
submitSitemap();

