import { createServiceClient } from "@/lib/supabase/serviceClient";
import { onAssignmentAutomation } from "@/services/whatsappAutomationService";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";

interface RouteLeadInput {
  leadId: string;
  sourceType: string | null | undefined;
  sourceName: string | null | undefined;
  projectId: string | null | undefined;
}

interface ManualAssignInput {
  leadId: string;
  agentId: string;
  note?: string | null;
  assignedBy: string;
}

interface RoutingResult {
  assigned: boolean;
  agentId: string | null;
  reason: string;
}

const normalize = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

async function insertAssignmentLog(leadId: string, agentId: string, note: string | null, assignedBy: string | null) {
  const supabase = createServiceClient();

  const payloadCandidates: Array<Record<string, unknown>> = [
    {
      lead_id: leadId,
      agent_id: agentId,
      assignment_note: note,
      assignment_type: "manual_or_auto",
      assigned_by: assignedBy,
    },
    {
      lead_id: leadId,
      agent_id: agentId,
      note,
      assigned_by: assignedBy,
    },
    {
      lead_id: leadId,
      agent_id: agentId,
    },
  ];

  for (const payload of payloadCandidates) {
    const { error } = await supabase.from("crm_lead_assignments").insert(payload);
    if (!error) return;
  }
}

async function insertAssignmentActivity(leadId: string, agentId: string, note: string | null, assignedBy: string | null) {
  const supabase = createServiceClient();
  const detail = note ? `Lead assigned to agent (${agentId}). Note: ${note}` : `Lead assigned to agent (${agentId}).`;
  const payloadCandidates: Array<Record<string, unknown>> = [
    {
      lead_id: leadId,
      activity_type: "assignment_change",
      notes: detail,
      created_by: assignedBy,
      metadata: { agent_id: agentId, note, assigned_by: assignedBy },
    },
    {
      lead_id: leadId,
      activity_type: "assignment_change",
      notes: detail,
      created_by: assignedBy,
    },
    {
      lead_id: leadId,
      activity_type: "assignment_change",
      notes: detail,
    },
  ];
  for (const payload of payloadCandidates) {
    const { error } = await supabase.from("crm_lead_activities").insert(payload);
    if (!error) return;
  }
}

// AGENT_ROLE_ID is the role_id for the "agent" role in crm_users
const AGENT_ROLE_ID = "ba810ef8-af60-428a-a63f-edbba4b4577b";

async function findRoundRobinAgent(): Promise<string | null> {
  const supabase = createServiceClient();
  // Get all active agents by role_id, ordered by least-recently assigned
  const { data: agents } = await supabase
    .from("crm_users")
    .select("id")
    .eq("role_id", AGENT_ROLE_ID)
    .eq("is_active", true)
    .order("updated_at", { ascending: true })
    .limit(1);
  return agents?.[0]?.id ? String(agents[0].id) : null;
}

export async function routeLeadByOwnership(input: RouteLeadInput): Promise<RoutingResult> {
  const supabase = createServiceClient();

  const sourceType = normalize(input.sourceType);
  const sourceName = normalize(input.sourceName);
  const projectId = normalize(input.projectId);

  let ownershipQuery = supabase
    .from("crm_source_ownership")
    .select("agent_id, source_type, source_name, project_id");

  if (sourceType) {
    ownershipQuery = ownershipQuery.eq("source_type", sourceType);
  } else {
    ownershipQuery = ownershipQuery.is("source_type", null);
  }

  if (sourceName) {
    ownershipQuery = ownershipQuery.eq("source_name", sourceName);
  } else {
    ownershipQuery = ownershipQuery.is("source_name", null);
  }

  const { data: ownership, error: ownershipError } = await ownershipQuery
    .order("project_id", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (ownershipError || !ownership?.agent_id) {
    const pendingPatch = sanitizeLeadPayload({ assignment_status: "pending" });
    if (Object.keys(pendingPatch).length > 0) {
      await supabase
        .from("crm_leads")
        .update(pendingPatch)
        .eq("id", input.leadId);
    }
    return { assigned: false, agentId: null, reason: "no_ownership_match" };
  }

  const agentId = String(ownership.agent_id);
  const assignPatch = sanitizeLeadPayload({
    assigned_to: agentId,
    assignment_status: "assigned",
  });
  const { error: updateError } = await supabase
    .from("crm_leads")
    .update(assignPatch)
    .eq("id", input.leadId);

  if (updateError) {
    return { assigned: false, agentId: null, reason: "lead_update_failed" };
  }

  await insertAssignmentLog(input.leadId, agentId, "Auto-assigned via source ownership", null);
  await insertAssignmentActivity(input.leadId, agentId, "Auto-assigned via source ownership", null);
  const { data: lead } = await supabase.from("crm_leads").select("id,phone").eq("id", input.leadId).maybeSingle();
  if (lead?.id) {
    try {
      await onAssignmentAutomation({
        leadId: String(lead.id),
        leadPhone: lead.phone,
        sentBy: "automation-bot",
      });
    } catch (_e) {
      // WhatsApp automation is non-critical — do not fail the assignment
    }
  }
  return { assigned: true, agentId, reason: "ownership_match" };
}

export async function assignLeadManually(input: ManualAssignInput): Promise<RoutingResult> {
  const supabase = createServiceClient();
  const note = normalize(input.note);

  const manualAssignPatch = sanitizeLeadPayload({
    assigned_to: input.agentId,
    assignment_status: "assigned",
  });
  const { error } = await supabase
    .from("crm_leads")
    .update(manualAssignPatch)
    .eq("id", input.leadId);

  if (error) {
    return { assigned: false, agentId: null, reason: "lead_update_failed" };
  }

  await insertAssignmentLog(input.leadId, input.agentId, note, input.assignedBy);
  await insertAssignmentActivity(input.leadId, input.agentId, note, input.assignedBy);
  const { data: lead } = await supabase.from("crm_leads").select("id,phone").eq("id", input.leadId).maybeSingle();
  if (lead?.id) {
    try {
      await onAssignmentAutomation({
        leadId: String(lead.id),
        leadPhone: lead.phone,
        sentBy: input.assignedBy,
      });
    } catch (_e) {
      // WhatsApp automation is non-critical — do not fail the assignment
    }
  }
  return { assigned: true, agentId: input.agentId, reason: "manual_assignment" };
}

export async function reconcilePendingLeadRouting(limit = 100): Promise<{ processed: number; assigned: number }> {
  const supabase = createServiceClient();
  // Select only columns that exist in crm_leads schema
  // source_channel stores the routing source name (was previously source_name)
  const { data: pendingLeads } = await supabase
    .from("crm_leads")
    .select("id,source_type,source_channel")
    .eq("assignment_status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  let assigned = 0;
  let processed = 0;
  for (const lead of pendingLeads || []) {
    processed += 1;
    const result = await routeLeadByOwnership({
      leadId: String(lead.id),
      sourceType: lead.source_type,
      sourceName: lead.source_channel,
      projectId: null,
    });
    if (result.assigned) assigned += 1;
  }
  return { processed, assigned };
}
