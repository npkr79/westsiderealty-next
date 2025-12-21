# Aerocidade Studio Apartments Landing Page

## Overview
Custom landing page template for Aerocidade Studio Apartments in Dabolim, Goa. This page uses a tropical beach/coastal theme with teal/turquoise accents.

## URL
`/landing/aerocidade-studio-apartments-dabolim`

## Components Created

### 1. AerocidadeHero (`src/components/landing/goa/AerocidadeHero.tsx`)
- Full-screen hero section with background image
- Tropical gradient overlay
- Floating price badge
- RERA badge
- CTA buttons (Get Details, WhatsApp)
- Scroll indicator

### 2. InvestmentHighlights (`src/components/landing/goa/InvestmentHighlights.tsx`)
- Grid of 6 investment highlight cards
- Icon-based design with teal accents
- Displays USPs from database highlights

### 3. PricePaymentTable (`src/components/landing/goa/PricePaymentTable.tsx`)
- Two-column layout: Pricing & Payment Plan
- Unit pricing details (size, rate, total price)
- Rental income badge
- 50-25-25 payment plan breakdown

### 4. LocationAdvantages (`src/components/landing/goa/LocationAdvantages.tsx`)
- Google Maps embed with satellite view
- Nearby places cards with icons and distances
- Location summary card

### 5. AmenitiesGrid (`src/components/landing/goa/AmenitiesGrid.tsx`)
- 5-column grid of amenity cards
- Icon-based design
- Responsive layout

### 6. AerocidadeFAQ (`src/components/landing/goa/AerocidadeFAQ.tsx`)
- Accordion-style FAQ section
- Uses shadcn/ui Accordion component
- Displays FAQs from database

### 7. GoaLeadForm (`src/components/landing/goa/GoaLeadForm.tsx`)
- Lead capture form (name, phone, email, message)
- Submits to `all_leads` table with `lead_type: "goa_property"`
- WhatsApp CTA card
- Success state with checkmark

## Integration

The landing page is automatically rendered when:
- URI matches: `aerocidade-studio-apartments-dabolim`
- Status is: `published`

The `LandingPageComponent` checks the URI and renders the custom Aerocidade template instead of the default template.

## Design Theme

- **Colors**: Teal (#0d9488), Cyan, Ocean Blue
- **Accents**: Warm sand tones, white backgrounds
- **Typography**: Bold headlines, readable body text
- **Icons**: Lucide React icons
- **Layout**: Mobile-first responsive design

## Data Flow

1. Server Component (`page.tsx`) fetches data from Supabase
2. Data passed as props to `LandingPageComponent`
3. Component checks URI and renders `AerocidadeTemplate`
4. All sections use data from database:
   - Highlights from `landing_page_highlights`
   - Configurations from `landing_page_configurations`
   - Location points from `landing_page_location_points`
   - Amenities from `landing_page_amenities`
   - FAQs from `landing_page_faqs`

## SEO

- Schema.org markup handled in `page.tsx` (server component)
- RealEstateListing schema
- FAQPage schema
- BreadcrumbList schema
- Organization schema

## Lead Capture

- Form submits to `all_leads` table
- `lead_type`: `"goa_property"`
- `source_page_url`: `/landing/aerocidade-studio-apartments-dabolim`
- WhatsApp integration with pre-filled message

## Files Modified

1. `src/app/landing/[slug]/LandingPageComponent.tsx`
   - Added Aerocidade template check
   - Imported all custom components
   - Conditional rendering based on URI

2. Created 7 new components in `src/components/landing/goa/`

## Testing

1. Ensure database entry exists with:
   - `uri`: `aerocidade-studio-apartments-dabolim`
   - `status`: `published`

2. Visit: `http://localhost:3000/landing/aerocidade-studio-apartments-dabolim`

3. Verify all sections render correctly:
   - Hero with image
   - Investment highlights (6 cards)
   - Price & payment plan
   - Location map and nearby places
   - Amenities grid
   - FAQ accordion
   - Lead form

4. Test lead form submission
5. Test WhatsApp CTA button

## Notes

- All components are client components ("use client")
- Uses Next.js Image component for optimized images
- Lazy loading for images
- Mobile-responsive design
- Accessible form inputs and buttons

