import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    const { data, error } = await adminClient
      .from('notehub_pats')
      .select('id, name, prefix, created_at, last_used_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const pats = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
    }));

    return NextResponse.json({ pats });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
