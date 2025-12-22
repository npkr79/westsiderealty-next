# Sitemap Generation & Google Search Console Integration

This document explains how the sitemap generation and Google Search Console (GSC) submission system works.

## Overview

The system automatically:
1. **Generates sitemap.xml** dynamically from your database (cities, projects, landing pages, blogs, developers)
2. **Submits sitemap to Google Search Console** automatically
3. **Runs daily at 2 AM** via Vercel Cron
4. **Allows manual regeneration** via admin panel or API

## Features

### ✅ Automatic Sitemap Generation
- Next.js automatically generates `/sitemap.xml` from `src/app/sitemap.ts`
- Includes all published content:
  - Homepage and static pages
  - Cities (`/[citySlug]`)
  - Projects (`/[citySlug]/[microMarketSlug]/projects/[projectSlug]`)
  - Landing Pages (`/landing/[slug]`)
  - Blog Articles (`/blog/[slug]`)
  - Developers (`/developers/[slug]`)

### ✅ Google Search Console Submission
- Automatically submits sitemap to Google via ping method
- Can be extended with full GSC API integration

### ✅ Scheduled Automation
- Daily cron job at 2 AM (configured in `vercel.json`)
- Runs automatically on Vercel deployments

### ✅ Manual Triggers
- Admin panel button (`/admin` → "Regenerate Sitemap" tab)
- API endpoint: `POST /api/sitemap/regenerate`
- CLI script: `npm run submit-sitemap`

## Setup Instructions

### 1. Environment Variables (Optional)

For enhanced GSC integration, add these to your `.env.local`:

```bash
# Google Search Console (Optional - for full API integration)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GOOGLE_SITE_URL=https://www.westsiderealty.in

# API Authentication (Optional - for securing API endpoints)
SITEMAP_API_KEY=your-secure-api-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://www.westsiderealty.in
```

**Note:** The current implementation works without these variables using the ping method. Full GSC API integration requires the service account setup.

### 2. Vercel Cron Configuration

The `vercel.json` file is already configured with:

```json
{
  "crons": [
    {
      "path": "/api/sitemap/regenerate",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This runs daily at 2 AM UTC. Vercel will automatically set this up when you deploy.

### 3. Google Search Console Setup (Recommended)

1. **Verify your site** in Google Search Console: https://search.google.com/search-console
2. **Add sitemap manually** (one-time):
   - Go to Sitemaps section
   - Submit: `https://www.westsiderealty.in/sitemap.xml`
3. **The system will automatically ping Google** when sitemap is regenerated

### 4. Full GSC API Integration (Advanced - Optional)

For full API integration with service account:

1. **Create Service Account**:
   - Go to Google Cloud Console
   - Create a new project or use existing
   - Enable "Google Search Console API"
   - Create Service Account
   - Download JSON key

2. **Add Service Account to GSC**:
   - Go to Google Search Console
   - Settings → Users and permissions
   - Add service account email as "Owner"

3. **Set Environment Variables**:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

4. **Install Google APIs Package** (if implementing full API):
   ```bash
   npm install googleapis
   ```

## Usage

### Manual Regeneration via Admin Panel

1. Go to `/admin`
2. Click "Regenerate Sitemap" tab
3. Click "Regenerate & Submit Now" button
4. Wait for success confirmation

### Manual Regeneration via API

```bash
# Using curl
curl -X POST https://www.westsiderealty.in/api/sitemap/regenerate

# With API key (if configured)
curl -X POST https://www.westsiderealty.in/api/sitemap/regenerate \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Manual Regeneration via CLI

```bash
npm run submit-sitemap
```

### Submit Only (Without Regeneration)

```bash
curl -X POST https://www.westsiderealty.in/api/sitemap/submit
```

## API Endpoints

### `POST /api/sitemap/regenerate`
Regenerates sitemap and submits to GSC.

**Response:**
```json
{
  "success": true,
  "message": "Sitemap regenerated and submitted to Google Search Console",
  "sitemapUrl": "https://www.westsiderealty.in/sitemap.xml",
  "gscSubmission": {
    "success": true,
    "message": "Sitemap successfully submitted to Google: ..."
  },
  "timestamp": "2025-01-21T10:00:00.000Z"
}
```

### `POST /api/sitemap/submit`
Submits existing sitemap to GSC (doesn't regenerate).

**Response:**
```json
{
  "success": true,
  "message": "Sitemap successfully submitted to Google: ...",
  "sitemapUrl": "https://www.westsiderealty.in/sitemap.xml",
  "timestamp": "2025-01-21T10:00:00.000Z"
}
```

### `GET /api/sitemap/regenerate` or `/api/sitemap/submit`
Returns endpoint information (for testing).

## How It Works

### Sitemap Generation (`src/app/sitemap.ts`)

1. Fetches all published content from Supabase:
   - Cities, Projects, Landing Pages, Blogs, Developers
2. Builds URL array with metadata:
   - `url`: Full URL
   - `lastModified`: Last update date
   - `changeFrequency`: How often content changes
   - `priority`: SEO priority (0.0 to 1.0)
3. Returns sitemap in Next.js MetadataRoute format
4. Next.js automatically serves at `/sitemap.xml`

### GSC Submission (`src/services/googleSearchConsoleService.ts`)

1. Uses Google's sitemap ping method:
   ```
   https://www.google.com/ping?sitemap={sitemapUrl}
   ```
2. Can be extended with full GSC API for:
   - Direct sitemap submission
   - URL indexing requests
   - Submission status tracking

### Automation (`vercel.json`)

- Vercel Cron calls `/api/sitemap/regenerate` daily at 2 AM UTC
- Works automatically on Vercel deployments
- No additional setup required

## Troubleshooting

### Sitemap Not Updating

1. **Check sitemap directly**: Visit `https://www.westsiderealty.in/sitemap.xml`
2. **Check database**: Ensure content has `status = 'published'` or `is_published = true`
3. **Clear Next.js cache**: Rebuild the application

### GSC Submission Failing

1. **Check logs**: Look for errors in Vercel function logs
2. **Verify sitemap URL**: Ensure it's accessible publicly
3. **Check GSC manually**: Submit sitemap manually in Google Search Console
4. **Ping method works**: Even if API fails, ping method should work

### Cron Job Not Running

1. **Check Vercel deployment**: Ensure `vercel.json` is deployed
2. **Check Vercel dashboard**: Look for cron job execution logs
3. **Verify schedule**: Cron schedule is `0 2 * * *` (2 AM UTC daily)

## Monitoring

### Check Sitemap Status

1. **View sitemap**: `https://www.westsiderealty.in/sitemap.xml`
2. **Google Search Console**: Check sitemap status in GSC dashboard
3. **API response**: Check API endpoint responses for success/errors

### Check Cron Execution

1. **Vercel Dashboard**: Functions → Cron Jobs
2. **Logs**: Check function execution logs
3. **Manual trigger**: Use admin panel to test immediately

## Best Practices

1. **Regular Monitoring**: Check GSC dashboard weekly for sitemap status
2. **Content Updates**: Sitemap auto-updates when content is published
3. **Manual Triggers**: Use admin panel after bulk content updates
4. **Error Handling**: System gracefully handles errors and continues operation

## Future Enhancements

- [ ] Full GSC API integration with service account
- [ ] URL indexing requests for new content
- [ ] Sitemap index for large sites (multiple sitemaps)
- [ ] Submission status tracking and reporting
- [ ] Email notifications on submission failures

## Support

For issues or questions:
1. Check Vercel function logs
2. Verify environment variables
3. Test sitemap URL directly
4. Check Google Search Console for errors

