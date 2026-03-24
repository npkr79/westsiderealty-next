import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/app/api/admin/utils";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function POST(req: NextRequest) {
  const auth = await getAdminAuth();
  if (!auth.authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    ssml: string;
    voice?: string;
    speaking_rate?: number;
    pitch?: number;
    project_id?: string;
  };

  const { ssml, voice = "en-IN-Wavenet-D", speaking_rate = 1.0, pitch = 0.0, project_id } = body;
  if (!ssml?.trim()) return NextResponse.json({ error: "Missing SSML" }, { status: 400 });

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_TTS_API_KEY is not configured. Add this environment variable to enable audio generation." },
      { status: 503 },
    );
  }

  const languageCode = voice.startsWith("en-IN") ? "en-IN" : "en-US";

  const start = Date.now();
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { ssml },
        voice: { languageCode, name: voice },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: speaking_rate,
          pitch,
        },
      }),
    },
  );
  const duration_ms = Date.now() - start;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[content-studio] Google TTS error:", res.status, text);
    return NextResponse.json({ error: `TTS API error (${res.status})` }, { status: 500 });
  }

  const data = await res.json() as { audioContent?: string };
  const audioBase64 = data.audioContent ?? "";
  const audio_url = `data:audio/mp3;base64,${audioBase64}`;

  const supabase = createServiceClient();

  await supabase.from("content_generation_logs" as never).insert({
    project_id: project_id ?? null,
    step: "audio",
    model: `google-tts-${voice}`,
    duration_ms,
    success: true,
  } as never);

  if (project_id) {
    await supabase
      .from("content_projects" as never)
      .update({ audio_url, status: "audio", updated_at: new Date().toISOString() } as never)
      .eq("id" as never, project_id);
  }

  return NextResponse.json({ audio_url });
}
