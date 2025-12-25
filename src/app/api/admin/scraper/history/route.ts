import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  // Verify API secret
  const apiSecret = req.headers.get('x-api-secret');
  if (apiSecret !== process.env.SCRAPE_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!process.env.GOOGLE_SHEETS_CREDENTIALS || !process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ runs: [] });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Read from Scrape Runs sheet (skip header row)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Scrape Runs!A2:I',
    });

    const rows = response.data.values || [];
    const runs = rows.map((row) => ({
      run_id: row[0] || '',
      started_at: row[1] || '',
      completed_at: row[2] || '',
      status: row[3] || '',
      portals_scraped: row[4] || '',
      projects_found: parseInt(row[5] || '0', 10),
      new_projects: parseInt(row[6] || '0', 10),
      duplicates: parseInt(row[7] || '0', 10),
      errors: parseInt(row[8] || '0', 10),
    })).reverse(); // Most recent first

    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error('Error fetching scrape history:', error);
    return NextResponse.json({ runs: [] });
  }
}

