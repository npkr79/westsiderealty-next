import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const occasion_id = searchParams.get('occasion_id');
  const image_status = searchParams.get('image_status');

  if (!occasion_id) {
    return NextResponse.json({ error: 'occasion_id required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  let query = supabase
    .from('occasion_captions')
    .select('*')
    .eq('occasion_id', occasion_id)
    .order('created_at', { ascending: true });

  if (image_status) {
    query = query.eq('image_status', image_status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[occasions/captions GET] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ captions: data ?? [] });
}
