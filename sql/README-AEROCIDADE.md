# Aerocidade Landing Page Database Setup

## Summary

This document describes the database setup for the Aerocidade Studio Apartments landing page, which has been migrated from a custom page route to the standard landing page system.

## Changes Made

1. **Deleted Custom Page Route**
   - Removed `/src/app/goa/aerocidade-studio-apartments-dabolim/page.tsx`
   - The page will now be served through the standard landing page system at `/landing/aerocidade-studio-apartments-dabolim`

2. **Created SQL Insert Script**
   - Location: `sql/aerocidade-landing-page-insert.sql`
   - Inserts all required data into landing_pages and related tables

## How to Run the SQL Script

1. **Open Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to SQL Editor

2. **Run the Script**
   - Copy the contents of `sql/aerocidade-landing-page-insert.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Verify the Insert**
   - The script will output a notice with the landing page ID
   - You can run the verification queries at the bottom of the script to confirm all data was inserted

## What Gets Inserted

The script inserts data into the following tables:

- **landing_pages** - Main page data with status = 'published'
- **landing_page_highlights** - 6 investment highlights (USPs)
- **landing_page_configurations** - Unit pricing information
- **landing_page_location_points** - 7 nearby places with distances
- **landing_page_faqs** - 8 frequently asked questions
- **landing_page_specifications** - 4 project specifications
- **landing_page_amenities** - 10 amenities

## URL Structure

- **Old URL**: `/goa/aerocidade-studio-apartments-dabolim` (deleted)
- **New URL**: `/landing/aerocidade-studio-apartments-dabolim` (active after SQL insert)

## Featured Projects Section

Once the SQL script is run with `status = 'published'`, the Aerocidade project will automatically appear in:
- Homepage "Featured New Launches" section
- Navigation menu "New Projects" dropdown
- Mobile navigation menu

The FeaturedProjects component fetches all landing pages with `status = 'published'` and orders them by creation date.

## Notes

- The script uses a PostgreSQL DO block to automatically handle the landing page ID
- All timestamps are set to NOW()
- The status is set to 'published' so it appears in featured sections
- The URI is set to 'aerocidade-studio-apartments-dabolim' which matches the URL slug

## Custom Components

The custom components in `/src/components/goa-property/` are still present but are no longer used by the Aerocidade page. They can be kept for potential future use or deleted if not needed elsewhere.

