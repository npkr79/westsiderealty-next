import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';

function isLastSaturdayOfMonth(date: Date): boolean {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Find last Saturday of this month
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
  const lastSaturday = new Date(lastDayOfMonth);
  // Saturday = 6
  lastSaturday.setUTCDate(lastDayOfMonth.getUTCDate() - ((lastDayOfMonth.getUTCDay() + 1) % 7));

  return day === lastSaturday.getUTCDate();
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Current date in IST
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);

  if (!isLastSaturdayOfMonth(nowIST)) {
    return NextResponse.json({ skipped: 'not last saturday' });
  }

  // Next month
  const nextMonth = nowIST.getUTCMonth() + 2; // +1 for 0-index, +1 for next month
  const nextYear = nextMonth > 12 ? nowIST.getUTCFullYear() + 1 : nowIST.getUTCFullYear();
  const nextMonthNormalized = nextMonth > 12 ? 1 : nextMonth;
  const paddedMonth = String(nextMonthNormalized).padStart(2, '0');
  const start = `${nextYear}-${paddedMonth}-01`;
  const lastDay = new Date(nextYear, nextMonthNormalized, 0).getDate();
  const end = `${nextYear}-${paddedMonth}-${lastDay}`;

  const supabase = createServiceClient();
  const { data: occasions, error } = await supabase
    .from('occasions_calendar')
    .select('id, occasion_name')
    .gte('occasion_date', start)
    .lte('occasion_date', end)
    .eq('auto_generate', true)
    .eq('stage', 'pending');

  if (error) {
    console.error('[cron/generate-occasion-posts] fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!occasions?.length) {
    return NextResponse.json({ success: true, processed: 0, message: 'No pending auto-generate occasions found' });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.westsiderealty.in';
  let processed = 0;

  for (const occasion of occasions) {
    try {
      const res = await fetch(`${siteUrl}/api/occasions/generate-captions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cronSecret ?? ''}`,
        },
        body: JSON.stringify({ occasion_id: occasion.id }),
      });
      if (res.ok) {
        processed++;
      } else {
        console.error(`[cron/generate-occasion-posts] failed for ${occasion.occasion_name}:`, await res.text());
      }
    } catch (e) {
      console.error(`[cron/generate-occasion-posts] error for ${occasion.occasion_name}:`, e);
    }
  }

  return NextResponse.json({ success: true, processed });
}
