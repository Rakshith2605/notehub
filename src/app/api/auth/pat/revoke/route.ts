import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: sessionData, error: sessionErr } = await adminClient.auth.getUser(token);
    if (sessionErr || !sessionData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    const userId = sessionData.user.id;

    const body = await request.json().catch(() => null);
    const patId = typeof body?.id === 'string' ? body.id : '';

    if (!patId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('notehub_pats')
      .delete()
      .eq('id', patId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
