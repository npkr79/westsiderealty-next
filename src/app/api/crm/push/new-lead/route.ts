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
  const name = record.name?.trim() || "Unknown";
  const phone = record.phone?.trim() || "";

  // Batch-fetch whatsapp numbers for all relevant users in one query
  const userIds = [PRAVEEN_ID];
  if (record.assigned_to && record.assigned_to !== PRAVEEN_ID) {
    userIds.push(record.assigned_to);
  }

  const { data: users } = await supabase
    .from("crm_users")
    .select("id, full_name, whatsapp_number")
    .in("id", userIds);

  const adminUser = users?.find((u: { id: string }) => u.id === PRAVEEN_ID) as
    | { id: string; full_name?: string | null; whatsapp_number?: string | null }
    | undefined;
  const agentUser = users?.find((u: { id: string }) => u.id === record.assigned_to) as
    | { id: string; full_name?: string | null; whatsapp_number?: string | null }
    | undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.westsiderealty.in";
  const leadUrl = `${siteUrl}/leads/${leadId}`;

  // Direct service call — /api/crm/whatsapp/send-text requires cookie-based CRM session
  // auth and cannot be called from a webhook context. Call sendWhatsAppText directly.
  async function sendWA(waPhone: string, message: string) {
    if (!waPhone) return;
    await sendWhatsAppText({ leadId, phone: waPhone, message, sentBy: PRAVEEN_ID })
      .catch((err: unknown) => console.error("[WA Alert] send failed:", err));
  }

  if (type === "INSERT") {
    if (record.assigned_to && record.assigned_to !== PRAVEEN_ID) {
      // Assigned lead — alert agent + admin
      if (agentUser?.whatsapp_number) {
        await sendWA(
          agentUser.whatsapp_number,
          `🔔 New Lead Assigned!\n\nName: ${name}\nPhone: ${phone}\n\nView: ${leadUrl}`
        );
      }
      if (adminUser?.whatsapp_number) {
        await sendWA(
          adminUser.whatsapp_number,
          `🔔 New Lead\n\nName: ${name}\nPhone: ${phone}\nAgent: ${agentUser?.full_name || "Unknown"}\n\nView: ${leadUrl}`
        );
      }
    } else {
      // Unassigned — alert admin only
      if (adminUser?.whatsapp_number) {
        await sendWA(
          adminUser.whatsapp_number,
          `🔔 New Lead (Unassigned)\n\nName: ${name}\nPhone: ${phone}\n\nAssign: ${siteUrl}/routing`
        );
      }
    }
    return NextResponse.json({ success: true, reason: "insert_ok" });
  }

  if (type === "UPDATE") {
    const wasUnassigned = !oldRecord?.assigned_to;
    const nowAssigned = !!record.assigned_to;

    if (!wasUnassigned || !nowAssigned) {
      return NextResponse.json({ skipped: true, reason: "assigned_to_unchanged" });
    }

    // Lead just got assigned — alert agent only
    if (record.assigned_to !== PRAVEEN_ID && agentUser?.whatsapp_number) {
      await sendWA(
        agentUser.whatsapp_number,
        `🔔 Lead Assigned to You!\n\nName: ${name}\nPhone: ${phone}\n\nView: ${leadUrl}`
      );
    }
    return NextResponse.json({ success: true, reason: "update_ok" });
  }

  return NextResponse.json({ skipped: true, reason: "unknown_type" });
}
