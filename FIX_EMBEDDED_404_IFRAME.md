# Fix: Remove Embedded 404 Iframe from Project Detail Pages

## Issue
Project detail pages (e.g., `/hyderabad/projects/trendset-allure`) were showing a second embedded website container in the middle of the page displaying:
- Mobile REMAX header
- "404 Oops! Page not found" message
- "Return to Home" link

This appeared as if the site was loading itself again inside the page.

## Root Cause
**Case B: Supabase HTML (dangerouslySetInnerHTML) containing an iframe**

The HTML content stored in database fields (`long_description_html`, `developer_profile_seo`, `investment_analysis_json.description`, `growth_story`, `hero_hook`) was being rendered using `dangerouslySetInnerHTML` without sanitization. Some of this HTML content contained `<iframe>` tags pointing to routes on the site's own domain (e.g., `https://www.westsiderealty.in/hyderabad/projects/...`), which would load the page in an iframe. When the iframe URL didn't exist or returned a 404, it would display the site's own 404 page within the iframe container.

## Solution
Created a shared HTML sanitization utility (`src/lib/utils/htmlSanitizer.ts`) that removes:
- `<iframe>` tags and their content
- `<script>` tags and their content
- `<embed>` and `<object>` tags
- Event handlers (onclick, onload, etc.)

Applied this sanitization to all components using `dangerouslySetInnerHTML`:
1. **ProjectOverviewSection** - sanitizes `long_description_html` / `project_overview_seo`
2. **AboutDeveloperSection** - sanitizes `developer_profile_seo` / `meta_description`
3. **ProjectInvestmentAnalysis** - sanitizes `investmentData.description`
4. **AboutMicroMarketSection** - updated to use shared sanitizer for `growthStory` and `heroHook`

## Files Changed
- `src/lib/utils/htmlSanitizer.ts` (new) - Shared sanitization utility
- `src/components/project-details/ProjectOverviewSection.tsx` - Added sanitization
- `src/components/project-details/AboutDeveloperSection.tsx` - Added sanitization
- `src/components/project-details/ProjectInvestmentAnalysis.tsx` - Added sanitization
- `src/components/project-details/AboutMicroMarketSection.tsx` - Updated to use shared sanitizer

## Verification Checklist
- [x] The embedded "mobile REMAX header + 404" container is removed
- [x] No new console errors
- [x] Project pages still render intended sections (hero, details, location, etc.)
- [x] HTML formatting and links in descriptions still work (only iframes/scripts removed)
- [x] Build passes without errors
- [ ] Test at least 2 project slugs after deployment (trendset-allure and one other)

## Testing
After deployment, verify:
1. `/hyderabad/projects/trendset-allure` no longer shows embedded 404
2. Other project pages render correctly
3. HTML content (descriptions, developer profiles) still displays properly
4. No iframes appear on project pages (except legitimate Google Maps embeds in ProjectLocation component)

## Notes
- Google Maps iframes in `ProjectLocation` component are intentionally allowed (they use `google_maps_embed_url` which should only contain Google Maps URLs)
- The sanitizer uses case-insensitive regex with the `s` flag for multiline matching to catch all iframe variations
- This fix prevents XSS attacks and embedded content injection while preserving legitimate HTML formatting
