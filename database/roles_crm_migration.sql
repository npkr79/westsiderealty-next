-- User roles enhancements
alter table if exists user_roles
  add column if not exists phone text,
  add column if not exists email text;

create unique index if not exists user_roles_phone_key on user_roles(phone);

-- Agents phone (if missing)
alter table if exists agents
  add column if not exists phone text;

-- Leads CRM fields
alter table if exists leads
  add column if not exists assigned_to text,
  add column if not exists interest_details text,
  add column if not exists assigned_agent_id uuid,
  add column if not exists lead_source text,
  add column if not exists status text default 'new',
  add column if not exists stage text default 'new',
  add column if not exists priority text default 'medium',
  add column if not exists notes text,
  add column if not exists next_follow_up timestamptz,
  add column if not exists owner_id uuid;

create index if not exists leads_assigned_agent_id_idx on leads(assigned_agent_id);
create index if not exists leads_status_idx on leads(status);
