import { createServiceClient } from "@/lib/supabase/serviceClient";
import { routeLeadByOwnership } from "@/services/crmLeadRoutingService";
import { mapBehaviorToLead } from "@/services/behaviorLeadMappingService";
import { runStageAutomation } from "@/services/stageAutomationService";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";
import { sendLeadAlertWhatsApp } from "@/lib/crm/whatsappAlert";

const GRAPH_API_BASE = "https://graph.facebook.com";
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION ?? "v21.0";
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP_NUMBER ?? "919866085831";

interface MetaWebhookValue {
  leadgen_id?: string;
  page_id?: string;
  form_id?: string;
  ad_id?: string;
  adgroup_id?: string;
  created_time?: number;
}

interface MetaFieldDataItem {
  name: string;
  values?: string[];
}

interface MetaLeadGraphResponse {
  id: string;
  created_time?: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id?: string;
  field_data?: MetaFieldDataItem[];
}

function extractFieldValue(fieldData: MetaFieldDataItem[] | undefined, name: string): string | null {
  if (!Array.isArray(fieldData)) return null;
  const item = fieldData.find((f) => String(f?.name || "").toLowerCase() === name.toLowerCase());
  const vals = item?.values;
  if (Array.isArray(vals) && vals.length > 0 && vals[0]) return String(vals[0]).trim();
  return null;
}

function buildFieldMap(fieldData: MetaFieldDataItem[] | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(fieldData)) return map;
  for (const item of fieldData) {
    const name = String(item?.name || "").trim();
    const vals = item?.values;
    if (name && Array.isArray(vals) && vals.length > 0 && vals[0]) {
      map[name] = String(vals[0]).trim();
    }
  }
  return map;
}

async function fetchLeadFromGraphApi(leadgenId: string): Promise<MetaLeadGraphResponse | null> {
  const token = process.env.META_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    console.warn("[metaLeadService] META_ACCESS_TOKEN or META_PAGE_ACCESS_TOKEN not set");
    return null;
  }

  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${leadgenId}?fields=id,created_time,ad_id,adset_id,campaign_id,form_id,field_data&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("[metaLeadService] Graph API error:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as MetaLeadGraphResponse;
  return data?.id ? data : null;
}

async function resolveMetaSourceId(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data: sources } = await supabase.from("crm_lead_sources").select("id,name");
  const rows = (sources ?? []) as Array<{ id: string; name: string | null }>;
  const metaNames = ["facebook", "meta", "facebook_lead_ads", "meta_lead_ads"];
  const hit = rows.find((r) => {
    const n = (r.name ?? "").toLowerCase();
    return metaNames.some((m) => n.includes(m) || n === m);
  });
  if (hit?.id) return String(hit.id);
  const manualUpload = rows.find((r) => (r.name ?? "").toLowerCase().includes("manual"));
  if (manualUpload?.id) return String(manualUpload.id);
  const first = rows[0];
  return first?.id ? String(first.id) : null;
}

async function assignDefaultStageAndAutomation(leadId: string): Promise<void> {
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

export interface ProcessMetaLeadResult {
  rawLeadId: string | null;
  crmLeadId: string | null;
  error?: string;
}

export async function processMetaLead(
  webhookPayload: Record<string, unknown>,
  value: MetaWebhookValue
): Promise<ProcessMetaLeadResult> {
  const leadgenId = String(value?.leadgen_id || "").trim();
  if (!leadgenId) {
    return { rawLeadId: null, crmLeadId: null, error: "Missing leadgen_id" };
  }

  const supabase = createServiceClient();

  const rawLeadInsert: Record<string, unknown> = {
    leadgen_id: leadgenId,
    page_id: value?.page_id ?? null,
    form_id: value?.form_id ?? null,
    ad_id: value?.ad_id ?? null,
    adset_id: value?.adgroup_id ?? null,
    payload: webhookPayload,
  };

  const { data: rawInserted, error: rawError } = await supabase
    .from("crm_meta_raw_leads")
    .insert(rawLeadInsert)
    .select("id")
    .single();

  if (rawError) {
    console.error("[metaLeadService] Failed to insert crm_meta_raw_leads:", rawError);
    return { rawLeadId: null, crmLeadId: null, error: rawError.message };
  }

  const rawLeadId = rawInserted?.id ? String(rawInserted.id) : null;

  const leadData = await fetchLeadFromGraphApi(leadgenId);
  if (!leadData) {
    return { rawLeadId, crmLeadId: null, error: "Failed to fetch lead from Graph API" };
  }

  const updatePayload: Record<string, unknown> = {
    campaign_id: leadData.campaign_id ?? null,
    adset_id: leadData.adset_id ?? value?.adgroup_id ?? null,
    ad_id: leadData.ad_id ?? value?.ad_id ?? null,
    form_id: leadData.form_id ?? value?.form_id ?? null,
    graph_response: leadData,
  };

  if (rawLeadId) {
    await supabase.from("crm_meta_raw_leads").update(updatePayload).eq("id", rawLeadId);
  }

  const fieldMap = buildFieldMap(leadData.field_data);
  const answersPayload = Object.entries(fieldMap).map(([fieldName, fieldValue]) => ({
    raw_lead_id: rawLeadId,
    field_name: fieldName,
    field_value: fieldValue,
  }));

  if (rawLeadId && answersPayload.length > 0) {
    const answersTable = "crm_meta_lead_answers";
    for (const row of answersPayload) {
      const insertPayload: Record<string, unknown> = {
        raw_lead_id: rawLeadId,
        field_name: row.field_name,
        field_value: row.field_value,
      };
      await supabase.from(answersTable).insert(insertPayload);
    }
  }

  const name =
    extractFieldValue(leadData.field_data, "full_name") ||
    extractFieldValue(leadData.field_data, "name") ||
    [extractFieldValue(leadData.field_data, "first_name"), extractFieldValue(leadData.field_data, "last_name")]
      .filter(Boolean)
      .join(" ") ||
    "Meta Lead";
  const phone =
    extractFieldValue(leadData.field_data, "phone_number") ||
    extractFieldValue(leadData.field_data, "phone") ||
    extractFieldValue(leadData.field_data, "mobile") ||
    "";
  const email =
    extractFieldValue(leadData.field_data, "email") || extractFieldValue(leadData.field_data, "email_address") || null;

  if (!phone) {
    return { rawLeadId, crmLeadId: null, error: "Lead has no phone number" };
  }

  const sourceId = await resolveMetaSourceId();

  // Check for form-based routing before building payload
  let formAgentId: string | null = null;
  let formName: string | null = null;
  let projectName: string | null = null;
  if (leadData.form_id) {
    const { data: formRoute } = await supabase
      .from("crm_meta_form_routing")
      .select("agent_id,form_name,project_tag")
      .eq("form_id", leadData.form_id)
      .eq("is_active", true)
      .maybeSingle();
    formAgentId = formRoute?.agent_id ? String(formRoute.agent_id) : null;
    formName = formRoute?.form_name ? String(formRoute.form_name) : null;
    projectName = formRoute?.project_tag ? String(formRoute.project_tag) : null;
  }

  const crmPayload = sanitizeLeadPayload({
    name: name.trim() || "Meta Lead",
    phone: phone.trim(),
    email,
    source_id: sourceId,
    fb_lead_id: leadgenId,
    meta_leadgen_id: leadgenId,
    source_type: "meta",
    source_channel: "facebook_lead_ads",
    assignment_status: formAgentId ? "assigned" : "pending",
    ...(formAgentId ? { assigned_to: formAgentId } : {}),
    attribution_metadata: {
      source: "meta_lead_ads",
      leadgen_id: leadgenId,
      page_id: value?.page_id,
      form_id: value?.form_id,
      fb_form_id: leadData.form_id ?? value?.form_id,
      fb_form_name: formName,
      ad_id: leadData.ad_id ?? value?.ad_id,
      campaign_id: leadData.campaign_id,
      adset_id: leadData.adset_id,
      field_data: fieldMap,
      ...(projectName ? { project_name: projectName } : {}),
    },
  });

  try {
    const { data: insertedLead, error: insertError } = await supabase
      .from("crm_leads")
      .insert(crmPayload)
      .select("id")
      .single();

    if (insertError || !insertedLead) {
      if (insertError?.code === "23505") {
        // Genuine duplicate — skip silently
        console.log("[Meta] Duplicate lead blocked at insert — skipping push");
        return { rawLeadId, crmLeadId: null };
      }
      // Real error — throw so catch block handles it properly
      throw new Error(insertError?.message ?? "Failed to create CRM lead");
    }

    const crmLeadId = String(insertedLead.id);

    if (formAgentId) {
      // Form routing matched — skip ownership lookup, just log assignment
      try {
        await supabase.from("crm_lead_assignments").insert({
          lead_id: crmLeadId,
          assigned_to: formAgentId,
          assigned_by: null,
          reason: "Auto-assigned via Meta form routing",
        });
      } catch { /* non-critical */ }

      // Send WhatsApp alert to agent + admin (non-critical, never blocks lead creation)
      const { data: agentData } = await supabase
        .from("crm_users")
        .select("whatsapp_number")
        .eq("id", formAgentId)
        .maybeSingle();
      const alertLabel = projectName ? `${projectName} | ${formName || "Meta Ad"}` : (formName ?? null);
      if (agentData?.whatsapp_number) {
        sendLeadAlertWhatsApp(agentData.whatsapp_number, name, phone, alertLabel).catch(() => {});
      }
      if (projectName && ADMIN_WHATSAPP) {
        sendLeadAlertWhatsApp(ADMIN_WHATSAPP, name, phone, alertLabel).catch(() => {});
      }
    } else {
      await routeLeadByOwnership({
        leadId: crmLeadId,
        sourceType: "meta",
        sourceName: "facebook_lead_ads",
        projectId: null,
      });
      // Push notifications are handled by the DB webhook → /api/crm/push/new-lead
    }

    await assignDefaultStageAndAutomation(crmLeadId);
    await mapBehaviorToLead(crmLeadId, phone);

    if (rawLeadId) {
      await supabase.from("crm_meta_raw_leads").update({ crm_lead_id: crmLeadId }).eq("id", rawLeadId);
    }

    return { rawLeadId, crmLeadId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[metaLeadService] crm_leads insert failed:", err);
    if (rawLeadId) {
      await supabase
        .from("crm_meta_raw_leads")
        .update({ graph_response: { ...(leadData ?? {}), processing_error: message } })
        .eq("id", rawLeadId);
    }
    return { rawLeadId, crmLeadId: null, error: message };
  }
}
