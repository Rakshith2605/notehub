import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const AUTH_DOMAIN = 'notehub.dev';
const MIN_USERNAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 6;
const MAX_USERNAME_LENGTH = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || username.length < MIN_USERNAME_LENGTH) {
      return NextResponse.json({ error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` }, { status: 400 });
    }
    if (username.length > MAX_USERNAME_LENGTH) {
      return NextResponse.json({ error: `Username must be at most ${MAX_USERNAME_LENGTH} characters` }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, hyphens, and underscores' }, { status: 400 });
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = `${username}@${AUTH_DOMAIN}`;

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: { id: data.user?.id, username },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
