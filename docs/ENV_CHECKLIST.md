# Environment Variables Checklist for Projects Scraper

## Required Environment Variables

### Server-Side (API Routes)
These go in `.env.local` and **Vercel Environment Variables**:

```env
# Firecrawl API Key (from firecrawl.dev)
FIRECRAWL_API_KEY=fc-your_api_key_here

# Google Sheets Service Account Credentials (single-line JSON)
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# Google Sheet ID (from the sheet URL)
GOOGLE_SHEET_ID=1b1Ej9oh01hd5fQ3QejksdI_icziqFK4v

# API Secret (generate with: openssl rand -hex 32)
SCRAPE_API_SECRET=your_random_secret_string_here

# Supabase Service Role Key (from Supabase Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Client-Side (Admin UI)
These must be prefixed with `NEXT_PUBLIC_` and go in `.env.local` and **Vercel Environment Variables**:

```env
# Must match SCRAPE_API_SECRET above
NEXT_PUBLIC_SCRAPE_API_SECRET=your_random_secret_string_here

# Must match GOOGLE_SHEET_ID above
NEXT_PUBLIC_GOOGLE_SHEET_ID=1b1Ej9oh01hd5fQ3QejksdI_icziqFK4v
```

## Important Notes

1. **NEXT_PUBLIC_ prefix**: Client-side variables MUST start with `NEXT_PUBLIC_` to be accessible in the browser
2. **Restart Dev Server**: After adding/changing `.env.local`, you MUST restart `npm run dev`
3. **Single-Line JSON**: `GOOGLE_SHEETS_CREDENTIALS` must be a single line (no line breaks)
4. **Matching Secrets**: `SCRAPE_API_SECRET` and `NEXT_PUBLIC_SCRAPE_API_SECRET` must be the SAME value
5. **Matching Sheet IDs**: `GOOGLE_SHEET_ID` and `NEXT_PUBLIC_GOOGLE_SHEET_ID` must be the SAME value

## Verification Steps

1. **Check .env.local exists**: File should be in project root (same level as package.json)
2. **Check format**: No quotes around values (except JSON strings)
3. **Restart server**: Stop and restart `npm run dev` after changes
4. **Check browser console**: Look for any environment variable errors
5. **Test button**: The "Run Scraper" button should be enabled if `NEXT_PUBLIC_SCRAPE_API_SECRET` is set

## Common Issues

### Button is Disabled
- Check that `NEXT_PUBLIC_SCRAPE_API_SECRET` is in `.env.local`
- Restart the dev server
- Check browser console for errors

### 401 Unauthorized Error
- Ensure `SCRAPE_API_SECRET` and `NEXT_PUBLIC_SCRAPE_API_SECRET` match exactly
- Check for extra spaces or quotes in the values

### Google Sheets Errors
- Verify `GOOGLE_SHEETS_CREDENTIALS` is valid JSON (single line)
- Ensure service account email has access to the sheet
- Check that Google Sheets API is enabled in Google Cloud Console

### Firecrawl Errors
- Verify API key is correct
- Check Firecrawl account has credits
- Review API rate limits

## Example .env.local File

```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://imqlfztriragzypplbqa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Scraper Configuration
FIRECRAWL_API_KEY=fc-your_key_here
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
GOOGLE_SHEET_ID=1b1Ej9oh01hd5fQ3QejksdI_icziqFK4v
SCRAPE_API_SECRET=abc123def456ghi789
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Client-side (must match server-side)
NEXT_PUBLIC_SCRAPE_API_SECRET=abc123def456ghi789
NEXT_PUBLIC_GOOGLE_SHEET_ID=1b1Ej9oh01hd5fQ3QejksdI_icziqFK4v
```

