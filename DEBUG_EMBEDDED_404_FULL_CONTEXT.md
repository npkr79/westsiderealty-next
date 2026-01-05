# Full Context for Embedded 404 Debugging

## 1. Route Files

### src/app/[citySlug]/projects/[projectSlug]/page.tsx
See file contents above (533 lines)

### src/app/[citySlug]/projects/[projectSlug]/layout.tsx
**FILE DOES NOT EXIST**

### src/app/[citySlug]/projects/[projectSlug]/not-found.tsx
**FILE DOES NOT EXIST**

### src/app/[citySlug]/layout.tsx
**FILE DOES NOT EXIST**

### src/app/layout.tsx
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Layout from "@/components/layout/Layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://www.westsiderealty.in";

const DEFAULT_OG_IMAGE =
  "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo-banner-1200x630.jpg";

export const metadata: Metadata = {
  title: "RE/MAX Westside Realty | Premium Real Estate in Hyderabad, Goa & Dubai",
  description:
    "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments. RE/MAX Westside Realty.",
  metadataBase: new URL(BASE_URL),
  
  // Favicon configuration – strictly using /favicon.png from public/favicon.png
  // Path /favicon.png maps to public/favicon.png in Next.js
  icons: {
    icon: {
      url: "/favicon.png",
      type: "image/png",
    },
    shortcut: {
      url: "/favicon.png",
      type: "image/png",
    },
    apple: "/apple-touch-icon.png",
  },
  
  // Web App Manifest
  manifest: '/site.webmanifest',
  
  // Google Site Verification
  verification: {
    google: 'GNYcJkMYT85NyAgCUMb5XnmaLqtOzN-rF4UiPEH3ZiA',
  },
  
  // Additional meta tags
  other: {
    'msapplication-TileColor': '#1a365d',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#1a365d',
  },
  
  openGraph: {
    title: "RE/MAX Westside Realty | Premium Real Estate in Hyderabad, Goa & Dubai",
    description:
      "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments. RE/MAX Westside Realty.",
    url: BASE_URL,
    siteName: "RE/MAX Westside Realty",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "RE/MAX Westside Realty",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "RE/MAX Westside Realty | Premium Real Estate in Hyderabad, Goa & Dubai",
    description:
      "Expert real estate advisory for premium properties in Hyderabad, Goa holiday homes, and Dubai investments. RE/MAX Westside Realty.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <Layout>{children}</Layout>
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-GYG41B6D00" 
          strategy="afterInteractive" 
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GYG41B6D00', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
        <Analytics />
      </body>
    </html>
  );
}
```

### src/app/not-found.tsx
```typescript
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <Link href="/" className="text-blue-500 hover:blue-700 underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
```

## 2. Components Imported by page.tsx

All imports from page.tsx (lines 1-32):
- CityHubBacklink
- BreadcrumbNav
- ProjectHeroGallery
- ProjectOverviewSection
- ProjectPriceTable
- ProjectFloorPlans
- ProjectSpecifications
- ProjectAmenities
- ProjectLocation
- ProjectNearbyPlaces
- AboutDeveloperSection
- AboutMicroMarketSection
- RelatedProjectsSection
- ProjectFAQSection
- ProjectInvestmentAnalysis
- ProjectExpertReview
- ProjectRERATimeline
- TrustStrip
- LocationHighlightsCard
- BottomLeadFormSection
- ProjectDetailClientActions
- DebugClient

**All component files provided above.**

## 3. Search Results: iframe/dangerouslySetInnerHTML/embed

```
src/app/landing/[slug]/LandingPageComponent.tsx:356:              <iframe
src/app/landing/[slug]/LandingPageComponent.tsx:604:                dangerouslySetInnerHTML={{ __html: landingPage.rich_description }}
src/app/contact/page.tsx:126:                    <iframe
src/app/contact/page.tsx:127:                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3574.5406493313703!2d78.3269774748044!3d17.385123602871065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6869ea289d44d3d%3A0x7ee055e9306884d4!2sRE%2FMAX%20Westside%20Realty!5e1!3m2!1sen!2sin!4v1766248713985!5m2!1sen!2sin"
src/app/admin/blog/page.tsx:640:                      <div dangerouslySetInnerHTML={{ __html: formData.content || "<p>No content yet.</p>" }} />
src/app/blog/[slug]/page.tsx:243:            dangerouslySetInnerHTML={{
src/app/[citySlug]/projects/[projectSlug]/ProjectDetailClient.tsx:246:              googleMapsEmbedUrl={(project as any).google_maps_embed_url}
src/app/[citySlug]/projects/[projectSlug]/page.tsx:405:              googleMapsEmbedUrl={(project as any).google_maps_embed_url}
src/app/[citySlug]/[microMarketSlug]/page.tsx:606:                dangerouslySetInnerHTML={{ __html: pageData.hero_hook || "" }}
src/app/[citySlug]/[microMarketSlug]/page.tsx:697:              <div className="authority-content-block" dangerouslySetInnerHTML={{ __html: pageData.mm_authority_content }} />
src/app/[citySlug]/[microMarketSlug]/page.tsx:721:                    dangerouslySetInnerHTML={{ __html: highlightMetrics(pageData.growth_story) }}
src/app/[citySlug]/[microMarketSlug]/page.tsx:730:                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: pageData.connectivity_details }} />
src/app/[citySlug]/[microMarketSlug]/page.tsx:737:                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: pageData.infrastructure_details }} />
src/app/[citySlug]/[microMarketSlug]/page.tsx:744:                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: pageData.it_corridor_influence }} />
src/app/[citySlug]/[microMarketSlug]/page.tsx:872:                  <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: pageData.inventory_description }} />
src/app/[citySlug]/[microMarketSlug]/page.tsx:925:                        <p className="text-muted-foreground mb-6" dangerouslySetInnerHTML={{ __html: developer.bio }} />
src/app/[citySlug]/buy/[listingSlug]/page.tsx:34:  // Select all fields including latitude and longitude for map embedding
src/app/[citySlug]/buy/[listingSlug]/page.tsx:419:        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
src/app/[citySlug]/buy/[listingSlug]/page.tsx:424:          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
src/app/[citySlug]/buy/[listingSlug]/page.tsx:429:        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
src/app/developers/[slug]/page.tsx:336:                  dangerouslySetInnerHTML={{ __html: developer.hero_description }}
src/app/developers/[slug]/page.tsx:410:                      dangerouslySetInnerHTML={{ __html: developer.long_description_seo }}
src/app/developers/[slug]/page.tsx:474:                        dangerouslySetInnerHTML={{ __html: developer.founder_bio_summary }}
src/app/developers/[slug]/page.tsx:705:                        dangerouslySetInnerHTML={{ __html: developer.usp }}
src/components/ui/chart.tsx:79:      dangerouslySetInnerHTML={{
src/components/landing/goa/LocationAdvantages.tsx:54:              <iframe
src/components/landing/goa/LocationAdvantages.tsx:55:                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3596.3977255808963!2d73.85186357481032!3d15.384967185199686!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbfb908ad4ac3ed%3A0x7baa5bb1a0bddb29!2sAerocidade%20Goa!5e1!3m2!1sen!2sin!4v1766374069017!5m2!1sen!2sin"
src/components/city/CityLifestyleHub.tsx:77:                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.description }} />
src/components/city/CityLifestyleHub.tsx:93:            dangerouslySetInnerHTML={{ __html: content.description }}
src/components/city/CityLifestyleHub.tsx:116:                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.description }} />
src/components/city/CityOverviewSection.tsx:79:                dangerouslySetInnerHTML={{ __html: mainContent }}
src/components/city/CityFAQSection.tsx:57:                            dangerouslySetInnerHTML={{ 
src/components/property/PropertyDetailsClient.tsx:191:          {/* For Goa, prioritize google_maps_url if available, as it contains the embed URL */}
src/components/common/GoogleMapEmbed.tsx:38:  // Helper function to create Google Maps embed URL from coordinates with red pin marker
src/components/common/GoogleMapEmbed.tsx:49:    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoomLevel}&output=embed${mapTypeParam}`;
src/components/common/GoogleMapEmbed.tsx:52:  // Helper function to create Google Maps embed URL from address/place name
src/components/common/GoogleMapEmbed.tsx:62:    return `https://maps.google.com/maps?q=${encodedAddress}&z=${zoomLevel}&output=embed${mapTypeParam}`;
src/components/common/GoogleMapEmbed.tsx:73:  // Priority 1: If URL is provided and is an embed URL, use it (highest priority for Goa properties)
src/components/common/GoogleMapEmbed.tsx:74:  // Check if URL is an embed URL first, before using coordinates
src/components/common/GoogleMapEmbed.tsx:75:  if (url && (url.includes('maps/embed') || url.includes('maps?pb=') || url.includes('maps.google.com/maps') || url.includes('google.com/maps/embed'))) {
src/components/common/GoogleMapEmbed.tsx:83:    // Ensure it's a proper embed URL
src/components/common/GoogleMapEmbed.tsx:84:    if (cleanUrl.includes('maps.google.com/maps') && !cleanUrl.includes('/embed') && !cleanUrl.includes('output=embed')) {
src/components/common/GoogleMapEmbed.tsx:85:      cleanUrl = cleanUrl.replace('/maps?', '/maps/embed?').replace('/maps/', '/maps/embed?');
src/components/common/GoogleMapEmbed.tsx:86:      if (!cleanUrl.includes('output=embed')) {
src/components/common/GoogleMapEmbed.tsx:87:          cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'output=embed';
src/components/common/GoogleMapEmbed.tsx:91:    const embedUrl = cleanUrl;
src/components/common/GoogleMapEmbed.tsx:92:    const placeMatch = embedUrl.match(/!1s([^!]+)/);
src/components/common/GoogleMapEmbed.tsx:97:      const coordsMatch = embedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
src/components/common/GoogleMapEmbed.tsx:101:        directionsUrl = embedUrl.replace('/embed', '').replace('output=embed', '').replace('&output=embed', '');
src/components/common/GoogleMapEmbed.tsx:161:        <iframe
src/components/common/GoogleMapEmbed.tsx:162:          src={embedUrl}
src/components/common/GoogleMapEmbed.tsx:178:    const embedUrl = createMapsEmbedFromCoords(lat, lng, zoom, mapType);
src/components/common/GoogleMapEmbed.tsx:237:        <iframe
src/components/common/GoogleMapEmbed.tsx:238:          src={embedUrl}
src/components/common/GoogleMapEmbed.tsx:257:    const embedUrl = createMapsEmbedFromAddress(addressQuery, zoom, mapType);
src/components/common/GoogleMapEmbed.tsx:316:        <iframe
src/components/common/GoogleMapEmbed.tsx:317:          src={embedUrl}
src/components/common/GoogleMapEmbed.tsx:331:  // Priority 4: Use provided URL and convert if needed (fallback for non-embed URLs)
src/components/common/GoogleMapEmbed.tsx:333:    // Check if URL is already a Google Maps embed URL
src/components/common/GoogleMapEmbed.tsx:335:    const isEmbedUrl = url.includes('maps/embed') || url.includes('maps?pb=') || url.includes('maps.google.com/maps') || url.includes('google.com/maps/embed');
src/components/common/GoogleMapEmbed.tsx:337:    let embedUrl: string;
src/components/common/GoogleMapEmbed.tsx:351:      // Ensure it's a proper embed URL
src/components/common/GoogleMapEmbed.tsx:352:      if (cleanUrl.includes('maps.google.com/maps') && !cleanUrl.includes('/embed') && !cleanUrl.includes('output=embed')) {
src/components/common/GoogleMapEmbed.tsx:353:        // Convert to embed format if it's a regular maps URL
src/components/common/GoogleMapEmbed.tsx:354:        cleanUrl = cleanUrl.replace('/maps?', '/maps/embed?').replace('/maps/', '/maps/embed?');
src/components/common/GoogleMapEmbed.tsx:355:        if (!cleanUrl.includes('output=embed')) {
src/components/common/GoogleMapEmbed.tsx:356:          cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'output=embed';
src/components/common/GoogleMapEmbed.tsx:360:      embedUrl = cleanUrl;
src/components/common/GoogleMapEmbed.tsx:363:      const placeMatch = embedUrl.match(/!1s([^!]+)/);
src/components/common/GoogleMapEmbed.tsx:367:        // Try to extract coordinates from embed URL
src/components/common/GoogleMapEmbed.tsx:368:        const coordsMatch = embedUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
src/components/common/GoogleMapEmbed.tsx:372:          directionsUrl = embedUrl.replace('/embed', '').replace('output=embed', '').replace('&output=embed', '');
src/components/common/GoogleMapEmbed.tsx:376:      // Convert regular Google Maps URL to embed
src/components/common/GoogleMapEmbed.tsx:387:      embedUrl = convertedUrl;
src/components/common/GoogleMapEmbed.tsx:447:        <iframe
src/components/common/GoogleMapEmbed.tsx:448:          src={embedUrl}
src/components/common/SEO.tsx:74:          // Prevent React/Next hydration warnings when embedding JSON-LD
src/components/common/SEO.tsx:76:          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
src/components/project-details/AboutDeveloperSection.tsx:49:              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
src/components/project-details/ProjectLocation.tsx:60:            <iframe
src/components/project-details/ProjectOverviewSection.tsx:26:        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
src/components/project-details/AboutMicroMarketSection.tsx:46:              dangerouslySetInnerHTML={{ __html: sanitizedHeroHook }}
src/components/project-details/AboutMicroMarketSection.tsx:53:              dangerouslySetInnerHTML={{ __html: sanitizedGrowthStory }}
src/components/project-details/ProjectInvestmentAnalysis.tsx:51:              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
```

## 4. Search Results: NotFound/not-found/Oops/Page not found

```
src/app/not-found.tsx:3:export default function NotFound() {
src/app/not-found.tsx:8:        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
```

## KEY FINDINGS

1. **All HTML sanitization is in place** - All components using `dangerouslySetInnerHTML` now sanitize HTML:
   - ProjectOverviewSection ✅
   - AboutDeveloperSection ✅  
   - AboutMicroMarketSection ✅
   - ProjectInvestmentAnalysis ✅

2. **Only legitimate iframe** - ProjectLocation.tsx has one iframe for Google Maps (line 60), which is intentional.

3. **No NotFound component rendering** - Only `src/app/not-found.tsx` exists (global 404 page).

4. **No nested layouts** - No layout.tsx files exist for the project route that could cause nesting.

## ROOT CAUSE ANALYSIS

The sanitization code was already added in commit `75084b5`. If the embedded 404 is STILL appearing, it means:

**The database HTML content likely contains an iframe tag that points to your site's own URL**, and while the sanitizer should remove it, there might be:

1. **Edge case in regex** - The iframe might be formatted in a way the regex doesn't catch (e.g., malformed HTML, encoded characters)
2. **Cache issue** - The page might be cached from before the sanitization was deployed
3. **The iframe is in a field we're not sanitizing** - Check if `google_maps_embed_url` in ProjectLocation could be set to your site's URL instead of Google Maps

## RECOMMENDATION

**Check the database directly for `trendset-allure`:**

```sql
SELECT 
  id, 
  project_name, 
  url_slug,
  long_description_html,
  developer_id
FROM projects 
WHERE url_slug = 'trendset-allure';

-- Then check the developer description:
SELECT 
  d.id,
  d.developer_name,
  d.developer_profile_seo,
  d.meta_description
FROM developers d
JOIN projects p ON p.developer_id = d.id
WHERE p.url_slug = 'trendset-allure';

-- Check micro-market content:
SELECT 
  mm.id,
  mm.micro_market_name,
  mm.hero_hook,
  mm.growth_story
FROM micro_markets mm
JOIN projects p ON p.micro_market_id = mm.id
WHERE p.url_slug = 'trendset-allure';
```

**Search for iframe tags in these fields** - Look for any `<iframe>` tags pointing to `westsiderealty.in` URLs.
