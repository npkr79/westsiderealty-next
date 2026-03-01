import { createServiceClient } from "@/lib/supabase/serviceClient";
import { handleIntentSignals } from "@/services/intentAlertService";
import { sanitizeLeadPayload } from "@/lib/crm/sanitizeLeadPayload";
import {
  getSimulationSchemaMap,
  sanitizePayloadForTable,
  type SimulationSchemaMap,
  type SimulationTableName,
} from "@/services/crmSimulationSchema";

type PercentConfig = Record<string, number>;

export interface SimulationRequest {
  days: number;
  timeTravelMinutes: number;
  leadsPerDay: number;
  locations: string[];
  budgetDistribution: PercentConfig;
  buyerTypeDistribution: PercentConfig;
  sourceDistribution: PercentConfig;
  agentProductivityDistribution: PercentConfig;
  missedFollowupRate: number;
  funnel: {
    siteVisitRate: number;
    negotiationRate: number;
    closureRate: number;
  };
  behavior: {
    pricingViewRate: number;
    brochureDownloadRate: number;
    repeatVisitRate: number;
  };
  whatsapp: {
    replyRate: number;
    followupRate: number;
  };
}

export interface SimulationLog {
  at: string;
  level: "info" | "error";
  message: string;
}

export interface SimulationResult {
  runId: string;
  startedAt: string;
  finishedAt: string;
  summary: {
    leadsGenerated: number;
    leadsAssigned: number;
    tasksCreated: number;
    missedFollowups: number;
    siteVisits: number;
    negotiations: number;
    closures: number;
    behaviorEvents: number;
    whatsappReplies: number;
    whatsappFollowups: number;
    failures: number;
  };
  logs: SimulationLog[];
}

type AgentRow = {
  id: string;
  full_name: string | null;
};

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));
const toRatio = (pct: number): number => clamp(pct) / 100;

const pickByDistribution = (distribution: PercentConfig, fallback: string): string => {
  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  if (!entries.length) return fallback;
  const total = entries.reduce((sum, [, val]) => sum + val, 0);
  const target = Math.random() * total;
  let cursor = 0;
  for (const [key, value] of entries) {
    cursor += value;
    if (target <= cursor) return key;
  }
  return entries[entries.length - 1]?.[0] || fallback;
};

const randomPhone = (): string => {
  const seed = Math.floor(1000000000 + Math.random() * 8999999999);
  return String(seed);
};

const jitterCount = (base: number): number => {
  const variance = Math.max(1, Math.round(base * 0.2));
  return Math.max(1, base + Math.floor(Math.random() * (variance * 2 + 1)) - variance);
};

const randomInRange = (min: number, max: number): number => min + Math.random() * (max - min);

const leadStatusFromFunnel = (visited: boolean, negotiated: boolean, closed: boolean): string => {
  if (closed) return "won";
  if (negotiated) return "qualified";
  if (visited) return "qualified";
  return "new";
};

async function loadAgents(): Promise<AgentRow[]> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("crm_users").select("id,full_name").eq("is_active", true).limit(300);
  return (data as AgentRow[]) || [];
}

const formatDbError = (table: string, error: { message?: string; code?: string; details?: string; hint?: string } | null | undefined): string =>
  error
    ? `${table}: code=${error.code || "-"} message=${error.message || "-"} details=${error.details || "-"} hint=${error.hint || "-"}`
    : `${table}: unknown db error`;

async function insertUsingSchema(
  table: SimulationTableName,
  schemaMap: SimulationSchemaMap,
  payload: Record<string, unknown>
): Promise<{ id: string | null; error: string | null; droppedFields: string[]; missingRequiredFields: string[] }> {
  const supabase = createServiceClient();
  const tableSchema = schemaMap.tables[table];
  if (!tableSchema?.exists) {
    return {
      id: null,
      error: `${table}: table not found in schema metadata.`,
      droppedFields: Object.keys(payload),
      missingRequiredFields: [],
    };
  }
  const prepared = sanitizePayloadForTable(tableSchema, payload);
  if (prepared.missingRequiredFields.length) {
    return {
      id: null,
      error: `${table}: missing required fields (${prepared.missingRequiredFields.join(", ")}).`,
      droppedFields: prepared.droppedFields,
      missingRequiredFields: prepared.missingRequiredFields,
    };
  }
  const result = await supabase.from(table).insert(prepared.payload).select("id").maybeSingle();
  if (!result.error && result.data?.id) {
    return {
      id: String(result.data.id),
      error: null,
      droppedFields: prepared.droppedFields,
      missingRequiredFields: prepared.missingRequiredFields,
    };
  }
  return {
    id: null,
    error: formatDbError(table, result.error),
    droppedFields: prepared.droppedFields,
    missingRequiredFields: prepared.missingRequiredFields,
  };
}

async function insertLead(
  payload: Record<string, unknown>,
  schemaMap: SimulationSchemaMap
): Promise<{ id: string | null; error: string | null; droppedFields: string[]; missingRequiredFields: string[] }> {
  const apiAlignedPayload = {
    name: payload.name,
    phone: payload.phone,
    source: payload.source,
    source_type: payload.source_type,
    source_name: payload.source_name,
    budget_min: payload.budget_min,
    budget_max: payload.budget_max,
    location: payload.location,
    buyer_type: payload.buyer_type,
    status: payload.status,
    assignment_status: payload.assignment_status,
    attribution_metadata: payload.attribution_metadata ?? {},
    created_at: payload.created_at,
    updated_at: payload.updated_at,
    last_activity_at: payload.last_activity_at,
  };
  const sanitizedLeadPayload = sanitizeLeadPayload(apiAlignedPayload);
  return insertUsingSchema("crm_leads", schemaMap, sanitizedLeadPayload);
}

async function insertTask(payload: Record<string, unknown>, schemaMap: SimulationSchemaMap): Promise<boolean> {
  const tableSchema = schemaMap.tables.crm_tasks;
  if (!tableSchema.exists) return false;
  const supabase = createServiceClient();
  const prepared = sanitizePayloadForTable(tableSchema, payload);
  if (prepared.missingRequiredFields.length) return false;
  const { error } = await supabase.from("crm_tasks").insert(prepared.payload);
  return !error;
}

async function insertActivity(payload: Record<string, unknown>, schemaMap: SimulationSchemaMap): Promise<boolean> {
  const tableSchema = schemaMap.tables.crm_lead_activities;
  if (!tableSchema.exists) return false;
  const supabase = createServiceClient();
  const prepared = sanitizePayloadForTable(tableSchema, payload);
  if (prepared.missingRequiredFields.length) return false;
  const { error } = await supabase.from("crm_lead_activities").insert(prepared.payload);
  return !error;
}

async function insertBehaviorEvent(payload: Record<string, unknown>, schemaMap: SimulationSchemaMap): Promise<boolean> {
  const behaviorTable = schemaMap.behaviorTable;
  if (!behaviorTable) return false;
  const tableSchema = schemaMap.tables[behaviorTable];
  if (!tableSchema.exists) return false;
  const supabase = createServiceClient();
  const prepared = sanitizePayloadForTable(tableSchema, payload);
  if (prepared.missingRequiredFields.length) return false;
  const { error } = await supabase.from(behaviorTable).insert(prepared.payload);
  return !error;
}

async function updateLeadStatus(leadId: string, status: string, schemaMap: SimulationSchemaMap): Promise<void> {
  const supabase = createServiceClient();
  const tableSchema = schemaMap.tables.crm_leads;
  if (!tableSchema.exists) return;
  const prepared = sanitizePayloadForTable(tableSchema, sanitizeLeadPayload({
    status,
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  if (Object.keys(prepared.payload).length === 0) return;
  await supabase
    .from("crm_leads")
    .update(prepared.payload)
    .eq("id", leadId);
}

async function tryAssignLead(leadId: string, assignedAgentId: string | null, schemaMap: SimulationSchemaMap): Promise<void> {
  if (!assignedAgentId) return;
  const supabase = createServiceClient();
  const tableSchema = schemaMap.tables.crm_leads;
  if (!tableSchema.exists) return;
  const prepared = sanitizePayloadForTable(tableSchema, sanitizeLeadPayload({
    assigned_agent_id: assignedAgentId,
    assignment_status: "assigned",
    updated_at: new Date().toISOString(),
  }));
  if (Object.keys(prepared.payload).length === 0) return;
  await supabase
    .from("crm_leads")
    .update(prepared.payload)
    .eq("id", leadId);
}

async function writeRunLog(runId: string, level: "info" | "error", message: string, schemaMap: SimulationSchemaMap) {
  await insertActivity({
    lead_id: null,
    activity_type: "simulation_log",
    notes: JSON.stringify({ runId, level, message }),
  }, schemaMap);
}

export async function runCrmSimulation(input: SimulationRequest): Promise<SimulationResult> {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const logs: SimulationLog[] = [];
  const schemaMap = await getSimulationSchemaMap();
  const addLog = async (level: "info" | "error", message: string) => {
    const line = { at: new Date().toISOString(), level, message };
    logs.push(line);
    await writeRunLog(runId, level, message, schemaMap);
  };

  const normalizedDays = Math.max(1, Math.min(90, Math.floor(input.days || 30)));
  const normalizedLeadsPerDay = Math.max(1, Math.min(500, Math.floor(input.leadsPerDay || 20)));
  const totalLeadLimit = 10000;
  if (normalizedDays * normalizedLeadsPerDay > totalLeadLimit) {
    throw new Error(`Simulation exceeds safe limit (${totalLeadLimit} leads). Reduce days or leads/day.`);
  }

  const agents = await loadAgents();
  const agentIds = agents.map((a) => a.id);
  const summary = {
    leadsGenerated: 0,
    leadsAssigned: 0,
    tasksCreated: 0,
    missedFollowups: 0,
    siteVisits: 0,
    negotiations: 0,
    closures: 0,
    behaviorEvents: 0,
    whatsappReplies: 0,
    whatsappFollowups: 0,
    failures: 0,
  };

  await addLog("info", `Schema cache loaded at ${schemaMap.fetchedAt}.`);
  const requiredTables: SimulationTableName[] = ["crm_leads", "crm_tasks", "crm_lead_activities"];
  for (const table of requiredTables) {
    if (!schemaMap.tables[table].exists) {
      await addLog("error", `Schema missing required table: ${table}`);
    }
  }
  if (!schemaMap.behaviorTable) {
    await addLog("error", "Schema missing behavior table: crm_lead_behaviour or crm_behavior_events.");
  }

  await addLog("info", `Simulation started: ${normalizedDays} days @ ${normalizedLeadsPerDay} leads/day.`);

  const now = Date.now();
  const spanMs = Math.max(1, input.timeTravelMinutes) * 60 * 1000;
  const dayStep = spanMs / normalizedDays;

  for (let day = 0; day < normalizedDays; day += 1) {
    const leadsToday = jitterCount(normalizedLeadsPerDay);
    for (let i = 0; i < leadsToday; i += 1) {
      try {
        const simulatedAtMs = now - spanMs + day * dayStep + randomInRange(0, dayStep);
        const createdAtIso = new Date(simulatedAtMs).toISOString();
        const source = pickByDistribution(input.sourceDistribution, "meta");
        const buyerType = pickByDistribution(input.buyerTypeDistribution, "end_user");
        const budgetBand = pickByDistribution(input.budgetDistribution, "mid");
        const location = input.locations.length
          ? input.locations[Math.floor(Math.random() * input.locations.length)]
          : "Hyderabad";

        const budgetMin =
          budgetBand === "high" ? 30000000 : budgetBand === "low" ? 8000000 : 15000000;
        const budgetMax =
          budgetBand === "high" ? 60000000 : budgetBand === "low" ? 15000000 : 30000000;

        const assignedAgentId = agentIds.length ? agentIds[Math.floor(Math.random() * agentIds.length)] : null;

        const productivity = pickByDistribution(input.agentProductivityDistribution, "medium");
        const productivityModifier = productivity === "high" ? 0.7 : productivity === "low" ? 1.25 : 1;
        const missFollowup =
          Math.random() < Math.min(0.95, toRatio(input.missedFollowupRate) * productivityModifier);

        const siteVisit = Math.random() < toRatio(input.funnel.siteVisitRate);
        const negotiation = siteVisit && Math.random() < toRatio(input.funnel.negotiationRate);
        const closure = negotiation && Math.random() < toRatio(input.funnel.closureRate);
        const status = leadStatusFromFunnel(siteVisit, negotiation, closure);

        const leadInsert = await insertLead({
          name: `Sim Lead ${day + 1}-${i + 1}`,
          phone: randomPhone(),
          source: source,
          source_type: source,
          source_name: source,
          budget_min: budgetMin,
          budget_max: budgetMax,
          location,
          buyer_type: buyerType,
          status,
          assignment_status: assignedAgentId ? "assigned" : "pending",
          attribution_metadata: { simulation_run_id: runId, source, buyer_type: buyerType, location },
          created_at: createdAtIso,
          updated_at: createdAtIso,
          last_activity_at: createdAtIso,
        }, schemaMap);
        const leadId = leadInsert.id;

        if (!leadId) {
          summary.failures += 1;
          if (leadInsert.droppedFields.length) {
            await addLog(
              "info",
              `crm_leads dropped fields (${leadInsert.droppedFields.join(", ")}) for day ${day + 1}, index ${i + 1}.`
            );
          }
          await addLog(
            "error",
            `Lead insert failed for day ${day + 1}, index ${i + 1}. ${leadInsert.error || "No DB error details."}`
          );
          continue;
        }
        summary.leadsGenerated += 1;
        await tryAssignLead(leadId, assignedAgentId, schemaMap);
        if (assignedAgentId) summary.leadsAssigned += 1;

        if (missFollowup) {
          const taskCreated = await insertTask({
            lead_id: leadId,
            assigned_to: assignedAgentId,
            title: "Simulation follow-up missed",
            description: "Auto-generated by simulation engine: follow-up missed.",
            status: "pending",
            priority: "high",
            due_date: new Date(simulatedAtMs + 4 * 60 * 60 * 1000).toISOString(),
          }, schemaMap);
          if (taskCreated) summary.tasksCreated += 1;
          summary.missedFollowups += 1;
        } else {
          const taskCreated = await insertTask({
            lead_id: leadId,
            assigned_to: assignedAgentId,
            title: "Simulation initial follow-up",
            description: "Auto-generated by simulation engine: completed initial follow-up.",
            status: "completed",
            priority: "medium",
            due_date: new Date(simulatedAtMs + 2 * 60 * 60 * 1000).toISOString(),
          }, schemaMap);
          if (taskCreated) summary.tasksCreated += 1;
        }

        if (siteVisit) {
          summary.siteVisits += 1;
          await insertActivity({
            lead_id: leadId,
            activity_type: "site_visit",
            notes: "Simulation: site visit completed.",
            created_at: new Date(simulatedAtMs + 8 * 60 * 60 * 1000).toISOString(),
          }, schemaMap);
        }
        if (negotiation) {
          summary.negotiations += 1;
          await insertActivity({
            lead_id: leadId,
            activity_type: "negotiation",
            notes: "Simulation: negotiation started.",
            created_at: new Date(simulatedAtMs + 12 * 60 * 60 * 1000).toISOString(),
          }, schemaMap);
        }
        if (closure) {
          summary.closures += 1;
          await updateLeadStatus(leadId, "won", schemaMap);
          await insertActivity({
            lead_id: leadId,
            activity_type: "closure",
            notes: "Simulation: deal closed.",
            created_at: new Date(simulatedAtMs + 24 * 60 * 60 * 1000).toISOString(),
          }, schemaMap);
        }

        const visitorId = `sim-visitor-${crypto.randomUUID()}`;
        const sessionId = `sim-session-${crypto.randomUUID()}`;

        const emitBehavior = async (
          eventName: "page_view" | "pricing_view" | "brochure_download",
          isRepeatVisit: boolean
        ) => {
          const ok = await insertBehaviorEvent({
            lead_id: leadId,
            event_name: eventName,
            page_path: "/simulation",
            visitor_id: visitorId,
            session_id: sessionId,
            visit_count: isRepeatVisit ? 2 : 1,
            is_repeat_visit: isRepeatVisit,
            source_type: source,
            metadata: {
              simulation_run_id: runId,
              source,
              buyer_type: buyerType,
              budget_min: budgetMin,
              budget_max: budgetMax,
              location,
            },
            created_at: new Date(simulatedAtMs + 30 * 60 * 1000).toISOString(),
          }, schemaMap);
          if (ok) {
            summary.behaviorEvents += 1;
            await handleIntentSignals({
              leadId,
              eventName,
              isRepeatVisit,
              eventPayload: { source, buyer_type: buyerType },
              simulationMode: true,
            });
          }
        };

        await emitBehavior("page_view", Math.random() < toRatio(input.behavior.repeatVisitRate));
        if (Math.random() < toRatio(input.behavior.pricingViewRate)) {
          await emitBehavior("pricing_view", false);
        }
        if (Math.random() < toRatio(input.behavior.brochureDownloadRate)) {
          await emitBehavior("brochure_download", false);
        }

        if (Math.random() < toRatio(input.whatsapp.followupRate)) {
          summary.whatsappFollowups += 1;
          await insertActivity({
            lead_id: leadId,
            activity_type: "whatsapp_followup",
            notes: "Simulation: outbound WhatsApp follow-up sent.",
            created_at: new Date(simulatedAtMs + 60 * 60 * 1000).toISOString(),
          }, schemaMap);
        }
        if (Math.random() < toRatio(input.whatsapp.replyRate)) {
          summary.whatsappReplies += 1;
          await insertActivity({
            lead_id: leadId,
            activity_type: "whatsapp_reply",
            notes: "Simulation: inbound WhatsApp reply received.",
            created_at: new Date(simulatedAtMs + 90 * 60 * 1000).toISOString(),
          }, schemaMap);
        }
      } catch (error: unknown) {
        summary.failures += 1;
        await addLog("error", error instanceof Error ? error.message : "Unknown simulation error");
      }
    }
  }

  const finishedAt = new Date().toISOString();
  await addLog("info", `Simulation completed. Leads: ${summary.leadsGenerated}, failures: ${summary.failures}.`);
  await insertActivity({
    lead_id: null,
    activity_type: "simulation_run",
    notes: JSON.stringify({ runId, startedAt, finishedAt, summary }),
  }, schemaMap);

  return {
    runId,
    startedAt,
    finishedAt,
    summary,
    logs,
  };
}
