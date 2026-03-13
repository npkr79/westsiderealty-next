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

// Module-level dedup cache — persists across requests within the same serverless instance.
// Key: `${type}:${record.id}`, Value: timestamp of first seen.
const dedupCache = new Map<string, number>();

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

  // Dedup guard — drop duplicate webhook deliveries within 60 seconds
  const dedupKey = `${type}:${record.id}`;
  const now = Date.now();
  for (const [k, ts] of dedupCache.entries()) {
    if (now - ts > 60_000) dedupCache.delete(k);
  }
  const dedupHit = dedupCache.has(dedupKey);

  // 2. Log dedup hit/miss
  console.log("[PushDebug] Dedup", { key: dedupKey, hit: dedupHit, cacheSize: dedupCache.size });

  if (dedupHit) {
    console.log(`[Push/new-lead] Skipped duplicate — key: ${dedupKey}`);
    console.log("[PushDebug] Returning", { reason: "duplicate" });
    return NextResponse.json({ skipped: true, reason: "duplicate" });
  }
  dedupCache.set(dedupKey, now);

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
    // Push to assigned agent (if already set — e.g. form routing sets it at insert time)
    const agentId = record.assigned_to ?? null;
    if (agentId && agentId !== PRAVEEN_ID) {
      const agentName = await resolveFullName(agentId);
      console.log(`[Push/new-lead] INSERT → agent push: ${agentId}`);

      // 5. Log before each sendPushToUser call
      console.log("[PushDebug] Sending push to", { userId: agentId, title: "🔔 New Lead!", body: `${name} • ${phone}` });
      await sendPushToUser(
        agentId,
        "🔔 New Lead!",
        `${name} • ${phone}`,
        `/leads/${leadId}`
      ).catch((err) => console.error("[Push/new-lead] Agent push failed:", err));

      console.log("[PushDebug] Sending push to", { userId: PRAVEEN_ID, title: "New Lead Assigned", body: `Assigned to ${agentName} — ${name}` });
      await sendPushToUser(
        PRAVEEN_ID,
        "New Lead Assigned",
        `Assigned to ${agentName} — ${name}`,
        `/leads/${leadId}`
      ).catch((err) => console.error("[Push/new-lead] Admin push failed:", err));
    } else {
      // Not yet assigned — notify admin so it doesn't fall through the cracks
      const label = agentId === PRAVEEN_ID ? `${name} • ${phone}` : `${name} • ${phone} — needs assignment`;

      console.log("[PushDebug] Sending push to", { userId: PRAVEEN_ID, title: "🔔 New Lead (Unassigned)", body: label });
      await sendPushToUser(
        PRAVEEN_ID,
        "🔔 New Lead (Unassigned)",
        label,
        `/leads/${leadId}`
      ).catch((err) => console.error("[Push/new-lead] Admin (unassigned) push failed:", err));
    }

    console.log("[PushDebug] Returning", { reason: "insert_ok", leadId });
    return NextResponse.json({ ok: true, event: "insert", leadId });
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
      // Admin assigned to themselves — nothing extra to do, they already got the INSERT alert
      console.log("[PushDebug] Returning", { reason: "update_self_assign", leadId });
      return NextResponse.json({ ok: true, event: "update_self_assign", leadId });
    }

    console.log(`[Push/new-lead] UPDATE assigned_to → agent push: ${agentId}`);

    console.log("[PushDebug] Sending push to", { userId: agentId, title: "🔔 Lead Assigned to You", body: `${name} • ${phone}` });
    await sendPushToUser(
      agentId,
      "🔔 Lead Assigned to You",
      `${name} • ${phone}`,
      `/leads/${leadId}`
    ).catch((err) => console.error("[Push/new-lead] Agent (re-assigned) push failed:", err));

    // Update admin's earlier "unassigned" alert by sending a follow-up
    const agentName = await resolveFullName(agentId);

    console.log("[PushDebug] Sending push to", { userId: PRAVEEN_ID, title: "Lead Assigned", body: `${name} → ${agentName}` });
    await sendPushToUser(
      PRAVEEN_ID,
      "Lead Assigned",
      `${name} → ${agentName}`,
      `/leads/${leadId}`
    ).catch((err) => console.error("[Push/new-lead] Admin (assigned) push failed:", err));

    console.log("[PushDebug] Returning", { reason: "update_assigned_ok", leadId });
    return NextResponse.json({ ok: true, event: "update_assigned", leadId });
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
