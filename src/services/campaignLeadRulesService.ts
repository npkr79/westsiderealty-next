import { createServiceClient } from "@/lib/supabase/serviceClient";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";

export const META_COMMERCIAL_CAMPAIGN_ID = "120250760188730100";

type LeadForCampaignRules = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  source_type?: string | null;
  source_channel?: string | null;
  assigned_to?: string | null;
  attribution_metadata?: Record<string, unknown> | null;
};

type CampaignRuleResult = {
  matched: boolean;
  assignedToKrishna: boolean;
  warnings: string[];
};

function normalize(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getLeadCampaignId(lead: Pick<LeadForCampaignRules, "attribution_metadata">): string | null {
  const metadata = lead.attribution_metadata ?? {};
  return normalize(metadata.campaign_id);
}

export function isTargetMetaCampaignLead(lead: Pick<LeadForCampaignRules, "attribution_metadata">): boolean {
  return getLeadCampaignId(lead) === META_COMMERCIAL_CAMPAIGN_ID;
}

export async function resolveKrishnaAgentId(): Promise<string | null> {
  const configuredId = normalize(process.env.CRM_KRISHNA_AGENT_ID);
  if (configuredId) return configuredId;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("crm_users")
    .select("id,full_name,is_active")
    .ilike("full_name", "%Krishna%")
    .eq("is_active", true)
    .order("full_name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[campaignLeadRules] Krishna lookup failed:", error.message);
    return null;
  }

  return data?.id ? String(data.id) : null;
}

async function assignLeadToKrishna(leadId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const agentId = await resolveKrishnaAgentId();
  if (!agentId) return false;

  const { data: existingLead } = await supabase
    .from("crm_leads")
    .select("assigned_to")
    .eq("id", leadId)
    .maybeSingle();

  if (existingLead?.assigned_to && String(existingLead.assigned_to) === agentId) {
    return true;
  }

  const patch = sanitizeLeadPayload({
    assigned_to: agentId,
    assignment_status: "assigned",
  });

  const { error } = await supabase.from("crm_leads").update(patch).eq("id", leadId);
  if (error) {
    console.warn("[campaignLeadRules] Campaign lead assignment failed:", error.message);
    return false;
  }

  const assignmentCandidates: Array<Record<string, unknown>> = [
    {
      lead_id: leadId,
      agent_id: agentId,
      assignment_note: `Auto-assigned to Krishna for Meta campaign ${META_COMMERCIAL_CAMPAIGN_ID}`,
      assignment_type: "campaign_rule",
      assigned_by: null,
    },
    {
      lead_id: leadId,
      assigned_to: agentId,
      reason: `Auto-assigned to Krishna for Meta campaign ${META_COMMERCIAL_CAMPAIGN_ID}`,
    },
    {
      lead_id: leadId,
      agent_id: agentId,
    },
  ];

  for (const payload of assignmentCandidates) {
    const { error } = await supabase.from("crm_lead_assignments").insert(payload);
    if (!error) break;
  }

  return true;
}

export async function applyCampaignLeadRules(lead: LeadForCampaignRules): Promise<CampaignRuleResult> {
  const warnings: string[] = [];
  if (!isTargetMetaCampaignLead(lead)) {
    return { matched: false, assignedToKrishna: false, warnings };
  }

  let assignedToKrishna = false;

  try {
    assignedToKrishna = await assignLeadToKrishna(lead.id);
    if (!assignedToKrishna) warnings.push("Krishna agent could not be resolved or assignment failed.");
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Campaign assignment failed.");
  }

  return { matched: true, assignedToKrishna, warnings };
}
