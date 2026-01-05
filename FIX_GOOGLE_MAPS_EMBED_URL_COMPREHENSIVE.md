# Fix: Comprehensive Google Maps Embed URL Sanitization

## Root Cause
The `google_maps_embed_url` database column contains:
1. Full `<iframe>` HTML markup instead of just URLs
2. Malformed URLs like `https://maps.google.com/8Praneeta...&output=embed` (missing `/maps?q=`)
3. Protocol-relative or missing protocol URLs (`//maps...`, `maps.google.com/...`)

When these raw values are used directly in `<iframe src={...}>`, the browser attempts to load malformed URLs like `/hyderabad/projects/%3Ciframe...%3E`, causing 404 errors.

## Solution
Created a comprehensive sanitization helper `extractGoogleMapsEmbedUrl()` that handles all edge cases:

1. **Extracts URL from iframe HTML**: Uses regex to extract `src` attribute from `<iframe src="...">` markup
2. **Fixes protocol issues**:
   - `//maps...` → `https://maps...`
   - `https:/maps...` → `https://maps...`
   - `maps.google.com/...` → `https://maps.google.com/...`
3. **Fixes malformed pattern**: `https://maps.google.com/8Place...&output=embed` → `https://maps.google.com/maps?q=Place...&output=embed`
4. **Validates domain**: Uses URL constructor to ensure it's a valid Google Maps URL
5. **Returns null for invalid URLs**: Prevents rendering empty/broken map containers

## Files Changed

### 1. `src/lib/utils/extractGoogleMapsEmbedUrl.ts` (NEW)
- Centralized helper function for all Google Maps URL normalization
- Handles all input formats (clean URL, iframe HTML, malformed URLs)
- Returns `null` for invalid URLs

### 2. `src/components/project-details/ProjectLocation.tsx`
- Uses `extractGoogleMapsEmbedUrl()` to sanitize `google_maps_embed_url` and `google_maps_url`
- Only renders map container if sanitized URL is valid
- Returns `null` (no map container) if URL is invalid

### 3. `src/components/common/GoogleMapEmbed.tsx`
- **Priority 1**: Uses `extractGoogleMapsEmbedUrl()` for URL prop (handles embed URLs)
- **Priority 4**: Also uses sanitizer for non-embed URLs that need conversion
- Invalid URLs skip to next priority (coordinates/address) or return `null`
- Component now returns `null` instead of empty container when no valid data

## Usage Pattern

All map rendering now follows this pattern:

```typescript
const embedUrl = extractGoogleMapsEmbedUrl(dbEmbedUrl ?? dbMapsUrl);
if (!embedUrl) {
  return null; // Don't render map container
}
return <iframe src={embedUrl} ... />;
```

## Locations Updated

1. ✅ **ProjectLocation** - Project detail pages (`/hyderabad/projects/[slug]`)
2. ✅ **GoogleMapEmbed** - Used by:
   - Property detail pages (`PropertyDetailsClient`)
   - Landing pages (`LandingPageComponent`)
   - Goa property pages (`LocationAdvantages`)

## Verification

After deployment, verify:
1. ✅ No requests to `/hyderabad/projects/%3Ciframe...` in Network tab
2. ✅ Invalid URLs result in no map container (not empty/broken container)
3. ✅ Valid embed URLs still render maps correctly
4. ✅ Malformed URLs like `maps.google.com/8Place...` are fixed and render

## Commit
```
9987d65 Fix: Comprehensive Google Maps embed URL sanitization sitewide
```
