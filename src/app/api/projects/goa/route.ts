import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  try {
    const supabase = createServiceClient();

    let query = supabase
      .from("rera_projects")
      .select("project_name, url_slug, current_status, proposed_completion_date, actual_completion_date")
      .eq("city_slug", "goa")
      .order("project_name")
      .limit(1000);

    if (search) {
      query = query.ilike("project_name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[/api/projects/goa] query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects: data ?? [] });
  } catch (err) {
    console.error("[/api/projects/goa]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
