# Projects Scraper Setup Guide

This guide will help you set up the Projects Scraper feature that scrapes Hyderabad real estate projects from listing portals and writes to Google Sheets.

## Prerequisites

1. **Firecrawl API Key** - Sign up at [firecrawl.dev](https://firecrawl.dev) to get your API key
2. **Google Cloud Project** - For Google Sheets API access
3. **Google Service Account** - For programmatic access to Google Sheets
4. **Supabase Service Role Key** - For duplicate detection against existing projects

## Step 1: Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the details and create
   - Click on the service account, go to "Keys" tab
   - Click "Add Key" > "Create new key" > Choose JSON
   - Download the JSON file (this is your `GOOGLE_SHEETS_CREDENTIALS`)

## Step 2: Create Google Sheet

1. Go to [Google Drive](https://drive.google.com/drive/folders/1b1Ej9oh01hd5fQ3QejksdI_icziqFK4v?usp=drive_link)
2. Create a new Google Sheet or use the existing one
3. Share the sheet with your service account email (found in the JSON credentials file)
   - Give it "Editor" permissions
4. Copy the Sheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - This is your `GOOGLE_SHEET_ID`

## Step 3: Create Sheet Structure

### Sheet 1: "Scraped Projects"

Create headers in row 1:
- A: scrape_id
- B: scraped_at
- C: source_portal
- D: source_url
- E: project_name
- F: developer_name
- G: micro_market
- H: rera_id
- I: possession_date
- J: price_range
- K: bhk_configs
- L: total_units
- M: project_status
- N: amenities_count
- O: duplicate_status
- P: matching_project_id
- Q: review_status
- R: raw_data_json

### Sheet 2: "Scrape Runs"

Create headers in row 1:
- A: run_id
- B: started_at
- C: completed_at
- D: status
- E: portals_scraped
- F: projects_found
- G: new_projects
- H: duplicates
- I: errors

## Step 4: Environment Variables

Add these to your `.env.local` (for local development) and Vercel environment variables:

```env
# Firecrawl API Key
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Google Sheets Credentials (paste the entire JSON as a single line)
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Google Sheet ID (from the URL)
GOOGLE_SHEET_ID=your_google_sheet_id_here

# API Secret for scraper endpoint (generate a random string)
SCRAPE_API_SECRET=your_random_secret_string_here

# Supabase Service Role Key (for duplicate detection)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**Important Notes:**
- `GOOGLE_SHEETS_CREDENTIALS` must be a single-line JSON string (no line breaks)
- `SCRAPE_API_SECRET` should be a strong random string (use `openssl rand -hex 32` to generate)
- For Vercel, add these in Project Settings > Environment Variables

## Step 5: Client-Side Environment Variable

Add this to your `.env.local` and Vercel (must be prefixed with `NEXT_PUBLIC_`):

```env
NEXT_PUBLIC_SCRAPE_API_SECRET=your_random_secret_string_here
NEXT_PUBLIC_GOOGLE_SHEET_ID=your_google_sheet_id_here
```

## Step 6: Install Dependencies

```bash
npm install googleapis
```

## Step 7: Test the Scraper

1. Navigate to `/admin/scraping` in your admin panel
2. Click "Run Scraper"
3. Check the results in the admin UI
4. Verify data in Google Sheets

## Cron Job Setup

The scraper is configured to run daily at 6 AM UTC via Vercel Cron Jobs. This is already configured in `vercel.json`.

To manually trigger:
- Use the admin UI at `/admin/scraping`
- Or call the API directly:
  ```bash
  curl -X POST https://your-domain.com/api/admin/scraper/run \
    -H "x-api-secret: your_secret_here"
  ```

## Troubleshooting

### "Unauthorized" Error
- Check that `SCRAPE_API_SECRET` matches in both server and client env vars
- Ensure the header `x-api-secret` is being sent correctly

### Google Sheets API Errors
- Verify the service account has access to the sheet
- Check that `GOOGLE_SHEETS_CREDENTIALS` is valid JSON (single line)
- Ensure Google Sheets API is enabled in your Google Cloud project

### Firecrawl API Errors
- Verify your `FIRECRAWL_API_KEY` is correct
- Check your Firecrawl account has sufficient credits
- Review Firecrawl API documentation for rate limits

### No Projects Found
- The extraction logic is basic and may need refinement based on actual portal HTML structure
- Check the `raw_data_json` column in Google Sheets to see what was scraped
- You may need to update the extraction functions in `/api/admin/scraper/run/route.ts`

## Next Steps

1. **Refine Extraction Logic**: Update the `extract99AcresProjects`, `extractMagicBricksProjects`, and `extractHousingProjects` functions based on actual HTML structure
2. **Add More Fields**: Enhance extraction to capture more project details (amenities, pricing, etc.)
3. **Improve Duplicate Detection**: Add more sophisticated matching algorithms
4. **Add Review Workflow**: Create an admin interface to review and approve/reject scraped projects

## Support

For issues or questions, check:
- Firecrawl Documentation: https://docs.firecrawl.dev
- Google Sheets API Documentation: https://developers.google.com/sheets/api
- Project GitHub Issues

