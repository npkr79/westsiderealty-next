-- Establish relation between hyderabad_properties and projects
alter table if exists hyderabad_properties
  add column if not exists project_id uuid;

create index if not exists hyderabad_properties_project_id_idx
  on hyderabad_properties(project_id);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_name = 'projects'
  ) then
    update hyderabad_properties hp
    set project_id = p.id
    from projects p
    where hp.project_id is null
      and hp.project_name is not null
      and p.project_name is not null
      and lower(hp.project_name) = lower(p.project_name);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hyderabad_properties_project_id_fkey'
  ) then
    alter table hyderabad_properties
      add constraint hyderabad_properties_project_id_fkey
      foreign key (project_id)
      references projects(id)
      on delete set null;
  end if;
end $$;
