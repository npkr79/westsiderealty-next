import { createServiceClient } from "@/lib/supabase/serviceClient";

type QueueStatus = "pending" | "processing" | "completed" | "failed";
type ActionType = "whatsapp" | "task" | "reminder";

interface JourneyQueueRow {
  id: string;
  lead_id: string;
  journey_step_id: string | null;
  step_id: string | null;
  status: string | null;
  scheduled_at: string | null;
  attempts: number | null;
  metadata: Record<string, unknown> | null;
}

interface JourneyStepRow {
  id: string;
  action_type: string;
  title: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
}

const MAX_RETRY_ATTEMPTS = 2;

const normalizeActionType = (value: string | null | undefined): ActionType | null => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "whatsapp") return "whatsapp";
  if (normalized === "task") return "task";
  if (normalized === "reminder") return "reminder";
  return null;
};

const normalizePriority = (value: string | null | undefined): "hot" | "warm" | "cold" => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (normalized === "hot" || normalized === "high" || normalized === "p1") return "hot";
  if (normalized === "warm" || normalized === "medium" || normalized === "p2") return "warm";
  return "cold";
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const getAttempts = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
};

const withRetries = async <T>(fn: () => Promise<T>, retries = MAX_RETRY_ATTEMPTS): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

async function insertActivityLog(params: {
  queueId: string;
  leadId: string;
  status: QueueStatus;
  actionType: string;
  message: string;
  attempts: number;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = createServiceClient();
  const payload = {
    queue_id: params.queueId,
    lead_id: params.leadId,
    action_type: params.actionType,
    status: params.status,
    message: params.message,
    attempts: params.attempts,
    metadata: params.metadata ?? null,
    created_at: new Date().toISOString(),
  };
  const candidates = [
    payload,
    {
      lead_id: params.leadId,
      action_type: params.actionType,
      status: params.status,
      message: params.message,
      attempts: params.attempts,
      metadata: params.metadata ?? null,
    },
    {
      lead_id: params.leadId,
      notes: JSON.stringify(payload),
      type: "journey_execution",
    },
  ];
  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_activity_log").insert(candidate);
    if (!error) return;
  }
}

async function fetchPendingQueue(limit: number): Promise<JourneyQueueRow[]> {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();
  const selectVariants = [
    "id,lead_id,journey_step_id,status,scheduled_at,attempts,metadata",
    "id,lead_id,step_id,status,scheduled_at,attempts,metadata",
  ];
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase
      .from("crm_journey_queue")
      .select(selectClause)
      .eq("status", "pending")
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(limit);
    if (!error) {
      return ((data as Array<Record<string, unknown>>) || []).map((row) => ({
        id: String(row.id || ""),
        lead_id: String(row.lead_id || ""),
        journey_step_id: typeof row.journey_step_id === "string" ? row.journey_step_id : null,
        step_id: typeof row.step_id === "string" ? row.step_id : null,
        status: typeof row.status === "string" ? row.status : null,
        scheduled_at: typeof row.scheduled_at === "string" ? row.scheduled_at : null,
        attempts: getAttempts(row.attempts),
        metadata: toRecord(row.metadata),
      }));
    }
    const message = error.message || "";
    if (!/column .* does not exist/i.test(message)) {
      throw new Error(message || "Failed to fetch journey queue.");
    }
  }
  return [];
}

async function fetchJourneyStep(stepId: string): Promise<JourneyStepRow | null> {
  const supabase = createServiceClient();
  const selectVariants = [
    "id,action_type,title,message,payload",
    "id,action_type,name,description,metadata",
  ];
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase.from("crm_journey_steps").select(selectClause).eq("id", stepId).maybeSingle();
    if (!error) {
      const row = (data as Record<string, unknown> | null) || null;
      if (!row?.id) return null;
      return {
        id: String(row.id),
        action_type: typeof row.action_type === "string" ? row.action_type : "",
        title: typeof row.title === "string" ? row.title : typeof row.name === "string" ? row.name : null,
        message: typeof row.message === "string" ? row.message : typeof row.description === "string" ? row.description : null,
        payload: toRecord(row.payload) || toRecord(row.metadata),
      };
    }
    const message = error.message || "";
    if (!/column .* does not exist/i.test(message)) {
      throw new Error(message || "Failed to load journey step.");
    }
  }
  return null;
}

async function claimQueueRow(queueId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("crm_journey_queue")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", queueId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  return !error && Boolean(data?.id);
}

async function updateQueueResult(input: {
  queueId: string;
  status: QueueStatus;
  attempts: number;
  errorMessage?: string | null;
}) {
  const supabase = createServiceClient();
  const payloadCandidates = [
    {
      status: input.status,
      attempts: input.attempts,
      error_message: input.errorMessage || null,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      status: input.status,
      attempts: input.attempts,
      last_error: input.errorMessage || null,
      executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      status: input.status,
      attempts: input.attempts,
      updated_at: new Date().toISOString(),
    },
  ];
  for (const payload of payloadCandidates) {
    const { error } = await supabase.from("crm_journey_queue").update(payload).eq("id", input.queueId);
    if (!error) return;
  }
}

async function isLeadCold(leadId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const selectVariants = ["id,priority", "id,lead_priority"];
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase.from("crm_leads").select(selectClause).eq("id", leadId).maybeSingle();
    if (!error) {
      const row = (data as Record<string, unknown> | null) || null;
      const priority =
        typeof row?.priority === "string"
          ? row.priority
          : typeof row?.lead_priority === "string"
            ? row.lead_priority
            : null;
      return normalizePriority(priority) === "cold";
    }
    const message = error.message || "";
    if (!/column .* does not exist/i.test(message)) {
      throw new Error(message || "Failed to read lead priority.");
    }
  }
  return false;
}

async function executeWhatsApp(params: {
  queue: JourneyQueueRow;
  step: JourneyStepRow;
}) {
  const supabase = createServiceClient();
  const payload = params.step.payload || params.queue.metadata || {};
  const content =
    typeof payload.message === "string"
      ? payload.message
      : typeof params.step.message === "string"
        ? params.step.message
        : null;
  const templateName = typeof payload.template_name === "string" ? payload.template_name : null;
  const messageType = templateName ? "template" : "text";

  // Encode template name into content for fallback when template_name column is absent
  const contentWithTemplate = content ?? (templateName ? `template:${templateName}` : null);

  const candidates = [
    // Full schema with template_name
    {
      lead_id: params.queue.lead_id,
      message_type: messageType,
      content,
      template_name: templateName,
      direction: "outbound",
      status: "queued",
    },
    // body variant with template_name
    {
      lead_id: params.queue.lead_id,
      body: content,
      template_name: templateName,
      direction: "outbound",
      status: "queued",
    },
    // Without template_name (crm_whatsapp_messages may not have that column)
    {
      lead_id: params.queue.lead_id,
      message_type: messageType,
      content: contentWithTemplate,
      direction: "outbound",
      status: "queued",
    },
    // body variant without template_name
    {
      lead_id: params.queue.lead_id,
      body: contentWithTemplate,
      direction: "outbound",
      status: "queued",
    },
  ];

  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_whatsapp_messages").insert(candidate);
    if (!error) return;
    // Only try next candidate on column/schema errors; hard-fail otherwise
    if (!/column .* does not exist|schema cache/i.test(error.message || "")) {
      throw new Error(error.message || "Unable to enqueue WhatsApp journey message.");
    }
  }
  throw new Error("Unable to enqueue WhatsApp journey message after all candidates.");
}

async function executeTask(params: { queue: JourneyQueueRow; step: JourneyStepRow }) {
  const supabase = createServiceClient();
  const payload = params.step.payload || params.queue.metadata || {};
  const title =
    typeof payload.title === "string"
      ? payload.title
      : params.step.title || "Journey follow-up task";
  const description =
    typeof payload.description === "string"
      ? payload.description
      : params.step.message || null;
  const dueInMinutes =
    typeof payload.due_in_minutes === "number" && Number.isFinite(payload.due_in_minutes)
      ? payload.due_in_minutes
      : 120;

  const dueDate = new Date(Date.now() + dueInMinutes * 60 * 1000).toISOString();
  const candidates = [
    {
      lead_id: params.queue.lead_id,
      title,
      description,
      status: "pending",
      priority: "high",
      due_date: dueDate,
    },
    {
      lead_id: params.queue.lead_id,
      title,
      notes: description,
      status: "pending",
      priority: "high",
      due_date: dueDate,
    },
  ];
  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_tasks").insert(candidate);
    if (!error) return;
  }
  throw new Error("Unable to create journey task.");
}

async function executeReminder(params: { queue: JourneyQueueRow; step: JourneyStepRow }) {
  const supabase = createServiceClient();
  const payload = params.step.payload || params.queue.metadata || {};
  const title =
    typeof payload.title === "string"
      ? payload.title
      : params.step.title || "Journey reminder";
  const message =
    typeof payload.message === "string"
      ? payload.message
      : params.step.message || "New journey reminder";

  const candidates = [
    {
      lead_id: params.queue.lead_id,
      title,
      message,
      status: "pending",
      channel: "in_app",
    },
    {
      lead_id: params.queue.lead_id,
      title,
      body: message,
      status: "pending",
      notification_type: "reminder",
    },
  ];
  for (const candidate of candidates) {
    const { error } = await supabase.from("crm_outbound_notifications").insert(candidate);
    if (!error) return;
  }
  throw new Error("Unable to create journey reminder.");
}

async function executeByAction(params: { queue: JourneyQueueRow; step: JourneyStepRow }) {
  const actionType = normalizeActionType(params.step.action_type);
  if (!actionType) throw new Error(`Unsupported action type: ${params.step.action_type || "unknown"}`);
  if (actionType === "whatsapp") return executeWhatsApp(params);
  if (actionType === "task") return executeTask(params);
  return executeReminder(params);
}

export async function runJourneyQueueWorker(limit = 100): Promise<{
  scanned: number;
  completed: number;
  failed: number;
  skippedCold: number;
}> {
  const pendingRows = await fetchPendingQueue(Math.max(1, Math.min(500, limit)));
  let completed = 0;
  let failed = 0;
  let skippedCold = 0;

  for (const queue of pendingRows) {
    if (!queue.id || !queue.lead_id) continue;

    const claimed = await claimQueueRow(queue.id);
    if (!claimed) continue;

    const attempts = getAttempts(queue.attempts) + 1;
    try {
      const isCold = await isLeadCold(queue.lead_id);
      if (isCold) {
        await updateQueueResult({
          queueId: queue.id,
          status: "failed",
          attempts,
          errorMessage: "Lead priority is cold; execution skipped.",
        });
        await insertActivityLog({
          queueId: queue.id,
          leadId: queue.lead_id,
          status: "failed",
          actionType: "safeguard",
          message: "Journey step blocked due to cold priority.",
          attempts,
        });
        skippedCold += 1;
        continue;
      }

      const stepId = queue.journey_step_id || queue.step_id;
      if (!stepId) throw new Error("Journey step reference missing on queue row.");
      const step = await fetchJourneyStep(stepId);
      if (!step) throw new Error("Journey step not found.");

      await withRetries(() => executeByAction({ queue, step }), MAX_RETRY_ATTEMPTS);
      await updateQueueResult({ queueId: queue.id, status: "completed", attempts });
      await insertActivityLog({
        queueId: queue.id,
        leadId: queue.lead_id,
        status: "completed",
        actionType: normalizeActionType(step.action_type) || step.action_type || "unknown",
        message: "Journey step executed successfully.",
        attempts,
      });
      completed += 1;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Journey execution failed.";
      await updateQueueResult({
        queueId: queue.id,
        status: "failed",
        attempts,
        errorMessage,
      });
      await insertActivityLog({
        queueId: queue.id,
        leadId: queue.lead_id,
        status: "failed",
        actionType: "execution",
        message: errorMessage,
        attempts,
      });
      failed += 1;
    }
  }

  return {
    scanned: pendingRows.length,
    completed,
    failed,
    skippedCold,
  };
}

export async function getJourneyQueueMonitoring(limit = 200): Promise<{
  summary: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    successRatePct: number;
  };
  rows: Array<Record<string, unknown>>;
}> {
  const supabase = createServiceClient();
  const selectVariants = [
    "id,lead_id,journey_step_id,status,scheduled_at,attempts,error_message,created_at,updated_at",
    "id,lead_id,step_id,status,scheduled_at,attempts,last_error,created_at,updated_at",
  ];
  let rows: Array<Record<string, unknown>> = [];
  let loaded = false;
  for (const selectClause of selectVariants) {
    const { data, error } = await supabase
      .from("crm_journey_queue")
      .select(selectClause)
      .order("scheduled_at", { ascending: false })
      .limit(Math.max(1, Math.min(1000, limit)));
    if (!error) {
      rows = (data as Array<Record<string, unknown>>) || [];
      loaded = true;
      break;
    }
    if (!/column .* does not exist/i.test(error.message || "")) {
      throw new Error(error.message || "Failed to load journey queue monitor.");
    }
  }
  if (!loaded) rows = [];

  const counts = {
    total: rows.length,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };
  for (const row of rows) {
    const status = String(row.status || "").toLowerCase() as QueueStatus;
    if (status === "pending") counts.pending += 1;
    else if (status === "processing") counts.processing += 1;
    else if (status === "completed") counts.completed += 1;
    else if (status === "failed") counts.failed += 1;
  }
  const settled = counts.completed + counts.failed;
  const successRatePct = settled > 0 ? Math.round((counts.completed / settled) * 100) : 100;

  return {
    summary: {
      ...counts,
      successRatePct,
    },
    rows,
  };
}

