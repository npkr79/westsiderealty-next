import { createServiceClient } from '@/lib/supabase/serviceClient';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();

    const { name, phone, source_type, source_channel, status, priority, assigned_to, notes } = body;

    const { data, error } = await supabase
      .from('crm_leads')
      .insert({
        name, phone, source_type, source_channel, status, priority, assigned_to, notes,
        source_id: "c3b72f38-171b-4ce6-a060-f40beed8bdb4",
      })
      .select();

    if (error) {
      console.error('[Website Lead API] error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data && data[0]?.id) {
      await supabase.from('crm_lead_assignments').insert({
        lead_id: data[0].id,
        assigned_to: assigned_to,
        assigned_by: assigned_to,
        reason: 'website form - auto assigned',
      });
    }

    return NextResponse.json({ success: true, id: data[0].id });
  } catch (err) {
    console.error('[Website Lead API] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
