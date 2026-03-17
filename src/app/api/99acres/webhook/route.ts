import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';

const SOURCE_ID_99ACRES = '3308dd6c-a656-42c8-947e-a94e2e46c0ab';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits.startsWith('91') ? digits : `91${digits}`;
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'westside-realty-99acres-webhook' });
}

export async function POST(request: NextRequest) {
  // Auth check
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.NINETYNINE_ACRES_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[99acres] Incoming payload:', JSON.stringify(body));

  // Field extraction with fallbacks
  const name =
    String(body.name || body.full_name || body.contact_name || 'Unknown').trim() || 'Unknown';

  const rawPhone = String(body.phone || body.mobile || body.contact_number || '').trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : '';

  const email =
    String(body.email || body.contact_email || '').trim() || null;

  const message =
    String(body.message || body.query || body.requirement || '').trim() || null;

  const budgetRaw =
    String(body.budget || body.budget_range || body.price_range || '').trim();
  const budgetLine = budgetRaw ? `Budget: ${budgetRaw}` : null;

  const propertyName =
    String(body.property_name || body.project_name || body.listing_title || '').trim() || null;

  const locationFallback =
    String(body.location || body.city || body.area || body.preferred_location || '').trim() || null;

  const locationPreference = propertyName || locationFallback;

  const notes = [message, budgetLine].filter(Boolean).join('\n') || null;

  // Insert into crm_leads
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('crm_leads')
    .insert({
      name,
      phone,
      email,
      source_id: SOURCE_ID_99ACRES,
      source_channel: '99acres',
      source_type: 'portal',
      status: 'new',
      notes,
      location_preference: locationPreference,
      attribution_metadata: {
        raw_payload: body,
        lead_source: '99acres',
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error('[99acres] Insert error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const leadId = data.id;
  console.log('[99acres] Lead created:', leadId);
  return NextResponse.json({ success: true, lead_id: leadId });
}
