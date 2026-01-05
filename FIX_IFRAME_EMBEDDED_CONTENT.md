# Fix: Remove Embedded Content/Iframe from Project Pages

## Issue
Project detail pages were showing a nested window/modal in the middle of the page displaying navigation and footer content, appearing as if the website was being embedded in an iframe.

## Root Cause
The `AboutMicroMarketSection` component uses `dangerouslySetInnerHTML` to render HTML content from the database (`heroHook` and `growthStory` fields). If this HTML content contained iframe tags or other embedded content, it would render on the page, creating the nested window effect.

## Fix Applied
Added HTML sanitization function to `AboutMicroMarketSection.tsx` that:
1. Removes `<iframe>` tags and their content
2. Removes `<script>` tags and their content  
3. Removes `<embed>` and `<object>` tags
4. Removes event handlers (onclick, onload, etc.)

The sanitization function runs before rendering the HTML content, preventing any embedded content from being displayed.

## Files Changed
- `src/components/project-details/AboutMicroMarketSection.tsx` - Added `sanitizeHTML()` function and applied it to `heroHook` and `growthStory` before rendering

## Testing
After deployment, verify that:
1. Project detail pages no longer show nested windows/modals
2. HTML content (growthStory/heroHook) still renders correctly
3. Text formatting and links in HTML content still work
4. No iframes or embedded content appears

## Note
If the issue persists, it might be:
- Coming from other HTML fields (e.g., `long_description_html` in ProjectOverviewSection)
- A browser extension issue
- Or content in other components using `dangerouslySetInnerHTML`

If needed, we can apply the same sanitization to other components that render HTML.
