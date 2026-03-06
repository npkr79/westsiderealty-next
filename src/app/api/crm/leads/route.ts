import { NextResponse } from "next/server";
import { getCrmSessionResult } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { routeLeadByOwnership } from "@/services/crmLeadRoutingService";
import { onNewLeadAutomation } from "@/services/whatsappAutomationService";
import { extractLeadAttribution } from "@/lib/crm/leadAttribution";
import { mapBehaviorToLead } from "@/services/behaviorLeadMappingService";
import { runStageAutomation } from "@/services/stageAutomationService";
import { toBudgetNumber } from "@/lib/crm/budget";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";

const createAllowedRoles = new Set(["admin", "sales_head", "team_lead", "agent"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizePhone = (value: string): string => value.replace(/[^\d]/g, "");

async function detectDuplicateLead(phone: string, email: string | null): Promise<{ type: "phone" | "email"; id: string } | null> {
  const supabase = createServiceClient();
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone) {
    const { data } = await supabase.from("crm_leads").select("id,phone").limit(2000);
    const hit = ((data as Array<{ id: string; phone: string | null }> | null) || []).find((row) => normalizePhone(String(row.phone || "")) === normalizedPhone);
    if (hit?.id) return { type: "phone", id: String(hit.id) };
  }

  if (!email) return null;
  const lowered = email.trim().toLowerCase();
  const emailQueries = [
    supabase.from("crm_leads").select("id,email").eq("email", lowered).limit(1).maybeSingle(),
    supabase.from("crm_leads_view").select("id,email").eq("email", lowered).limit(1).maybeSingle(),
  ];
  for (const query of emailQueries) {
    const { data, error } = await query;
    if (!error && data?.id) {
      return { type: "email", id: String(data.id) };
    }
  }
  return null;
}

async function assignDefaultStageAndAutomation(leadId: string) {
  const supabase = createServiceClient();
  const stageQueryVariants = [
    supabase.from("crm_lead_stages").select("id,name").eq("is_active", true).order("position", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("crm_lead_stages").select("id,name").order("position", { ascending: true }).limit(1).maybeSingle(),
  ];
  for (const query of stageQueryVariants) {
    const { data } = await query;
    if (!data?.id) continue;
    const stagePatch = sanitizeLeadPayload({ stage_id: data.id });
    const { error: updateError } = await supabase.from("crm_leads").update(stagePatch).eq("id", leadId);
    if (!updateError) {
      await runStageAutomation({ leadId, toStageId: String(data.id) });
      return;
    }
  }
}

async function triggerJourneyAndAlert(params: {
  leadId: string;
  assignedAgentId: string | null;
  createdBy: string;
  leadName: string;
  phone: string;
  metadata: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  const queueCandidates: Array<Record<string, unknown>> = [
    {
      lead_id: params.leadId,
      status: "pending",
      scheduled_at: new Date().toISOString(),
      metadata: {
        trigger: "manual_intake",
        journey: "whatsapp_welcome",
        ...params.metadata,
      },
    },
    {
      lead_id: params.leadId,
      status: "pending",
      run_at: new Date().toISOString(),
      metadata: {
        trigger: "manual_intake",
        journey: "whatsapp_welcome",
        ...params.metadata,
      },
    },
  ];
  for (const payload of queueCandidates) {
    const { error } = await supabase.from("crm_journey_queue").insert(payload);
    if (!error) break;
  }

  const notificationTargets = params.assignedAgentId ? [params.assignedAgentId] : [];
  for (const targetUserId of notificationTargets) {
    const candidates = [
      {
        lead_id: params.leadId,
        recipient_user_id: targetUserId,
        title: "New institutional lead created",
        message: `${params.leadName} was added via institutional intake.`,
        severity: "high",
        read: false,
      },
      {
        lead_id: params.leadId,
        user_id: targetUserId,
        title: "New institutional lead created",
        body: `${params.leadName} was added via institutional intake.`,
        type: "high",
        is_read: false,
      },
    ];
    for (const candidate of candidates) {
      const { error } = await supabase.from("crm_notifications").insert(candidate);
      if (!error) break;
    }
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !createAllowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const details = (body?.details || {}) as Record<string, unknown>;
    const sourceIdRaw = typeof body?.source_id === "string" ? body.source_id.trim() : null;
    if (sourceIdRaw && !UUID_REGEX.test(sourceIdRaw)) {
      return NextResponse.json({ error: "source_id must be a valid UUID." }, { status: 400 });
    }
    const sourceId = sourceIdRaw && UUID_REGEX.test(sourceIdRaw) ? sourceIdRaw : null;
    const attribution = extractLeadAttribution({
      sourcePage: typeof body?.source_page === "string" ? body.source_page : null,
      details,
      sourceType: typeof body?.source_type === "string" ? body.source_type : null,
      sourceName: typeof body?.source_name === "string" ? body.source_name : sourceId,
    });

    const name = String(body?.name || "").trim();
    const phone = String(body?.phone || "").trim();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const buyerType = typeof body?.buyer_type === "string" ? body.buyer_type : null;
    const budgetMin = toBudgetNumber(body?.budget_min);
    const budgetMax = toBudgetNumber(body?.budget_max);
    const locationPreference = typeof body?.location_preference === "string" ? body.location_preference : null;
    const propertyType = typeof body?.property_type === "string" ? body.property_type : null;
    const riskAppetite = typeof body?.risk_appetite === "string" ? body.risk_appetite : typeof details?.risk_appetite === "string" ? String(details.risk_appetite) : null;
    const timeline = typeof body?.timeline === "string" ? body.timeline : typeof details?.timeline === "string" ? String(details.timeline) : null;
    const wealthBracket = typeof body?.wealth_bracket === "string" ? body.wealth_bracket : null;
    const investmentStyle = typeof body?.investment_style === "string" ? body.investment_style : null;
    const notes = typeof body?.notes === "string" ? body.notes : null;

    if (!name || !phone) {
      return NextResponse.json({ error: "name and phone are required." }, { status: 400 });
    }

    const duplicate = await detectDuplicateLead(phone, email);
    if (duplicate) {
      return NextResponse.json(
        {
          error: `Duplicate lead detected by ${duplicate.type}.`,
          duplicateType: duplicate.type,
          duplicateLeadId: duplicate.id,
        },
        { status: 409 }
      );
    }

    const payload = {
      name: String(body?.name || "").trim(),
      phone: String(body?.phone || "").trim(),
      email,
      source_id: sourceId,  // must be UUID FK or null — never a plain string
      budget_min: budgetMin,
      budget_max: budgetMax,
      location_preference: locationPreference ?? body?.location ?? null,
      property_type: propertyType,
      buyer_type: buyerType,
      timeline,
      wealth_bracket: wealthBracket,
      investment_style: investmentStyle,
      risk_appetite: riskAppetite,
      notes,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_term: attribution.utm_term,
      utm_content: attribution.utm_content,
      gclid: attribution.gclid,
      fb_lead_id: attribution.fbclid,
      landing_page: attribution.landing_page_url,
      attribution_metadata: {
        ...(attribution.attribution_metadata || {}),
        ...(typeof body?.attribution_metadata === "object" && body.attribution_metadata ? (body.attribution_metadata as Record<string, unknown>) : {}),
        investor_profile: {
          ...details,
          property_type: propertyType,
          timeline,
          wealth_bracket: wealthBracket,
          investment_style: investmentStyle,
          risk_appetite: riskAppetite,
          notes,
          location_preference: locationPreference,
          budget_min: budgetMin,
          budget_max: budgetMax,
        },
      },
    };
    const sanitizedPayload = sanitizeLeadPayload(payload);

    const supabase = createServiceClient();
    const { data: inserted, error: insertError } = await supabase
      .from("crm_leads")
      .insert(sanitizedPayload)
      .select("id, phone, assigned_to")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ error: insertError?.message || "Failed to create lead." }, { status: 500 });
    }

    const routingResult = await routeLeadByOwnership({
      leadId: String(inserted.id),
      sourceType: null,
      sourceName: null,
      projectId: null,
    });

    await assignDefaultStageAndAutomation(String(inserted.id));
    await mapBehaviorToLead(String(inserted.id), inserted.phone);

    let automationResult: { sent: boolean; reason: string } | null = null;
    let automationWarning: string | null = null;
    try {
      automationResult = await onNewLeadAutomation({
        leadId: String(inserted.id),
        leadPhone: inserted.phone,
        sentBy: session.user.id,
      });
    } catch (automationError: unknown) {
      automationWarning = automationError instanceof Error ? automationError.message : "WhatsApp automation failed.";
      if (process.env.NODE_ENV !== "production") {
        console.warn("[crm/leads] Non-blocking automation failure:", automationWarning);
      }
    }

    let journeyWarning: string | null = null;
    try {
      await triggerJourneyAndAlert({
        leadId: String(inserted.id),
        assignedAgentId: inserted.assigned_to ? String(inserted.assigned_to) : null,
        createdBy: session.user.id,
        leadName: name,
        phone,
        metadata: details,
      });
    } catch (journeyError: unknown) {
      journeyWarning = journeyError instanceof Error ? journeyError.message : "Journey trigger failed.";
      if (process.env.NODE_ENV !== "production") {
        console.warn("[crm/leads] Non-blocking journey trigger failure:", journeyWarning);
      }
    }

    return NextResponse.json({
      success: true,
      leadId: inserted.id,
      routing: routingResult,
      automation: { newLeadGreeting: automationResult },
      warnings: [automationWarning, journeyWarning].filter(Boolean),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected lead creation error." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCrmSessionResult();
    if (!session.user || !createAllowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const leadId = String(body?.leadId || "");
    const updates = (body?.updates || {}) as Record<string, unknown>;
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required." }, { status: 400 });
    }
    const safeUpdates = sanitizeLeadPayload(updates);
    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: "No editable fields provided." }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { error } = await supabase.from("crm_leads").update(safeUpdates).eq("id", leadId);
    if (error) {
      return NextResponse.json({ error: error.message || "Failed to update lead." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected lead update error." },
      { status: 500 }
    );
  }
}
