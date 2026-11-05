-- Verified against the live Goa page and advisor_project_intelligence.
-- The project row is backed up separately before explicit, scoped removal.
BEGIN;
CREATE TABLE IF NOT EXISTS public.project_import_exclusions (
  rera_id text PRIMARY KEY,
  project_id uuid NOT NULL,
  project_slug text NOT NULL,
  city_slug text NOT NULL,
  reason text NOT NULL,
  excluded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_import_exclusions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_import_exclusions FROM anon, authenticated, service_role;
GRANT SELECT ON public.project_import_exclusions TO service_role;
INSERT INTO public.project_import_exclusions (rera_id, project_id, project_slug, city_slug, reason)
VALUES ('PRGO03262676', '48bcf1c3-589f-4a8d-92e3-b46de46252a1', 'indus-amalfi-suites', 'goa', 'Permanent removal requested by site owner')
ON CONFLICT (rera_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.enforce_project_import_exclusion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE candidate jsonb := to_jsonb(NEW);
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.project_import_exclusions e
    WHERE upper(btrim(candidate->>'rera_id')) = e.rera_id
       OR candidate->>'id' = e.project_id::text
       OR candidate->>'project_id' = e.project_id::text
       OR lower(btrim(COALESCE(candidate->>'project_slug', candidate->>'url_slug', candidate->>'slug', candidate->>'seo_slug'))) = e.project_slug
  ) THEN
    RAISE EXCEPTION 'Project is permanently excluded from inventory' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_project_import_exclusion() FROM PUBLIC;
DO $$
DECLARE inventory_table text;
BEGIN
  FOREACH inventory_table IN ARRAY ARRAY['advisor_project_intelligence','advisor_project_configurations','advisor_project_sources','projects','rera_projects','re_projects','goa_holiday_properties','properties'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = format('public.%I', inventory_table)::regclass AND tgname = 'enforce_project_import_exclusion') THEN
      EXECUTE format('CREATE TRIGGER enforce_project_import_exclusion BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_project_import_exclusion()', inventory_table);
    END IF;
  END LOOP;
END;
$$;
COMMIT;
