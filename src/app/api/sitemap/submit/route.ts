import { NextRequest, NextResponse } from "next/server";
import { googleSearchConsoleService } from "@/services/googleSearchConsoleService";

const BASE_URL = "https://www.westsiderealty.in";
const SITEMAP_URL = `${BASE_URL}/sitemap.xml`;

/**
 * API Route: POST /api/sitemap/submit
 * 
 * Submits the sitemap to Google Search Console
 * Can be called manually or via cron job
 * 
 * Usage:
 * - Manual: POST /api/sitemap/submit
 * - Cron: Set up Vercel Cron or external cron service
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

    // Submit sitemap to Google Search Console
    const result = await googleSearchConsoleService.submitSitemap(SITEMAP_URL);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        sitemapUrl: SITEMAP_URL,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.error,
          sitemapUrl: SITEMAP_URL,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in sitemap submission API:", error);
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
    message: "Sitemap submission endpoint",
    sitemapUrl: SITEMAP_URL,
    usage: "POST to this endpoint to submit sitemap to Google Search Console",
  });
}

