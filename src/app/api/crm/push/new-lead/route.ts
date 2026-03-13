import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/services/pushNotificationService";
import { createServiceClient } from "@/lib/supabase/serviceClient";

// Source types that must NEVER trigger alerts (bulk imports, migrations, simulations).
// Any row inserted with one of these source_type values is silently skipped.
// When you build a CSV/bulk import flow, set source_type = 'bulk_import'.
const SILENT_SOURCES = new Set([
  "bulk_import",
  "csv_import",
  "import",
  "migration",
  "data_migration",
  "simulation",
  "test",
  "seed",
]);

const PRAVEEN_ID = "9021aff0-6ba3-4f7b-852f-561862fbc1ac";

interface LeadRow {
  id: string;
  name?: string | null;
  phone?: string | null;
  source_type?: string | null;
  source_channel?: string | null;
  assigned_to?: string | null;
}

// Called by a Supabase Database Webhook on:
//   - INSERT into crm_leads
//   - UPDATE on crm_leads where assigned_to changed
//
// Auth: Authorization: Bearer {CRON_SECRET}
// Configure in Supabase Dashboard → Database → Webhooks
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(body?.type ?? "").toUpperCase(); // "INSERT" | "UPDATE"
  const record = body?.record as LeadRow | null;
  const oldRecord = body?.old_record as LeadRow | null;

  if (!record?.id) {
    return NextResponse.json({ error: "No record in payload" }, { status: 400 });
  }

  // Skip bulk imports / simulations / test data
  const sourceType = record.source_type?.toLowerCase() ?? null;
  if (sourceType && SILENT_SOURCES.has(sourceType)) {
    console.log(`[Push/new-lead] Skipped alert — silent source: ${sourceType}`);
    return NextResponse.json({ skipped: true, reason: "silent_source" });
  }

  const leadId = record.id;
  const name = record.name?.trim() || "New Lead";
  const phone = record.phone?.trim() || "";

  if (type === "INSERT") {
    // Push to assigned agent (if already set — e.g. form routing sets it at insert time)
    const agentId = record.assigned_to ?? null;
    if (agentId && agentId !== PRAVEEN_ID) {
      const agentName = await resolveFullName(agentId);
      console.log(`[Push/new-lead] INSERT → agent push: ${agentId}`);
      await sendPushToUser(
        agentId,
        "🔔 New Lead!",
        `${name} • ${phone}`,
        `/leads/${leadId}`
      ).catch((err) => console.error("[Push/new-lead] Agent push failed:", err));

      // Admin: tell who it's assigned to
      await sendPushToUser(
        PRAVEEN_ID,
        "New Lead Assigned",
        `Assigned to ${agentName} — ${name}`,
        `/leads/${leadId}`
      ).catch((err) => console.error("[Push/new-lead] Admin push failed:", err));
    } else {
      // Not yet assigned — notify admin so it doesn't fall through the cracks
      const label = agentId === PRAVEEN_ID ? `${name} • ${phone}` : `${name} • ${phone} — needs assignment`;
      await sendPushToUser(
        PRAVEEN_ID,
        "🔔 New Lead (Unassigned)",
        label,
        `/leads/${leadId}`
      ).catch((err) => console.error("[Push/new-lead] Admin (unassigned) push failed:", err));
    }

    return NextResponse.json({ ok: true, event: "insert", leadId });
  }

  if (type === "UPDATE") {
    // Only act when assigned_to just changed from null → a value (ownership routing fires after insert)
    const wasUnassigned = !oldRecord?.assigned_to;
    const nowAssigned = !!record.assigned_to;
    if (!wasUnassigned || !nowAssigned) {
      return NextResponse.json({ skipped: true, reason: "assigned_to_unchanged" });
    }

    const agentId = record.assigned_to!;
    if (agentId === PRAVEEN_ID) {
      // Admin assigned to themselves — nothing extra to do, they already got the INSERT alert
      return NextResponse.json({ ok: true, event: "update_self_assign", leadId });
    }

    console.log(`[Push/new-lead] UPDATE assigned_to → agent push: ${agentId}`);
    await sendPushToUser(
      agentId,
      "🔔 Lead Assigned to You",
      `${name} • ${phone}`,
      `/leads/${leadId}`
    ).catch((err) => console.error("[Push/new-lead] Agent (re-assigned) push failed:", err));

    // Update admin's earlier "unassigned" alert by sending a follow-up
    const agentName = await resolveFullName(agentId);
    await sendPushToUser(
      PRAVEEN_ID,
      "Lead Assigned",
      `${name} → ${agentName}`,
      `/leads/${leadId}`
    ).catch((err) => console.error("[Push/new-lead] Admin (assigned) push failed:", err));

    return NextResponse.json({ ok: true, event: "update_assigned", leadId });
  }

  return NextResponse.json({ skipped: true, reason: "unhandled_event_type" });
}

async function resolveFullName(userId: string): Promise<string> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("crm_users")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    return (data as { full_name?: string | null } | null)?.full_name?.trim() || "Agent";
  } catch {
    return "Agent";
  }
}
