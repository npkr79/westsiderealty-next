import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const allowedRoles = new Set(["admin"]);

const SSML_SYSTEM_PROMPT = `You are an SSML formatter for Google Cloud Text-to-Speech.

Convert the provided script to SSML following these rules:
- Wrap the entire output in <speak> tags
- Add <break time="500ms"/> between paragraphs
- Add <break time="200ms"/> after commas and at natural pauses
- Use <emphasis level="moderate"> for property names, key figures, and important facts
- Use <prosody rate="slow"> for prices, percentages, and statistics
- Preserve all content — only add SSML markup, do not rephrase
- Return ONLY the SSML, no explanation or markdown fences`;

export async function POST(req: NextRequest) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { script: string; project_id?: string };
    const { script, project_id } = body;
    if (!script?.trim()) return NextResponse.json({ error: "Missing script" }, { status: 400 });

    const userMessage = `Convert this script to SSML:\n\n${script}`;

    const start = Date.now();
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        temperature: 0.3,
        max_output_tokens: 1200,
        input: [
          { role: "system", content: SSML_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });
    const duration_ms = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      console.error("[content-ssml] OpenAI error:", res.status, errText);
      return NextResponse.json({ error: "OpenAI API error" }, { status: 500 });
    }

    const data = await res.json() as { output?: Array<{ content?: Array<{ text?: string }> }> };
    let ssml = data.output?.[0]?.content?.[0]?.text?.trim() ?? "";

    // Ensure wrapped in <speak>
    if (ssml && !ssml.startsWith("<speak>")) {
      ssml = `<speak>\n${ssml}\n</speak>`;
    }

    const supabase = createServiceClient();

    await supabase.from("content_generation_logs" as never).insert({
      project_id: project_id ?? null,
      step: "ssml",
      model: "gpt-5.4",
      duration_ms,
      success: true,
    } as never);

    if (project_id) {
      await supabase
        .from("content_projects" as never)
        .update({ ssml, status: "ssml", updated_at: new Date().toISOString() } as never)
        .eq("id" as never, project_id);
    }

    return NextResponse.json({ ssml });
  } catch (err) {
    console.error("[content-ssml] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
