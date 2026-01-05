# Fix for Project 404 - City ID Mismatch Issue

## Problem
Project `praneeta-santorini-villas` exists in database (ID: ffca0a0a-39fe-4433-b5db-36dafde293d1) but URL returns 404.

## Root Cause
The project likely has a `city_id` that doesn't match Hyderabad's city ID. The query filters by `city_id`, so even though the project exists, it's not found when querying for Hyderabad projects.

## Solution Applied
Added debug logging to identify the issue. The logs will now show:
- If the project exists
- What `city_id` the project has
- What `city_id` was requested (Hyderabad)
- If they match

## Immediate Fix Required

**Check the project's city_id in the database:**

```sql
-- Get the project's current city_id
SELECT p.id, p.project_name, p.url_slug, p.city_id, c.url_slug as city_slug, c.city_name
FROM projects p
LEFT JOIN cities c ON p.city_id = c.id
WHERE p.id = 'ffca0a0a-39fe-4433-b5db-36dafde293d1';

-- Get Hyderabad's city_id
SELECT id, city_name, url_slug
FROM cities
WHERE url_slug = 'hyderabad';

-- If they don't match, update the project's city_id:
-- UPDATE projects SET city_id = (SELECT id FROM cities WHERE url_slug = 'hyderabad') WHERE id = 'ffca0a0a-39fe-4433-b5db-36dafde293d1';
```

## Code Changes
- Added debug logging to check if project exists and compare city_ids
- This will help identify the exact issue when the URL is accessed
