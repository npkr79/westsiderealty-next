-- Meta (Facebook) Lead Ads webhook tables
-- Run this migration to create tables required by /api/meta/webhook

-- Raw webhook payloads and Graph API metadata
CREATE TABLE IF NOT EXISTS crm_meta_raw_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leadgen_id TEXT NOT NULL,
  page_id TEXT,
  form_id TEXT,
  ad_id TEXT,
  adset_id TEXT,
  campaign_id TEXT,
  crm_lead_id UUID REFERENCES crm_leads(id),
  payload JSONB NOT NULL,
  graph_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_meta_raw_leads_leadgen_id ON crm_meta_raw_leads(leadgen_id);
CREATE INDEX IF NOT EXISTS idx_crm_meta_raw_leads_crm_lead_id ON crm_meta_raw_leads(crm_lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_meta_raw_leads_created_at ON crm_meta_raw_leads(created_at);

-- Custom field answers from lead forms
CREATE TABLE IF NOT EXISTS crm_meta_lead_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_lead_id UUID NOT NULL REFERENCES crm_meta_raw_leads(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_meta_lead_answers_raw_lead_id ON crm_meta_lead_answers(raw_lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_meta_lead_answers_field_name ON crm_meta_lead_answers(field_name);
