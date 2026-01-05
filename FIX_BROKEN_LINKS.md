# Broken Links Fix Plan

## Critical Issues to Fix

### 1. ProjectsGrid.tsx - Generate URL from project_name (CRITICAL)
**File:** `src/app/hyderabad/landowner-investor-share-flats/components/ProjectsGrid.tsx:143`

**Current Code:**
```typescript
<Link href={`/hyderabad/projects/${project.project_name.toLowerCase().replace(/\s+/g, "-")}`}>
```

**Problem:** This generates URLs from `project_name` instead of using `url_slug` from database. This will cause 404s if the generated slug doesn't match the database `url_slug`.

**Fix:** Check if this component is still used. If not, delete it. If used, fix to use `project.url_slug`.

**Note:** The page currently uses `LandownerProjectsGrid` which correctly uses `url_slug`, so this file might be unused.

---

### 2. DeveloperProjectCard - Missing null check for url_slug
**File:** `src/components/developer/DeveloperProjectCard.tsx:18`

**Current Code:**
```typescript
const projectHref = `/${defaultCitySlug}/projects/${project.url_slug}`;
```

**Problem:** No null check for `url_slug`. If it's null/undefined, link becomes `/hyderabad/projects/undefined`.

**Fix:** Add null check like in `ProjectCard.tsx`:
```typescript
if (!project.url_slug) {
  return null; // or render non-clickable card
}
const projectHref = `/${defaultCitySlug}/projects/${project.url_slug}`;
```

---

### 3. TabbedSearch - Missing null check in autocomplete
**File:** `src/components/home/TabbedSearch.tsx:193-195`

**Current Code:**
```typescript
? `/${citySlug}/${microMarketSlug}/projects/${p.url_slug}`
: `/${citySlug}/projects/${p.url_slug}`
```

**Problem:** No null check for `p.url_slug`.

**Fix:** Add conditional check before generating link, or filter out projects without `url_slug`.

---

### 4. FeaturedProjects & TrendingProjects - Use canonical URL format
**Files:** 
- `src/app/home-test/components/FeaturedProjects.tsx:64-65`
- `src/app/home-test/components/TrendingProjects.tsx:67-68`

**Current Code:**
```typescript
? `/${citySlug}/${microMarketSlug}/projects/${project.url_slug}`
: `/${citySlug}/projects/${project.url_slug}`
```

**Problem:** Uses micro-market slug in URL, but the route `/[citySlug]/[microMarketSlug]/projects/[projectSlug]` redirects to canonical format. This is unnecessary and could cause issues if micro-market slug is wrong.

**Fix:** Always use canonical format: `/${citySlug}/projects/${project.url_slug}`

---

## Hardcoded Links to Verify

### 5. NeopolisEditorialContent - Hardcoded project links
**File:** `src/components/micro-market/NeopolisEditorialContent.tsx`

**Projects to verify exist in database:**
- `my-home-99`
- `rajapushpa-skyra`
- `prestige-clairemont`
- `brigade-gateway`
- `msn-one`
- `neo-by-yula-globus`

**Action:** Verify these `url_slug` values exist in database, or make links dynamic.

---

### 6. LandingPageComponent - Hardcoded developer link
**File:** `src/app/landing/[slug]/LandingPageComponent.tsx:699`

**Link:** `/hyderabad/developers/godrej-properties`

**Action:** Verify developer slug exists or make dynamic.

---

## Summary

**Immediate Fixes Needed:**
1. Fix/remove `ProjectsGrid.tsx` if unused, or fix to use `url_slug`
2. Add null check in `DeveloperProjectCard.tsx`
3. Add null check in `TabbedSearch.tsx` autocomplete
4. Use canonical URL format in `FeaturedProjects.tsx` and `TrendingProjects.tsx`

**Verification Needed:**
5. Verify hardcoded project slugs in `NeopolisEditorialContent.tsx`
6. Verify hardcoded developer slug in `LandingPageComponent.tsx`
