-- SQL Script to Fix Sumachura -> Sumadhura Spelling
-- Run this in Supabase SQL Editor to update the database

-- 1. Update project name in projects table
UPDATE projects
SET 
  project_name = REPLACE(project_name, 'Sumachura', 'Sumadhura'),
  project_name = REPLACE(project_name, 'sumachura', 'sumadhura'),
  project_name = REPLACE(project_name, 'SUMACHURA', 'SUMADHURA')
WHERE 
  project_name ILIKE '%sumachura%' 
  OR url_slug = 'sumachura-the-olympus';

-- 2. Update URL slug
UPDATE projects
SET url_slug = 'sumadhura-the-olympus'
WHERE url_slug = 'sumachura-the-olympus';

-- 3. Update SEO title if it contains the misspelling
UPDATE projects
SET seo_title = REPLACE(seo_title, 'Sumachura', 'Sumadhura')
WHERE seo_title ILIKE '%sumachura%';

-- 4. Update meta description if it contains the misspelling
UPDATE projects
SET meta_description = REPLACE(meta_description, 'Sumachura', 'Sumadhura')
WHERE meta_description ILIKE '%sumachura%';

-- 5. Update project_overview_seo if it contains the misspelling
UPDATE projects
SET project_overview_seo = REPLACE(project_overview_seo, 'Sumachura', 'Sumadhura')
WHERE project_overview_seo ILIKE '%sumachura%';

-- 6. Update long_description_html if it contains the misspelling
UPDATE projects
SET long_description_html = REPLACE(long_description_html, 'Sumachura', 'Sumadhura')
WHERE long_description_html ILIKE '%sumachura%';

-- 7. Update any JSON fields that might contain the misspelling
-- Note: This updates the JSONB fields - adjust based on your schema
UPDATE projects
SET 
  project_snapshot_json = jsonb_set(
    project_snapshot_json::jsonb,
    '{project_name}',
    to_jsonb(REPLACE(project_snapshot_json->>'project_name', 'Sumachura', 'Sumadhura'))
  )::text
WHERE 
  project_snapshot_json::text ILIKE '%sumachura%';

-- 8. Update FAQs JSON if it contains the misspelling
UPDATE projects
SET faqs_json = (
  SELECT json_agg(
    CASE 
      WHEN value::text ILIKE '%sumachura%' THEN
        jsonb_set(
          value::jsonb,
          '{question}',
          to_jsonb(REPLACE(value->>'question', 'Sumachura', 'Sumadhura'))
        )::jsonb
      WHEN value::text ILIKE '%sumachura%' THEN
        jsonb_set(
          value::jsonb,
          '{answer}',
          to_jsonb(REPLACE(value->>'answer', 'Sumachura', 'Sumadhura'))
        )::jsonb
      ELSE value::jsonb
    END
  )
  FROM json_array_elements(faqs_json::json)
)
WHERE faqs_json::text ILIKE '%sumachura%';

-- 9. Verify the changes
SELECT 
  id,
  project_name,
  url_slug,
  seo_title,
  meta_description
FROM projects
WHERE 
  project_name ILIKE '%sumadhura%'
  OR url_slug = 'sumadhura-the-olympus';

