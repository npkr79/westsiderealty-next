import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const allowedRoles = new Set(["admin"]);

export interface IdeaObject {
  title: string;
  hook: string;
  key_data_points: string[];
  target_audience: string;
}

function buildSystemPrompt(todayLabel: string): string {
  return `You are a real estate market analyst and content strategist for Westside Realty, a premium brokerage operating in Hyderabad and Goa, India.

Today's date: ${todayLabel}

COMPANY CONTEXT:
- Markets: Hyderabad (western IT corridor) and Goa (luxury/holiday homes)
- Hyderabad micro-markets: Kokapet, Financial District, Gachibowli, Kondapur, Madhapur, Narsingi, Tellapur, Miyapur, Kompally
- Goa micro-markets: Assagao, Siolim, Anjuna, Vagator, Morjim, Mandrem, Parra, Candolim, Calangute

AUDIENCE: HNI investors, NRI buyers, serious home buyers, second-home buyers

CONTENT FORMAT:
- Instagram Reels and YouTube Shorts
- Duration: 60-70 seconds when narrated
- Tone: Professional, data-driven, practical, non-promotional
- Style: Educational — like a trusted analyst, not a salesman

STRICT RULES:
- Primary focus is Hyderabad and Goa
- Can cover other Indian cities or international markets (Dubai, Mumbai etc.)
  when the topic explicitly mentions them or when market comparison adds value
- Never mention irrelevant cities unprompted
- Never use "guaranteed returns" language
- Always include specific numbers, percentages, price ranges
- Ideas must be executable as a 60-70 second voiceover video
- If topic asks for top 3 — give exactly 3 focused areas
- If topic asks for top 5 — give exactly 5 focused areas
- Use current market knowledge as of today's date

PROVEN CONTENT STYLE — match this tone and specificity:

Example 1 (Hyderabad):
Topic: ₹1 crore budget in Hyderabad
Good idea: "₹1 Crore in Hyderabad — What Do You Actually Get?"
Hook: "Most buyers think ₹1 crore gets a spacious 3BHK everywhere. The reality is very different."
Key data points: Kompally 3BHK at ₹1Cr, Kondapur tight 3BHK at ₹1Cr, Kokapet minimum ₹1.8Cr for 3BHK

Example 2 (Goa):
Topic: Which area in Goa is giving best ROI right now
Good idea: "Which Goa Micro-Market Gives the Best ROI Right Now?"
Hook: "Not all Goa investments perform the same. Assagao, Siolim and Vagator each offer a completely different return profile."
Key data points: Assagao luxury appreciation, Vagator Airbnb yields, Siolim affordable entry with fast growth`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      topic: string;
      target_audience?: string;
      content_type?: string;
      count?: number;
      project_id?: string;
    };

    const { topic, target_audience: targetAudience, count = 5, project_id } = body;
    if (!topic?.trim()) return NextResponse.json({ error: "Missing topic" }, { status: 400 });

    const todayLabel = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const systemPrompt = buildSystemPrompt(todayLabel);

    const userMessage = `Generate exactly ${count} video ideas for this topic: "${topic}"
Target audience: ${targetAudience || "HNI investors, NRI buyers, serious home buyers"}

Return ONLY a valid JSON array of exactly ${count} idea objects. Each object must have:
- "title": the video title
- "hook": the opening hook sentence
- "key_data_points": array of 3-5 specific data points with numbers
- "target_audience": who this video is for

No markdown. No explanation.`;

    const start = Date.now();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-search-preview",
        web_search_options: {},
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });
    const duration_ms = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      console.error("[content-ideas] OpenAI error:", res.status, errText);
      return NextResponse.json({ error: "OpenAI API error" }, { status: 500 });
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "[]";

    let ideas: IdeaObject[] = [];
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      ideas = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("[content-ideas] JSON parse error:", err, "raw:", raw);
      ideas = [];
    }

    const supabase = createServiceClient();

    await supabase.from("content_generation_logs" as never).insert({
      project_id: project_id ?? null,
      step: "ideas",
      model: "gpt-4o-search-preview",
      duration_ms,
      success: true,
    } as never);

    if (project_id) {
      await supabase
        .from("content_projects" as never)
        .update({ ideas, status: "ideas", updated_at: new Date().toISOString() } as never)
        .eq("id" as never, project_id);
    }

    return NextResponse.json({ ideas });
  } catch (err) {
    console.error("[content-ideas] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
