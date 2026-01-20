-- Add latest transactions to agent profiles
alter table if exists agents_profile
  add column if not exists latest_transactions text;
