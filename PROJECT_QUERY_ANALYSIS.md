# Project Query Analysis - Root Cause Found

## Issues Identified

### Issue 1: Query 2 filters out `page_status='draft'`
**Line 311**: The query requires ONE of:
- `status ILIKE 'published'`
- `status ILIKE '%under construction%'`  
- `page_status = 'published'`

**Problem**: Projects with `page_status='draft'` fail this filter, even if they have the correct `city_id`.

**Example**: `praneeta-santorini-villas` has `page_status='draft'`, so it fails Query 1 and Query 2, but Query 3 should catch it.

### Issue 2: NULL city_id excludes projects
**Line 301**: `.eq('city_id', cityData.id)` always filters by city_id.

**Problem**: Projects with `city_id=NULL` (like `ndr-vipasa`) fail ALL queries with city filter.

**Fix Applied**: Added logic to try without city filter if project exists but has NULL city_id.

## Query Flow

1. **Query 1**: `.eq('is_published', true)` + city filter
   - Fails if `is_published = false` or `city_id` doesn't match

2. **Query 2**: Status filters + city filter
   - Requires: `status='published'` OR `status='under construction'` OR `page_status='published'`
   - **FAILS for `page_status='draft'`**

3. **Query 3**: No status filters + city filter  
   - Should catch everything, BUT fails if `city_id` is NULL

4. **Query 4 (NEW)**: No status filters + NO city filter
   - Only runs if project exists but `city_id` is NULL
   - Catches projects like `ndr-vipasa`

## Logging Added

Each query now logs:
- Which query attempt
- Whether data was found
- Any errors
- Project details (name, status, page_status, city_id) for Query 3

## Next Steps

1. **Deploy and test** - The logging will show exactly what's happening
2. **Check logs** when accessing:
   - `/hyderabad/projects/praneeta-santorini-villas`
   - `/hyderabad/projects/ndr-vipasa`
3. **Based on logs**, either:
   - Update database (set `page_status='published'` for praneeta)
   - Set `city_id` for ndr-vipasa
   - Or confirm the queries are now working

## Expected Behavior

- **praneeta-santorini-villas**: Should be found by Query 3 (has city_id, Query 3 has no status filters)
- **ndr-vipasa**: Should be found by Query 4 (NULL city_id, tries without city filter)
