CREATE TABLE IF NOT EXISTS crm_call_briefs (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id        uuid        NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  ai_summary     text        NOT NULL,
  phone_intelligence jsonb   NOT NULL DEFAULT '{"found": false}'::jsonb,
  raw_data       jsonb,
  generated_by   uuid        REFERENCES crm_users(id),
  generated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX crm_call_briefs_lead_id_idx     ON crm_call_briefs(lead_id);
CREATE INDEX crm_call_briefs_generated_at_idx ON crm_call_briefs(generated_at DESC);
