# Broken Links Audit Report

## Critical Issues Found

### 1. **ProjectsGrid.tsx - Using project_name instead of url_slug**
**File:** `src/app/hyderabad/landowner-investor-share-flats/components/ProjectsGrid.tsx:143`

**Problem:** URLs are generated from `project_name` instead of `url_slug`
```typescript
<Link href={`/hyderabad/projects/${project.project_name.toLowerCase().replace(/\s+/g, "-")}`}>
```

**Impact:** This will create broken links if the project name doesn't exactly match the database `url_slug`. For example:
- Project name: "SSI Som Boulevard Mokila Hyderabad" 
- Generated URL: `/hyderabad/projects/ssi-som-boulevard-mokila-hyderabad`
- But database `url_slug` might be: `ssi-som-boulevard-mokila` (without "hyderabad")

**Fix Required:** Use `project.url_slug` instead of generating from `project_name`

---

### 2. **Hardcoded Project Links**
**File:** `src/components/micro-market/NeopolisEditorialContent.tsx`

**Problem:** Hardcoded links to specific projects that may not exist or have different slugs:
- `/hyderabad/projects/my-home-99`
- `/hyderabad/projects/rajapushpa-skyra`
- `/hyderabad/projects/prestige-clairemont`
- `/hyderabad/projects/brigade-gateway`
- `/hyderabad/projects/msn-one`
- `/hyderabad/projects/neo-by-yula-globus`

**Impact:** If these projects don't exist or have different `url_slug` values, links will be broken.

**Fix Required:** Verify these projects exist in the database and use dynamic links or remove if projects don't exist.

---

### 3. **Hardcoded Developer Links**
**File:** `src/app/landing/[slug]/LandingPageComponent.tsx:699`

**Problem:** Hardcoded link to developer:
- `/hyderabad/developers/godrej-properties`

**Impact:** If the developer slug is different in the database, link will be broken.

**Fix Required:** Verify developer slug or use dynamic lookup.

---

### 4. **Missing null checks in DeveloperProjectCard**
**File:** `src/components/developer/DeveloperProjectCard.tsx:18`

**Problem:** Uses `project.url_slug` without checking if it exists first
```typescript
const projectHref = `/${defaultCitySlug}/projects/${project.url_slug}`;
```

**Impact:** If `url_slug` is null/undefined, link will be broken (e.g., `/hyderabad/projects/undefined`).

**Fix Required:** Add null check like in `ProjectCard.tsx` (which already handles this correctly).

---

### 5. **Potential Issues in HomeTest Components**
**Files:** 
- `src/app/home-test/components/FeaturedProjects.tsx:64-65`
- `src/app/home-test/components/TrendingProjects.tsx:67-68`

**Problem:** These components conditionally use micro-market slugs in URLs:
```typescript
? `/${citySlug}/${microMarketSlug}/projects/${project.url_slug}`
: `/${citySlug}/projects/${project.url_slug}`
```

**Impact:** The route `/[citySlug]/[microMarketSlug]/projects/[projectSlug]` redirects to `/[citySlug]/projects/[projectSlug]`, so links with micro-market slug will work but are unnecessary. However, if the micro-market slug is incorrect, the redirect might fail.

**Fix Required:** Always use canonical format: `/${citySlug}/projects/${project.url_slug}` (as the redirect route does).

---

### 6. **TabbedSearch - Potential Missing url_slug**
**File:** `src/components/home/TabbedSearch.tsx:193-195`

**Problem:** Uses `p.url_slug` without null check in some paths
```typescript
? `/${citySlug}/${microMarketSlug}/projects/${p.url_slug}`
: `/${citySlug}/projects/${p.url_slug}`
```

**Impact:** If `url_slug` is missing, broken links will be generated.

**Fix Required:** Add null check before generating links.

---

## Summary of Required Fixes

### High Priority (Will Definitely Cause 404s)
1. ✅ **ProjectsGrid.tsx** - Replace `project_name` with `project.url_slug`
2. ✅ **DeveloperProjectCard.tsx** - Add null check for `url_slug`
3. ✅ **TabbedSearch.tsx** - Add null check for `url_slug` in autocomplete

### Medium Priority (May Cause 404s)
4. ⚠️ **NeopolisEditorialContent.tsx** - Verify hardcoded project slugs exist
5. ⚠️ **LandingPageComponent.tsx** - Verify hardcoded developer slug exists
6. ⚠️ **FeaturedProjects.tsx & TrendingProjects.tsx** - Use canonical URL format (remove micro-market slug)

### Recommended Improvements
- Add TypeScript types to ensure `url_slug` is always present
- Create a utility function for generating project URLs to ensure consistency
- Add runtime validation to log warnings when `url_slug` is missing

---

## Testing Recommendations

1. Check database for projects with missing/null `url_slug` values
2. Verify all hardcoded project slugs in `NeopolisEditorialContent.tsx` exist
3. Verify developer slug in `LandingPageComponent.tsx` exists
4. Test URL generation for projects with special characters in names
5. Check for projects where `project_name.toLowerCase().replace(/\s+/g, "-")` doesn't match `url_slug`
