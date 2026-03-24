import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const allowedRoles = new Set(["admin"]);

interface SelectedIdea {
  title: string;
  hook: string;
  key_data_points?: string[];
  target_audience?: string;
}

function buildScriptSystemPrompt(todayLabel: string): string {
  return `You are a voiceover script writer for Westside Realty, Hyderabad and Goa real estate.

Today's date: ${todayLabel}

COMPANY CONTEXT:
- Markets: Hyderabad (western IT corridor) and Goa (luxury/holiday homes)
- Hyderabad micro-markets: Kokapet, Financial District, Gachibowli, Kondapur, Madhapur, Narsingi, Tellapur, Miyapur, Kompally
- Goa micro-markets: Assagao, Siolim, Anjuna, Vagator, Morjim, Mandrem, Parra, Candolim, Calangute

STRICT OUTPUT RULES:
- Return PURE NARRATION TEXT ONLY — nothing else
- No scene directions, no B-roll notes, no markdown, no headers
- No asterisks, brackets, bold text, or any formatting
- 120-160 words maximum (60-70 seconds when spoken)
- Write exactly as it will be spoken aloud
- Indian English — natural, conversational, authoritative
- Specific numbers and area names — never vague
- End with one clear takeaway or call to action

PROVEN EXAMPLE 1 — Hyderabad budget comparison (match this style):
"₹1 crore budget in Hyderabad — what do you actually get today?
Many buyers assume ₹1 crore is enough for a spacious 3BHK everywhere. But the reality changes dramatically depending on location.
Here is the simple truth.
In areas like Kompally, you can still get a full-size 3BHK. Move closer to the IT corridor, and sizes start shrinking. And in premium corridors like Kokapet or the Financial District, ₹1 crore usually does not get you a 3BHK anymore.
Same budget. Completely different outcomes.
That is why location is the single biggest factor in real estate decisions.
Follow this page for real Hyderabad property insights based on actual market data — not sales talk."

PROVEN EXAMPLE 2 — Goa ROI comparison (match this style):
"If you are investing in Goa, one question matters most.
Which area is actually giving the best return on investment right now?
Start with Assagao. This is one of the most premium micro-markets in North Goa. Property prices are higher, but appreciation has been strong because of luxury villa demand.
Next, Vagator. This area is known for short-term rental income. Many investors here focus on Airbnb returns rather than long-term appreciation.
Now look at Siolim. This is where many new investors are entering the market. Entry prices are still relatively affordable, and demand is growing quickly.
And finally — Morjim and Mandrem. These areas attract long-stay tourists and international visitors. That makes rental yields very attractive.
So the takeaway is simple. There is no single best area in Goa. The right investment depends on your strategy.
Are you investing for appreciation, rental income, or lifestyle?
Follow for real property insights from both Hyderabad and Goa."

These are proven outputs. Match this style, length, and structure exactly.`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      idea: SelectedIdea;
      topic?: string;
      content_type?: string;
      project_id?: string;
    };

    const { idea: selected_idea, project_id } = body;
    if (!selected_idea?.title?.trim()) return NextResponse.json({ error: "Missing idea" }, { status: 400 });

    const todayLabel = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const systemPrompt = buildScriptSystemPrompt(todayLabel);

    const userMessage = `Write a voiceover script for this video idea:

Title: ${selected_idea.title}
Hook: ${selected_idea.hook}
Key data points: ${selected_idea.key_data_points?.join(", ") ?? ""}
Target audience: ${selected_idea.target_audience ?? "HNI investors, NRI buyers, homebuyers"}`;

    const start = Date.now();
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        temperature: 0.4,
        max_output_tokens: 1200,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });
    const duration_ms = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      console.error("[content-script] OpenAI error:", res.status, errText);
      return NextResponse.json({ error: "OpenAI API error" }, { status: 500 });
    }

    const data = await res.json() as { output?: Array<{ content?: Array<{ text?: string }> }> };
    const script = data.output?.[0]?.content?.[0]?.text?.trim() ?? "";

    const supabase = createServiceClient();

    await supabase.from("content_generation_logs" as never).insert({
      project_id: project_id ?? null,
      step: "script",
      model: "gpt-5.4",
      duration_ms,
      success: true,
    } as never);

    if (project_id) {
      await supabase
        .from("content_projects" as never)
        .update({ script, selected_idea, status: "script_generated", updated_at: new Date().toISOString() } as never)
        .eq("id" as never, project_id);
    }

    return NextResponse.json({ script });
  } catch (err) {
    console.error("[content-script] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
