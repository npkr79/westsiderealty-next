import { NextRequest, NextResponse } from 'next/server';
import { getCrmSessionResult } from '@/lib/crm/auth';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const supabase = createServiceClient();

  // Single occasion fetch
  if (id) {
    const { data, error } = await supabase
      .from('occasions_calendar')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ occasion: data });
  }

  let query = supabase
    .from('occasions_calendar')
    .select('*')
    .order('occasion_date', { ascending: true });

  if (month && year) {
    const paddedMonth = String(month).padStart(2, '0');
    const start = `${year}-${paddedMonth}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const end = `${year}-${paddedMonth}-${lastDay}`;
    query = query.gte('occasion_date', start).lte('occasion_date', end);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[occasions GET] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ occasions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('occasions_calendar')
    .insert(body)
    .select()
    .single();

  if (error) {
    console.error('[occasions POST] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ occasion: data });
}

export async function PATCH(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id: string; stage: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, stage } = body;
  if (!id || !stage) {
    return NextResponse.json({ error: 'id and stage required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('occasions_calendar')
    .update({ stage })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[occasions PATCH] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ occasion: data });
}
