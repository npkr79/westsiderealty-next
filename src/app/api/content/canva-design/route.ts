import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { uploadAudioAsset, createDesignFromTemplate } from "@/services/canvaService";

const allowedRoles = new Set(["admin"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id?.trim()) {
      return NextResponse.json({ error: "Missing project_id" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: project } = await supabase
      .from("content_projects" as never)
      .select("title, audio_url, scene_json, generation_metadata")
      .eq("id" as never, project_id)
      .maybeSingle() as {
        data: {
          title: string | null;
          audio_url: string | null;
          scene_json: { total_scenes?: number; video_duration_seconds?: number } | null;
          generation_metadata: Record<string, unknown> | null;
        } | null;
      };

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Upload audio asset if available
    let audioAssetId: string | null = null;
    if (project.audio_url) {
      try {
        const filename = `${project.title ?? "audio"}-${Date.now()}.mp3`;
        audioAssetId = await uploadAudioAsset(project.audio_url, filename);
      } catch (err) {
        console.error("[canva-design] audio upload failed (continuing):", err);
      }
    }

    // Create design
    const { design_id, edit_url } = await createDesignFromTemplate(
      project.title ?? "Westside Realty Reel"
    );

    // Update project metadata
    const existingMeta = project.generation_metadata ?? {};
    await supabase
      .from("content_projects" as never)
      .update({
        generation_metadata: {
          ...existingMeta,
          canva_design_id: design_id,
          canva_edit_url: edit_url,
          canva_audio_asset_id: audioAssetId,
          canva_connected_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, project_id);

    // Upsert content_videos
    await supabase
      .from("content_videos" as never)
      .upsert({
        project_id,
        title: project.title ?? "Untitled",
        canva_design_url: edit_url,
        status: "pending_review",
        scene_count: project.scene_json?.total_scenes ?? 0,
        total_duration: project.scene_json?.video_duration_seconds ?? 0,
        updated_at: new Date().toISOString(),
      } as never, { onConflict: "project_id" } as never);

    return NextResponse.json({
      success: true,
      design_id,
      edit_url,
      audio_asset_id: audioAssetId,
    });
  } catch (err) {
    console.error("[canva-design] error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
