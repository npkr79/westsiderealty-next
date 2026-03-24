-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS content_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT,
  target_audience TEXT,
  content_type TEXT NOT NULL DEFAULT 'social_post',
  status TEXT NOT NULL DEFAULT 'ideas',
  ideas JSONB DEFAULT '[]',
  selected_idea TEXT,
  script TEXT,
  ssml TEXT,
  audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES content_projects(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  model TEXT,
  duration_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (service role key bypasses these)
ALTER TABLE content_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_generation_logs ENABLE ROW LEVEL SECURITY;
