import { NextResponse } from "next/server";
import { processMetaLead } from "@/services/metaLeadService";
import { createServiceClient } from "@/lib/supabase/serviceClient";

const META_VERIFY_TOKEN = "westsiderealty_meta_secret";

// In-memory deduplication cache — survives within a single server instance lifetime
const processedLeads = new Set<string>();

interface MetaWebhookChange {
  field?: string;
  value?: {
    leadgen_id?: string;
    page_id?: string;
    form_id?: string;
    ad_id?: string;
    adgroup_id?: string;
    created_time?: number;
  };
}

interface MetaWebhookEntry {
  id?: string;
  time?: number;
  changes?: MetaWebhookChange[];
}

interface MetaWebhookPayload {
  object?: string;
  entry?: MetaWebhookEntry[];
}

function extractLeadgenValues(payload: MetaWebhookPayload): Array<{ value: MetaWebhookChange["value"]; fullPayload: MetaWebhookPayload }> {
  const result: Array<{ value: MetaWebhookChange["value"]; fullPayload: MetaWebhookPayload }> = [];
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      if (change?.field === "leadgen" && change?.value?.leadgen_id) {
        result.push({ value: change.value, fullPayload: payload });
      }
    }
  }
  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MetaWebhookPayload;
    console.log("[Meta Webhook] Lead event received:", JSON.stringify(payload, null, 2));

    const leadgenItems = extractLeadgenValues(payload);
    const results: Array<{ leadgen_id: string; rawLeadId: string | null; crmLeadId: string | null; error?: string }> = [];

    for (const { value, fullPayload } of leadgenItems) {
      if (!value) continue;

      const leadgenId = value.leadgen_id!;

      // 1. In-memory deduplication (fast path — same server instance)
      if (processedLeads.has(leadgenId)) {
        console.log(`[Meta Webhook] Duplicate event ignored (in-memory): ${leadgenId}`);
        continue;
      }
      processedLeads.add(leadgenId);
      // Clean up after 5 minutes to prevent unbounded memory growth
      setTimeout(() => processedLeads.delete(leadgenId), 5 * 60 * 1000);

      // 2. Atomic dedup — PRIMARY KEY prevents simultaneous duplicates across instances
      const supabase = createServiceClient();
      const { error: dedupError } = await supabase
        .from("crm_webhook_dedup")
        .insert({ leadgen_id: leadgenId });

      if (dedupError) {
        console.log(`[Meta Webhook] Atomic dedup blocked: ${leadgenId}`);
        continue;
      }

      // 3. Secondary check — crm_leads fb_lead_id (belt-and-suspenders)
      const { data: existing } = await supabase
        .from("crm_leads")
        .select("id")
        .eq("fb_lead_id", leadgenId)
        .maybeSingle();

      if (existing) {
        console.log(`[Meta Webhook] Lead already exists for leadgen_id: ${leadgenId}`);
        continue;
      }

      const result = await processMetaLead(fullPayload as unknown as Record<string, unknown>, value);
      results.push({
        leadgen_id: leadgenId,
        rawLeadId: result.rawLeadId,
        crmLeadId: result.crmLeadId,
        error: result.error,
      });
    }

    if (leadgenItems.length === 0) {
      return new Response("EVENT_RECEIVED", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const hasErrors = results.some((r) => r.error);
    if (hasErrors) {
      console.warn("[Meta Webhook] Some leads failed:", results.filter((r) => r.error));
    }

    return new Response("EVENT_RECEIVED", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("[Meta Webhook] Failed to process payload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
