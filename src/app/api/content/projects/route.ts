import { NextRequest, NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const allowedRoles = new Set(["admin"]);

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("content_projects" as never)
      .select("id, title, topic, content_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ projects: data ?? [] });
  } catch (err) {
    console.error("[content-projects] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      title: string;
      topic?: string;
      target_audience?: string;
      content_type?: string;
    };

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("content_projects" as never)
      .insert({
        title: body.title,
        topic: body.topic ?? null,
        target_audience: body.target_audience ?? null,
        content_type: body.content_type ?? "social_post",
        status: "ideas",
        created_by: session.user.id ?? null,
      } as never)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data });
  } catch (err) {
    console.error("[content-projects] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json() as Record<string, unknown>;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("content_projects" as never)
      .update({ ...body, updated_at: new Date().toISOString() } as never)
      .eq("id" as never, id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data });
  } catch (err) {
    console.error("[content-projects] PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
