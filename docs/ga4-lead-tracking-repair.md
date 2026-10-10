# GA4_LEAD_TRACKING_REPAIR_REPORT

Audit date: 2026-10-10. Base: `511730c352730d498eab9602b1adf65e26566a88` (freshly fetched origin/main). Work is isolated from the primary checkout's unrelated uncommitted changes.

## Read-only audit findings (before repair)

- One Google tag is initialized in `src/app/layout.tsx` through Next's `GoogleAnalytics` component with `AW-16563417230`. No GTM container, second initialization, or explicit GA4 config exists in source. The working tag already sends GA4 traffic through its configured destination: live network inspection observed `G-GYG41B6D00` page views and HTTP 204 collection responses. The missing GA4 config in source is therefore **not** the root cause and was not changed.
- Live home → Contact client navigation produced exactly one page_view per page, allowing for Google's batching delay. Enhanced measurement is enabled. No manual page-view emitter was added.
- GA4 Admin property 518299210, stream 13239650564, confirms `G-GYG41B6D00`, URL `https://www.westsiderealty.in`, active traffic. Its key-event list contains only `close_convert_lead`, `purchase`, and `qualify_lead`; `generate_lead` is absent. The stream has no custom event creation rules.
- Verified code defect: no standardized `generate_lead` exists. Most forms have no Google success event. Godrej Neopolis, commercial hub/sale/managed office, and corporate leasing have bespoke events targeted to GA4. Listings `lead_submitted` is a plain dataLayer object plus session buffer, not a gtag event. `behaviorTracking` goes to the site's behavior API, not GA4. `analyticsService` is internal property analytics.
- Mumbai `commercial_inquiry_submit` fires before CRM confirmation and is unguarded; a throwing gtag could prevent the save. This is repaired by moving the existing event into a guarded success branch without changing its parameters/destination behavior.
- All active public form saves use `submitLead` directly or via campaign/advisor actions. `kollurLeadService` and `landingPageLeadsApi` contain legacy direct inserts but have no active public submission callers. Admin/import/meta lead writes are not website conversions and are excluded.
- Some legacy project UI handlers ignore `success: false` (AdvisoryProjectPage, ProjectPageRedesign, the first ProjectPageV2 form). Tracking must not trust their success UI. Their existing UI behavior is left unchanged; the new wrapper uses only the confirmed server acknowledgement.
- No consent UI or consent-command implementation was found in source or the inspected live tag queue. Existing Google tag/consent behavior is preserved: no consent override, no alternate server analytics transport, and no new analytics storage. Browser blocking/consent can still prevent collection.

## Repair and guarantees

The server returns a random `analyticsReceipt` only when the existing CRM insert returned an ID. This changes response metadata only. CRM insert payload, validation, routing, ownership, assignment, notifications, and schema remain unchanged. The receipt is not derived from a lead ID and is never sent to Google.

Browser adapters call the existing server actions with the original arguments, inspect the successful response, then call the single shared tracker. It suppresses repeat receipts in the current page lifetime. Distinct saved CRM rows get distinct receipts and events; this does not change existing submission/retry behavior or deduplicate CRM rows. React rerenders and SPA navigation do not replay events. Events are queued immediately through gtag (or its standard arguments queue before initialization), outside component lifecycle effects. Failed saves, missing insert acknowledgements, and rejected actions produce no event. Analytics exceptions cannot change the save response.

Advisor chat returns receipts for successful tool-created contacts, including when subsequent response generation fails. Campaign and advisor capture adapters retain their original action behavior. Existing Godrej and commercial interaction/success events are preserved. No events are synthesized from CTA clicks, form starts, or thank-you rendering.

Client analytics remains best effort: closing the document before the CRM response arrives, consent denial, blockers, offline transport, or Google ingestion failure can prevent receipt. There is no claim of exactly-once network delivery or retrospective recovery of missed leads.

## Event contract

`generate_lead`, explicitly routed via `send_to: G-GYG41B6D00`.

- Always: `lead_category` (commercial/residential/general), `lead_type` (investment/office_sale/office_lease/project_enquiry/general_enquiry), `page_type`, `form_id`, `source_page`.
- When known: `project_slug`, `city`, `locality`, `cta_intent`.
- Safe Google context overrides: canonical-origin `page_location` without query/hash, empty `page_referrer`, fixed `page_title`.
- No contact details, messages, CRM IDs, receipts, company names, conversation IDs, brochure tokens, or arbitrary form spreads.
- Commercial classification uses explicit commercial routes, structured commercial segments/types, and exact property-type values, never description text. Hub intent distinguishes office purchase and investment; leasing is explicit. Residential project/Goa enquiry types and dedicated villa/luxury forms are residential unless explicit commercial context applies. Insufficient context stays general. No inventory claims change.

## Form coverage

All 27 direct submitLead calls across 24 client files are adapted (the automated coverage assertion also detects future bypasses). Forms include Contact page/shared ContactForm, buying requirement, seller valuation, inline forms, micro-market, commercial investments, institutional commercial, Mumbai pre-leased, Hyderabad commercial hub/office sale/managed offices, corporate leasing and leasing corridors, Godrej Neopolis, villa/luxury, Goa landing/Aerocidade, brochure, portfolio detail, opportunity, and all four generic project form implementations including both ProjectPageV2 handlers. Also covered: Godrej campaign modal, advisor capture form, and advisor tool contacts.

## Validation

- `node --test scripts/ga4-lead-tracking.test.mjs`: 17 tests passed, with mocked CRM only; no production lead created.
- Production build: passed. Initial worktree symlink issue resolved using a local dependency copy; no build configuration changes.
- New analytics modules: ESLint clean. Edited existing files retain 77 baseline lint diagnostics (including line-shifted React diagnostic text); no new rule/message diagnostics.
- Full `tsc --noEmit --incremental false` with 8 GB heap: 61 diagnostics, identical to clean base after normalizing file locations/line shifts. Legacy errors are intentionally untouched.
- Diff and whitespace reviewed. No changes to tag initialization, Google Ads conversions/campaigns, SEO content, canonicals, sitemap, or public contact information.
- Actual production GA4 receipt of a newly saved lead is **not verified**. Live page-view delivery was verified separately; tests and compilation are not proof of conversion ingestion.

## Manual GA4 Admin steps

1. In property 518299210 → Admin → Events, mark the exact `generate_lead` event as a key event (create its key-event name if it has not yet appeared). Use once-per-event counting so separate successful leads are counted. Do not derive it from `form_submit`, CTA clicks, or existing bespoke success events.
2. Create event-scoped custom dimensions for `lead_category`, `lead_type`, `page_type`, `form_id`, `project_slug`, `city`, `locality`, and `cta_intent` as reporting needs require. `source_page` is also available; consider its cardinality before registering.
3. Verify the next legitimate successful submission in Realtime/DebugView and confirm its category and one generate_lead. An intentional production test submission requires user approval first. Do not import a second Google Ads conversion or alter Ads bidding as part of this repair.
4. Historical missing events are not backfilled by this code change. Preserve existing enhanced page-view measurement.

References: https://developers.google.com/tag-platform/gtagjs/routing ; https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications ; https://support.google.com/analytics/answer/12966437 ; https://support.google.com/analytics/answer/16376749

## Files modified

- `src/app/actions/campaignLeads.ts`
- `src/app/actions/submit-lead.ts`
- `src/app/api/advisor/chat/route.ts`
- `src/app/buying-requirement/page.tsx`
- `src/app/commercial-investments/CommercialEnquiryForm.tsx`
- `src/app/commercial/hyderabad/_components/CommercialPhase1Client.tsx`
- `src/app/commercial/hyderabad/office-space-for-lease/CorporateOfficeLeasingClient.tsx`
- `src/app/commercial/hyderabad/office-space-for-lease/_components/OfficeLeasingCorridorClient.tsx`
- `src/app/commercial/pre-leased-mumbai/components/InquiryForm.tsx`
- `src/app/contact/page.tsx`
- `src/app/hyderabad/projects/godrej-neopolis/GodrejNeopolisClient.tsx`
- `src/app/kokapet-gandipet-luxury-villas/VillaEnquiryForm.tsx`
- `src/app/sell-property/page.tsx`
- `src/components/ContactForm.tsx`
- `src/components/advisor/AdvisorChat.tsx`
- `src/components/brochure/BrochurePageClient.tsx`
- `src/components/common/InlineLeadForm.tsx`
- `src/components/goa-property/AerocidadeHero.tsx`
- `src/components/institutional-investment-commercial/InstitutionalLeadForm.tsx`
- `src/components/landing/LuxuryLeadForm.tsx`
- `src/components/landing/goa/GoaLeadForm.tsx`
- `src/components/marketing/LeadModal.tsx`
- `src/components/micro-market/MicroMarketLeadForm.tsx`
- `src/components/opportunities/OpportunityLeadForm.tsx`
- `src/components/portfolio/PortfolioDetailClient.tsx`
- `src/components/project-details/AdvisoryProjectPage.tsx`
- `src/components/project-details/ProjectLeadForm.tsx`
- `src/components/project-details/ProjectPageRedesign.tsx`
- `src/components/project-details/ProjectPageV2.tsx`
- `src/lib/analytics/leadTracking.ts`
- `src/lib/analytics/submitTrackedLead.ts`
- `scripts/ga4-lead-tracking.test.mjs`
- `docs/ga4-lead-tracking-repair.md`
