# Fix: Removed page_status Filter from Project Detail Pages

## Issue
Project detail pages were filtering by `page_status='published'`, which excluded projects with `page_status='draft'`.

## Root Cause
Query 2 in `getCityLevelProjectBySlug` had:
```typescript
.or('status.ilike.published,status.ilike.%under construction%,page_status.eq.published')
```

This required `page_status='published'`, so projects with `page_status='draft'` (like `praneeta-santorini-villas`) were excluded.

## Fix Applied
Removed `page_status.eq.published` from Query 2. Now Query 2 only checks:
- `status ILIKE 'published'` OR
- `status ILIKE '%under construction%'`

**Rationale**: Detail pages (single project view) should show projects regardless of `page_status`:
- If someone has the direct URL, they should be able to view it
- `page_status='draft'` might mean "don't show in listings" but direct URLs should still work
- Better to show the project than return 404

## Query Flow Now

1. **Query 1**: `.eq('is_published', true)` + city filter
2. **Query 2**: Status filters (NO page_status) + city filter
3. **Query 3**: No filters + city filter
4. **Query 4**: No filters + NO city filter (for NULL city_id)

## Expected Results

- **praneeta-santorini-villas**: Should now be found by Query 2 or Query 3 (no longer filtered out by page_status)
- **ndr-vipasa**: Should be found by Query 4 (NULL city_id handling)

## Note
Listing pages (like `/hyderabad/projects`) still filter by `is_published=true` which is correct - we only want published projects in listings. But detail pages should be more lenient.
