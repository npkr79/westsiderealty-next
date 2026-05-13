import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCrmSessionResult } from '@/lib/crm/auth';

// POST /api/admin/revalidate
// Body: { path: string }
// Immediately busts the ISR cache for a specific page path.

export async function POST(request: NextRequest) {
  const session = await getCrmSessionResult();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { path: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { path } = body;
  if (!path) {
    return NextResponse.json({ error: 'path required' }, { status: 400 });
  }

  revalidatePath(path);
  return NextResponse.json({ success: true, revalidated: path });
}
