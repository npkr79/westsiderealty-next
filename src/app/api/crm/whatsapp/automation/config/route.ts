import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const allowedRoles = new Set(["admin", "sales_head", "team_lead"]);

const DEFAULTS = [
  { key: "new_lead_greeting", enabled: true, template_name: "lead_greeting_v1", language_code: "en" },
  { key: "post_assignment_intro", enabled: true, template_name: "agent_introduction_v1", language_code: "en" },
  { key: "site_visit_reminder", enabled: true, template_name: "site_visit_reminder_v1", language_code: "en" },
  { key: "no_response_followup_48h", enabled: true, template_name: "followup_48h_v1", language_code: "en" },
];

export async function GET() {
  const session = await getCrmSessionResult();
  if (!session.user || !allowedRoles.has(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("crm_automation_config")
    .select("key,enabled,template_name,language_code")
    .in("key", DEFAULTS.map((d) => d.key));

  if (error || !data || data.length === 0) {
    return NextResponse.json({ success: true, config: DEFAULTS, source: "defaults" });
  }
  return NextResponse.json({ success: true, config: data, source: "database" });
}

export async function PATCH(request: Request) {
  const session = await getCrmSessionResult();
  if (!session.user || !allowedRoles.has(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const key = String(body?.key || "");
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : null;
  const templateName = typeof body?.template_name === "string" ? body.template_name.trim() : "";
  const languageCode = typeof body?.language_code === "string" ? body.language_code.trim() : "en";

  if (!key || enabled === null || !templateName) {
    return NextResponse.json({ error: "key, enabled, template_name are required." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("crm_automation_config").upsert(
    {
      key,
      enabled,
      template_name: templateName,
      language_code: languageCode || "en",
      updated_at: new Date().toISOString(),
      updated_by: session.user.id,
    },
    { onConflict: "key" }
  );
  if (error) {
    return NextResponse.json({ error: error.message || "Failed to update configuration." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
