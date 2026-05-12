import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generatePat } from '@/lib/pat';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
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
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 50) : '';

    if (!name) {
      return NextResponse.json({ error: 'Please provide a name for this token' }, { status: 400 });
    }

    const { token: patToken, hash, prefix } = generatePat();
    const now = Date.now();

    const { error } = await adminClient
      .from('notehub_pats')
      .insert({
        id: nanoid(),
        user_id: userId,
        name,
        token_hash: hash,
        prefix,
        created_at: now,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      id: nanoid(),
      name,
      prefix,
      token: patToken,
      createdAt: now,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
