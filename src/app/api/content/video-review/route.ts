import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const allowedRoles = new Set(["admin"]);

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("content_videos" as never)
    .select("id, project_id, title, status, scene_count, total_duration, canva_design_url, error_log, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ videos: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      video_id?: string;
      project_id: string;
      title: string;
      scenes?: unknown;
      canva_design_url?: string;
      status?: string;
      scene_count?: number;
      total_duration?: number;
    };

    const { video_id, project_id, title, scenes, canva_design_url, status, scene_count, total_duration } = body;

    if (!project_id?.trim() || !title?.trim()) {
      return NextResponse.json({ error: "Missing project_id or title" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const record = {
      project_id,
      title,
      scene_count: scene_count ?? null,
      total_duration: total_duration ?? null,
      canva_design_url: canva_design_url ?? null,
      status: status ?? "pending_review",
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    let videoData: unknown;

    if (video_id) {
      const { data, error } = await supabase
        .from("content_videos" as never)
        .update(record as never)
        .eq("id" as never, video_id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      videoData = data;
    } else {
      const { data, error } = await supabase
        .from("content_videos" as never)
        .insert({ ...record, created_at: new Date().toISOString() } as never)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      videoData = data;
    }

    // Update parent project with scene_json and status
    await supabase
      .from("content_projects" as never)
      .update({
        scene_json: scenes ?? null,
        status: "video_review",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, project_id);

    return NextResponse.json({ video: videoData });
  } catch (err) {
    console.error("[video-review] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
