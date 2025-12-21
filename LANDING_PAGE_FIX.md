# Landing Page Route Fix - Aerocidade

## Issue
The landing page at `/landing/aerocidade-studio-apartments-dabolim` was showing "Page Not Found" even after the page was created in the database.

## Root Cause
The Next.js route was using `generateStaticParams()` which only pre-renders pages that exist at build time. When a new landing page is added to the database after the build, it wasn't available because:
1. The route didn't allow dynamic params (`dynamicParams = true` was missing)
2. No ISR (Incremental Static Regeneration) was configured

## Fixes Applied

### 1. Added Dynamic Params Support
**File**: `src/app/landing/[slug]/page.tsx`

Added:
```typescript
// Allow dynamic routes not in generateStaticParams
export const dynamicParams = true;

// Revalidate pages every 60 seconds (ISR)
export const revalidate = 60;
```

This allows:
- Pages not in `generateStaticParams` to be rendered dynamically
- Automatic revalidation every 60 seconds for ISR
- New pages added to the database to be accessible immediately

### 2. Improved Error Handling
Added better logging and error handling in `fetchLandingPageData()`:
- Logs warnings when page is not found
- Logs warnings when page status is not 'published'
- Catches and logs errors during data fetching

### 3. Enhanced Static Params Generation
Improved `generateStaticParams()` with:
- Try-catch error handling
- Better error logging
- Graceful fallback to empty array on error

## Verification Steps

### Step 1: Run the SQL Script
Execute `sql/aerocidade-landing-page-insert.sql` in Supabase SQL Editor.

### Step 2: Verify Data in Database
Run this query in Supabase to verify the page exists:
```sql
SELECT id, uri, title, status, created_at 
FROM landing_pages 
WHERE uri = 'aerocidade-studio-apartments-dabolim';
```

Expected result:
- `uri`: `aerocidade-studio-apartments-dabolim`
- `status`: `published`
- `title`: `Aerocidade`

### Step 3: Clear Next.js Cache (if needed)
```bash
rm -rf .next
npm run build
# or for dev server:
npm run dev
```

### Step 4: Test the Route
Visit: `http://localhost:3000/landing/aerocidade-studio-apartments-dabolim`

## How It Works Now

1. **Static Generation (Build Time)**
   - `generateStaticParams()` fetches all published landing pages
   - Next.js pre-renders these pages at build time

2. **Dynamic Rendering (Runtime)**
   - `dynamicParams = true` allows pages not in static params
   - If a page isn't pre-rendered, Next.js renders it on-demand
   - The page is then cached for future requests

3. **ISR (Incremental Static Regeneration)**
   - `revalidate = 60` means pages are revalidated every 60 seconds
   - After 60 seconds, the next request triggers a background regeneration
   - Users always see fresh content without waiting

## Troubleshooting

### If page still shows "Not Found":

1. **Check Database**
   ```sql
   SELECT * FROM landing_pages WHERE uri = 'aerocidade-studio-apartments-dabolim';
   ```
   - Verify `uri` matches exactly (case-sensitive)
   - Verify `status = 'published'`

2. **Check Server Logs**
   - Look for `[LandingPage]` log messages
   - Check for any Supabase connection errors

3. **Check RLS Policies**
   - Ensure Supabase RLS allows public read access:
   ```sql
   -- Verify this policy exists
   SELECT * FROM pg_policies 
   WHERE tablename = 'landing_pages' 
   AND policyname LIKE '%public%';
   ```

4. **Clear Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

5. **Check URL Encoding**
   - Ensure the URL uses hyphens, not spaces
   - `/landing/aerocidade-studio-apartments-dabolim` ✅
   - `/landing/aerocidade studio apartments dabolim` ❌

## Files Modified

1. `src/app/landing/[slug]/page.tsx`
   - Added `dynamicParams = true`
   - Added `revalidate = 60`
   - Improved error handling and logging

2. `sql/aerocidade-landing-page-insert.sql`
   - Added verification queries

## Next Steps

1. ✅ Run SQL script to insert Aerocidade data
2. ✅ Restart dev server or rebuild
3. ✅ Test the route: `/landing/aerocidade-studio-apartments-dabolim`
4. ✅ Verify it appears in Featured Projects section

