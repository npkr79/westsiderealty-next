-- Agent system redesign: raw_agents registry + agents_profile table

-- 1) Agent category enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'agent_category') then
    create type agent_category as enum (
      'Tier 1: The Neighborhood Specialist',
      'Tier 2: The Inventory Partner',
      'Tier 3: The Portfolio Manager',
      'Tier 4: The Corporate Associate',
      'Tier 5: The Mandate Director'
    );
  end if;
end $$;

-- 2) Rename agents -> agents_profile and id -> agent_id
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'agents') then
    alter table agents rename to agents_profile;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'agents_profile' and column_name = 'id'
  ) then
    alter table agents_profile rename column id to agent_id;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'agents_profile' and column_name = 'agent_id'
  ) then
    alter table agents_profile drop constraint if exists agents_pkey;
    alter table agents_profile add primary key (agent_id);
  end if;
end $$;

-- 3) Ensure profile table has expected columns (safe if already exists)
alter table if exists agents_profile
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists bio text,
  add column if not exists photo text,
  add column if not exists specialization text,
  add column if not exists experience text,
  add column if not exists social_links jsonb,
  add column if not exists profile_completed boolean default false;

-- 4) Create raw_agents registry table
create table if not exists raw_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null unique,
  category agent_category not null,
  is_active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 5) Backfill raw_agents from agents_profile (legacy data)
insert into raw_agents (id, name, email, phone, category, is_active, created_at)
select
  agent_id,
  coalesce(name, ''),
  coalesce(email, ''),
  coalesce(phone, ''),
  'Tier 1: The Neighborhood Specialist'::agent_category,
  coalesce(active, true),
  coalesce(created_at, now())
from agents_profile
where agent_id is not null
  and not exists (select 1 from raw_agents where raw_agents.id = agents_profile.agent_id);

-- 6) Link profile to registry
alter table if exists agents_profile
  add constraint agents_profile_agent_id_fkey
  foreign key (agent_id) references raw_agents(id) on delete cascade;

-- 7) Auto-create profile rows on raw_agents insert
create or replace function public.handle_raw_agent_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into agents_profile (agent_id, name, email, phone, profile_completed)
  values (new.id, new.name, new.email, new.phone, false)
  on conflict (agent_id) do nothing;
  return new;
end;
$$;

drop trigger if exists raw_agent_profile_trigger on raw_agents;

create trigger raw_agent_profile_trigger
after insert on raw_agents
for each row execute function public.handle_raw_agent_insert();

-- 8) RLS (recommended)
alter table raw_agents enable row level security;
alter table agents_profile enable row level security;

-- raw_agents policies
drop policy if exists raw_agents_admin_insert on raw_agents;
create policy raw_agents_admin_insert
on raw_agents for insert
to authenticated
with check (
  exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role in ('owner', 'dev_admin', 'office_admin', 'admin')
  )
);

drop policy if exists raw_agents_admin_select on raw_agents;
create policy raw_agents_admin_select
on raw_agents for select
to authenticated
using (
  exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role in ('owner', 'dev_admin', 'office_admin', 'admin')
  )
  or auth.uid() = id
);

drop policy if exists raw_agents_admin_update on raw_agents;
create policy raw_agents_admin_update
on raw_agents for update
to authenticated
using (
  exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role in ('owner', 'dev_admin', 'office_admin', 'admin')
  )
);

drop policy if exists raw_agents_admin_delete on raw_agents;
create policy raw_agents_admin_delete
on raw_agents for delete
to authenticated
using (
  exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role in ('owner', 'dev_admin', 'office_admin', 'admin')
  )
);

-- agents_profile policies
drop policy if exists agents_profile_self_select on agents_profile;
create policy agents_profile_self_select
on agents_profile for select
to authenticated
using (auth.uid() = agent_id);

drop policy if exists agents_profile_self_update on agents_profile;
create policy agents_profile_self_update
on agents_profile for update
to authenticated
using (auth.uid() = agent_id);
