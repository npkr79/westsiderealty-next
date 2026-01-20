-- Convert bio, specialization, and latest_transactions to jsonb
alter table if exists agents_profile
  alter column bio type jsonb
  using (
    case
      when bio is null then null
      else jsonb_build_object('paragraphs', array_remove(array[bio], null), 'bullets', array[]::text[])
    end
  );

alter table if exists agents_profile
  alter column specialization type jsonb
  using (
    case
      when specialization is null then null
      else jsonb_build_object('paragraphs', array_remove(array[specialization], null), 'bullets', array[]::text[])
    end
  );

alter table if exists agents_profile
  alter column latest_transactions type jsonb
  using (
    case
      when latest_transactions is null then null
      else jsonb_build_object('paragraphs', array_remove(array[latest_transactions], null), 'bullets', array[]::text[])
    end
  );
