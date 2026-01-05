# Debug: praneeta-santorini-villas 404 Issue

## Issue
URL `https://www.westsiderealty.in/hyderabad/projects/praneeta-santorini-villas` returns 404.

## Code Analysis

The `getCityLevelProjectBySlug` function tries 3 approaches:
1. Query with `is_published = true`
2. Query with status filters (published, under construction, page_status)
3. Query without any filters (fallback)

If all 3 fail, it returns `null`, causing the page to call `notFound()` → 404.

## Required Database Check

**Run these SQL queries to diagnose:**

```sql
-- 1. Check if project exists with this exact slug
SELECT id, project_name, url_slug, city_id, is_published, status, page_status
FROM projects
WHERE url_slug = 'praneeta-santorini-villas';

-- 2. Check if it belongs to Hyderabad
SELECT p.id, p.project_name, p.url_slug, c.url_slug as city_slug, c.city_name
FROM projects p
JOIN cities c ON p.city_id = c.id
WHERE p.url_slug = 'praneeta-santorini-villas';

-- 3. Check for similar project names (maybe slug is different)
SELECT id, project_name, url_slug, city_id
FROM projects
WHERE project_name ILIKE '%praneeta%santorini%'
OR url_slug ILIKE '%praneeta%santorini%';

-- 4. Check all projects with "santorini" in name or slug
SELECT id, project_name, url_slug, city_id
FROM projects
WHERE project_name ILIKE '%santorini%'
OR url_slug ILIKE '%santorini%';
```

## Possible Issues

1. **Project doesn't exist** - The slug `praneeta-santorini-villas` doesn't exist in database
2. **Wrong city_id** - Project exists but belongs to different city
3. **Slug mismatch** - Actual database slug is different (e.g., `praneeta-santorini-villas-mokila`)
4. **Project deleted/not created** - Project was never added to database

## Code Changes Applied

✅ Added warning log in `projectService.ts` to help debug when projects are found without status filters
✅ Code already tries multiple query patterns (with and without filters)

## Next Steps

1. Run the SQL queries above
2. If project exists but slug is different → Update the slug in database OR update links to use correct slug
3. If project doesn't exist → Create the project in database
4. If project exists but wrong city → Update city_id in database
