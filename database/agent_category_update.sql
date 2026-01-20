-- Update agent_category enum values to new role names
do $$
begin
  if exists (select 1 from pg_type where typname = 'agent_category_new') then
    drop type agent_category_new;
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'agent_category') then
    create type agent_category_new as enum (
      'The Commander',
      'The Strategist',
      'The Advisor',
      'The Partner',
      'The Corporate Executive',
      'The Mandate Director'
    );

    alter table raw_agents
      alter column category type agent_category_new
      using (
        case category::text
          when 'Tier 1: The Neighborhood Specialist' then 'The Commander'
          when 'Tier 2: The Inventory Partner' then 'The Strategist'
          when 'Tier 3: The Portfolio Manager' then 'The Advisor'
          when 'Tier 4: The Corporate Associate' then 'The Corporate Executive'
          when 'Tier 5: The Mandate Director' then 'The Mandate Director'
          else 'The Commander'
        end
      )::agent_category_new;

    drop type agent_category;
    alter type agent_category_new rename to agent_category;
  end if;
end $$;
