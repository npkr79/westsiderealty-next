-- Fix broken WhatsApp trigger on crm_leads
-- Run this in Supabase SQL Editor → https://supabase.com/dashboard/project/imqlfztriragzypplbqa/sql

-- Step 1: Add missing template_name column to crm_whatsapp_messages
ALTER TABLE crm_whatsapp_messages
  ADD COLUMN IF NOT EXISTS template_name TEXT;

-- Step 2: Find and drop broken triggers on crm_leads
-- (triggers that reference template_name or have <UUID> placeholders)
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT t.tgname, p.proname, p.prosrc
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE c.relname = 'crm_leads'
      AND NOT t.tgisinternal
  LOOP
    RAISE NOTICE 'Found trigger: % (function: %)', trig.tgname, trig.proname;

    IF trig.prosrc ILIKE '%template_name%'
       OR trig.prosrc ILIKE '%<UUID>%'
       OR trig.prosrc ILIKE '%whatsapp%' THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON crm_leads', trig.tgname);
      RAISE NOTICE '→ DROPPED broken trigger: %', trig.tgname;
    ELSE
      RAISE NOTICE '→ KEPT trigger: %', trig.tgname;
    END IF;
  END LOOP;
END $$;

-- Step 3: Verify crm_leads insert works (dry run check)
SELECT COUNT(*) FROM crm_leads LIMIT 1;
