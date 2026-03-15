import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppText } from "@/services/whatsappCloudService";
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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.westsiderealty.in";

interface LeadRow {
  id: string;
  name?: string | null;
  phone?: string | null;
  source_type?: string | null;
  source_channel?: string | null;
  assigned_to?: string | null;
  is_bulk_upload?: boolean | null;
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
      console.log("[PushDebug] Returning", { reason: "unauthorized" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    console.log("[PushDebug] Returning", { reason: "invalid_json" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(body?.type ?? "").toUpperCase(); // "INSERT" | "UPDATE"
  const record = body?.record as LeadRow | null;
  const oldRecord = body?.old_record as LeadRow | null;

  // 1. Log raw fields immediately after parsing
  console.log("[PushDebug] Received", {
    type,
    recordId: record?.id,
    is_bulk_upload: record?.is_bulk_upload,
    source_type: record?.source_type,
    assigned_to: record?.assigned_to,
    ts: new Date().toISOString(),
  });

  if (!record?.id) {
    console.log("[PushDebug] Returning", { reason: "no_record_id" });
    return NextResponse.json({ error: "No record in payload" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Purge stale dedup entries before checking — ensures legitimate retries
  // after the TTL window are not incorrectly blocked.
  try {
    await supabase
      .from("crm_push_dedup")
      .delete()
      .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());
  } catch (_) {}

  // DB-level dedup — unique constraint on dedup_key means first insert wins;
  // any subsequent delivery from another serverless instance gets a conflict error.
  const dedupKey = `push:${type}:${record.id}`;

  const { error: dedupError } = await supabase
    .from("crm_push_dedup")
    .insert({ dedup_key: dedupKey });

  if (dedupError) {
    console.log("[PushDebug] DB dedup hit — skipping duplicate", { dedupKey });
    return NextResponse.json({ skipped: true, reason: "duplicate" });
  }

  console.log("[PushDebug] DB dedup passed", { dedupKey });

  // Skip bulk imports / simulations / test data
  const sourceType = record.source_type?.toLowerCase() ?? null;

  // 3. Log SILENT_SOURCES check
  console.log("[PushDebug] SourceCheck", {
    suppressed: !!(sourceType && SILENT_SOURCES.has(sourceType)),
    source_type: record.source_type,
  });

  if (sourceType && SILENT_SOURCES.has(sourceType)) {
    console.log(`[Push/new-lead] Skipped alert — silent source: ${sourceType}`);
    console.log("[PushDebug] Returning", { reason: "silent_source" });
    return NextResponse.json({ skipped: true, reason: "silent_source" });
  }

  // Skip any row explicitly flagged as a bulk upload

  // 4. Log is_bulk_upload check
  console.log("[PushDebug] BulkCheck", { suppressed: record.is_bulk_upload === true });

  if (record.is_bulk_upload === true) {
    console.log(`[Push/new-lead] Skipped alert — bulk_upload flag set`);
    console.log("[PushDebug] Returning", { reason: "bulk_upload" });
    return NextResponse.json({ skipped: true, reason: "bulk_upload" });
  }

  const leadId = record.id;
  const name = record.name?.trim() || "New Lead";
  const phone = record.phone?.trim() || "";

  if (type === "INSERT") {
    const agentId = record.assigned_to ?? null;
    if (agentId && agentId !== PRAVEEN_ID) {
      const agentName = await resolveFullName(agentId);

      sendWhatsAppAlert(agentId, leadId, `🔔 New Lead Assigned!\n\nName: ${name}\nPhone: ${phone}\n\nOpen CRM: ${SITE_URL}/leads`)
        .catch((err) => console.error("[WA Alert] Agent WA failed:", err));

      sendWhatsAppAlert(PRAVEEN_ID, leadId, `🔔 New Lead!\n\nName: ${name}\nPhone: ${phone}\nAssigned to: ${agentName}\n\nOpen CRM: ${SITE_URL}/leads`)
        .catch((err) => console.error("[WA Alert] Admin WA failed:", err));
    } else {
      sendWhatsAppAlert(PRAVEEN_ID, leadId, `🔔 New Lead (Unassigned)!\n\nName: ${name}\nPhone: ${phone}\n\nNeeds assignment: ${SITE_URL}/leads`)
        .catch((err) => console.error("[WA Alert] Admin unassigned WA failed:", err));
    }

    console.log("[Push] Notifications disabled - WhatsApp alerts only");
    return NextResponse.json({ success: true, reason: "wa_only" });
  }

  if (type === "UPDATE") {
    // Only act when assigned_to just changed from null → a value (ownership routing fires after insert)
    const wasUnassigned = !oldRecord?.assigned_to;
    const nowAssigned = !!record.assigned_to;
    if (!wasUnassigned || !nowAssigned) {
      console.log("[PushDebug] Returning", { reason: "assigned_to_unchanged" });
      return NextResponse.json({ skipped: true, reason: "assigned_to_unchanged" });
    }

    const agentId = record.assigned_to!;
    if (agentId === PRAVEEN_ID) {
      // Admin assigned to themselves — nothing extra to do
      console.log("[PushDebug] Returning", { reason: "update_self_assign", leadId });
      return NextResponse.json({ ok: true, event: "update_self_assign", leadId });
    }

    sendWhatsAppAlert(agentId, leadId, `🔔 Lead Assigned to You!\n\nName: ${name}\nPhone: ${phone}\n\nOpen CRM: ${SITE_URL}/leads`)
      .catch((err) => console.error("[WA Alert] Agent WA (update) failed:", err));

    const agentName = await resolveFullName(agentId);

    sendWhatsAppAlert(PRAVEEN_ID, leadId, `🔔 Lead Assigned!\n\nName: ${name}\nPhone: ${phone}\nAssigned to: ${agentName}\n\nOpen CRM: ${SITE_URL}/leads`)
      .catch((err) => console.error("[WA Alert] Admin WA (update) failed:", err));

    console.log("[Push] Notifications disabled - WhatsApp alerts only");
    return NextResponse.json({ success: true, reason: "wa_only" });
  }

  console.log("[PushDebug] Returning", { reason: "unhandled_event_type" });
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

async function sendWhatsAppAlert(recipientUserId: string, leadId: string, message: string): Promise<void> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("crm_users")
    .select("whatsapp_number")
    .eq("id", recipientUserId)
    .maybeSingle();

  const whatsappNumber = (data as { whatsapp_number?: string | null } | null)?.whatsapp_number?.trim();
  if (!whatsappNumber) {
    console.log(`[WA Alert] No whatsapp_number for user ${recipientUserId} — skipping`);
    return;
  }

  await sendWhatsAppText({
    leadId,
    phone: whatsappNumber,
    message,
    sentBy: PRAVEEN_ID,
  });
}
