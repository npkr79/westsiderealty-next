import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getCrmSessionResult } from "@/lib/crm/auth";

// Fields accepted in the PATCH body → DB column names in crm_leads
// Keys are what the client sends; values are the actual DB columns.
const FIELD_MAP: Record<string, string> = {
  name:                 "name",
  phone:                "phone",
  email:                "email",
  budget_min:           "budget_min",
  budget_max:           "budget_max",
  location:             "location_preference",   // UI sends 'location'
  location_preference:  "location_preference",   // also accept canonical name
  buyer_type:           "buyer_type",
  investor_type:        "buyer_type",            // alias accepted
  assigned_to:          "assigned_to",
  assignment_status:    "assignment_status",
  status:               "status",
  priority:             "priority",
  notes:                "notes",
};

// Numeric fields — coerce string → number, null stays null
const NUMERIC_FIELDS = new Set(["budget_min", "budget_max"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCrmSessionResult();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("crm_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCrmSessionResult();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  console.log("[PATCH /api/crm/leads/:id] id=", id, "body=", JSON.stringify(body));

  const patch: Record<string, unknown> = {};

  for (const [clientKey, dbColumn] of Object.entries(FIELD_MAP)) {
    if (!(clientKey in body)) continue;
    const raw = body[clientKey];
    if (NUMERIC_FIELDS.has(dbColumn)) {
      patch[dbColumn] = raw === null || raw === "" ? null : Number(raw);
    } else {
      patch[dbColumn] = raw;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No patchable fields provided" }, { status: 400 });
  }

  // Always stamp timestamps on any successful update
  const now = new Date().toISOString();
  patch.updated_at = now;
  patch.last_activity_at = now;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("crm_leads")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();

  console.log("[PATCH /api/crm/leads/:id] supabase result:", error ? `error: ${error.message}` : `ok, id=${(data as Record<string,unknown> | null)?.id}`);
  if ("priority" in patch) console.log("Priority updated to:", patch.priority);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
