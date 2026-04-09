import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { requireCrmUser } from "@/lib/crm/auth";

export async function POST(req: NextRequest) {
  try {
    await requireCrmUser(["admin", "sales_head", "team_lead", "agent"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, filters, project_slugs, created_by_name, expires_days = 30 } = body;

  if (!filters || typeof filters !== "object") {
    return NextResponse.json({ error: "filters is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expires_days);

  const { data, error } = await supabase
    .from("brochure_links")
    .insert({
      title: title || null,
      filters,
      project_slugs: project_slugs?.length ? project_slugs : null,
      created_by_name: created_by_name || null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token")
    .single();

  if (error || !data) {
    console.error("[BrochureGenerate] error:", error);
    return NextResponse.json({ error: "Failed to create brochure link" }, { status: 500 });
  }

  return NextResponse.json({ token: data.token });
}
