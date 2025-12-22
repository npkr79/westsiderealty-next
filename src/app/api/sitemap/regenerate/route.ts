import { NextRequest, NextResponse } from "next/server";
import { googleSearchConsoleService } from "@/services/googleSearchConsoleService";

const BASE_URL = "https://www.westsiderealty.in";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

/**
 * API Route: POST /api/sitemap/regenerate
 * 
 * Regenerates sitemap and submits to Google Search Console
 * This endpoint:
 * 1. Triggers Next.js sitemap regeneration (by accessing /sitemap.xml)
 * 2. Submits the sitemap to Google Search Console
 * 
 * Usage:
 * - Manual trigger: POST /api/sitemap/regenerate
 * - Cron job: Set up to call this endpoint regularly
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request (optional: add API key authentication)
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.SITEMAP_API_KEY;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Step 1: Trigger sitemap regeneration by fetching it
    // Next.js will regenerate the sitemap on-demand
    try {
      const sitemapResponse = await fetch(SITEMAP_URL, {
        method: "GET",
        headers: {
          "User-Agent": "WestsideRealty-SitemapBot/1.0",
        },
        cache: "no-store", // Force regeneration
      });

      if (!sitemapResponse.ok) {
        throw new Error(`Failed to regenerate sitemap: ${sitemapResponse.status}`);
      }

      const sitemapContent = await sitemapResponse.text();
      console.log("Sitemap regenerated successfully");
    } catch (error: any) {
      console.error("Error regenerating sitemap:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to regenerate sitemap",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Step 2: Submit to Google Search Console
    const gscResult = await googleSearchConsoleService.submitSitemap(SITEMAP_URL);

    return NextResponse.json({
      success: gscResult.success,
      message: gscResult.success
        ? "Sitemap regenerated and submitted to Google Search Console"
        : "Sitemap regenerated but GSC submission failed",
      sitemapUrl: SITEMAP_URL,
      gscSubmission: gscResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in sitemap regeneration API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing
 */
export async function GET() {
  return NextResponse.json({
    message: "Sitemap regeneration and submission endpoint",
    sitemapUrl: SITEMAP_URL,
    usage: "POST to this endpoint to regenerate sitemap and submit to GSC",
  });
}

