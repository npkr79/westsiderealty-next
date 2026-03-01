const CRM_LEADS_ALLOWED_COLUMNS = new Set([
  "id",
  "name",
  "phone",
  "email",
  "source_id",
  "budget_min",
  "budget_max",
  "location_preference",
  "property_type",
  "buyer_type",
  "timeline",
  "wealth_bracket",
  "investment_style",
  "risk_appetite",
  "notes",
  "stage_id",
  "assigned_to",
  "attribution_metadata",
  "utm_source",
  "utm_campaign",
  "utm_medium",
  "utm_content",
  "utm_term",
  "gclid",
  "fb_lead_id",
  "landing_page",
]);

export type LeadPayload = Record<string, unknown>;

export function sanitizeLeadPayload(payload: LeadPayload): LeadPayload {
  const sanitized: LeadPayload = {};
  const removed: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      removed.push(key);
      continue;
    }
    if (!CRM_LEADS_ALLOWED_COLUMNS.has(key)) {
      removed.push(key);
      continue;
    }
    sanitized[key] = value;
  }

  if (process.env.NODE_ENV !== "production" && removed.length > 0) {
    console.warn("[sanitizeLeadPayload] Dropped unsupported/empty crm_leads fields:", removed);
  }

  return sanitized;
}

