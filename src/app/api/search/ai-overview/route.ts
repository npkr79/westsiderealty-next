import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { query, results, totalCount } = await req.json();

    if (!query || !results?.length) {
      return NextResponse.json({ overview: null });
    }

    // Build context from top 5 results
    const projectSummaries = results.slice(0, 5).map((r: any) => {
      const developerName = r.developer_brand || r.developer?.developer_name || 'Unknown developer';
      const marketName = r.micro_market?.micro_market_name || r.micro_market || 'Hyderabad';
      const priceStr = r.price_range_text
        ? r.price_range_text
        : r.price_min
          ? `₹${Math.round(r.price_min / 1000)}K–${Math.round((r.price_max || r.price_min) / 1000)}K psft`
          : 'price on request';
      const projectType = r.property_types?.[0] || 'project';
      const status = r.completion_status || r.status || 'status unknown';
      return `- ${r.project_name} by ${developerName} in ${marketName}: ${projectType}, ${status}, ${priceStr}`;
    }).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a Hyderabad real estate expert at Westside Realty.

User searched for: "${query}"
Total matching projects found: ${totalCount}
Top projects:
${projectSummaries}

Write a 2-3 sentence expert overview of this search result. Be specific about:
- What kind of projects are available (type, location, scale)
- The price range and market context
- One key insight buyers should know

Keep it conversational, factual, and under 60 words. No bullet points. No headers. Just flowing sentences.
Example style: "Kokapet offers 9 established villa communities, all ready-to-move, with prices ranging from ₹8,500 to ₹48,000 per sqft. These are low-density gated communities — most with under 100 units — anchored by Legend Chimes (₹15-20Cr) and Poulomi Aristos (₹12-16Cr). No new villa launches have happened here since 2022, making resale the only route."`,
      }],
    });

    const overview = message.content[0].type === 'text' ? message.content[0].text : null;
    return NextResponse.json({ overview });
  } catch (error: any) {
    console.error('[AIOverview] Error:', error);
    return NextResponse.json({ overview: null });
  }
}
