import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { handleIntentSignals } from "@/services/intentAlertService";

const normalizePhone = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 10 ? digits : null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = typeof body?.event === "string" ? body.event : null;
    const visitorId = typeof body?.visitor_id === "string" ? body.visitor_id : null;
    const sessionId = typeof body?.session_id === "string" ? body.session_id : null;
    const pagePath = typeof body?.page_path === "string" ? body.page_path : "/";
    const payload = typeof body?.payload === "object" && body.payload ? (body.payload as Record<string, unknown>) : {};

    if (!event || !visitorId || !sessionId) {
      return NextResponse.json({ error: "event, visitor_id and session_id are required." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const phoneCandidate = normalizePhone(
      typeof payload.phone === "string"
        ? payload.phone
        : typeof payload.leadPhone === "string"
          ? payload.leadPhone
          : null
    );

    let leadId: string | null = typeof payload.lead_id === "string" ? payload.lead_id : null;

    // Privacy-safe linkage: only map by lead_id or normalized phone, no PII payload storage required.
    if (!leadId && phoneCandidate) {
      const { data: leadByPhone } = await supabase
        .from("crm_leads")
        .select("id")
        .eq("phone", phoneCandidate)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      leadId = leadByPhone?.id ? String(leadByPhone.id) : null;
    }

    const insertPayload: Record<string, unknown> = {
      event_name: event,
      page_path: pagePath,
      visitor_id: visitorId,
      session_id: sessionId,
      visit_count: typeof body?.visit_count === "number" ? body.visit_count : 1,
      is_repeat_visit: Boolean(body?.is_repeat_visit),
      lead_id: leadId,
      project_id: typeof payload.project_id === "string" ? payload.project_id : null,
      source_type: typeof payload.source_type === "string" ? payload.source_type : null,
      metadata: payload,
      created_at: new Date().toISOString(),
    };

    const payloadCandidates = [
      insertPayload,
      {
        event: insertPayload.event_name,
        page_path: insertPayload.page_path,
        visitor_id: insertPayload.visitor_id,
        session_id: insertPayload.session_id,
        lead_id: insertPayload.lead_id,
        metadata: insertPayload.metadata,
      },
    ];

    let success = false;
    for (const candidate of payloadCandidates) {
      const { error } = await supabase.from("crm_behavior_events").insert(candidate);
      if (!error) {
        success = true;
        break;
      }
    }

    if (!success) {
      return NextResponse.json({ error: "Failed to persist behavior event." }, { status: 500 });
    }

    if (leadId && (event === "pricing_view" || event === "brochure_download" || (event === "page_view" && Boolean(body?.is_repeat_visit)))) {
      await handleIntentSignals({
        leadId,
        eventName: event,
        isRepeatVisit: Boolean(body?.is_repeat_visit),
        eventPayload: payload,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected behavior tracking error." },
      { status: 500 }
    );
  }
}
