import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPat } from '@/lib/pat';
import type { Note, Version } from '@/types';

interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  language: string;
  folder_id: string | null;
  tags: string[];
  pinned: boolean;
  created_at: number;
  updated_at: number;
  versions: Version[];
}

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title || 'Untitled',
    content: row.content || '',
    language: row.language || 'plaintext',
    folderId: row.folder_id,
    tags: Array.isArray(row.tags) ? row.tags : [],
    pinned: Boolean(row.pinned),
    createdAt: Number(row.created_at) || Date.now(),
    updatedAt: Number(row.updated_at) || Date.now(),
    versions: Array.isArray(row.versions) ? row.versions : [],
  };
}

async function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function authenticate(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });

  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const result = await verifyPat(client, token);
  if (!result) return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 });

  return { userId: result.userId };
}

// GET /api/mcp/notes/[id] — get a single note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { data, error } = await client
    .from('notehub_notes')
    .select('*')
    .eq('user_id', auth.userId)
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

  return NextResponse.json({ note: toNote(data as NoteRow) });
}

// PUT /api/mcp/notes/[id] — update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { data: existing, error: fetchErr } = await client
    .from('notehub_notes')
    .select('*')
    .eq('user_id', auth.userId)
    .eq('id', params.id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

  const note = existing as NoteRow;
  const updates: Record<string, unknown> = { updated_at: Date.now() };

  if (typeof body.content === 'string') {
    updates.content = body.content;
    const firstLine = body.content.split('\n')[0]?.trim() || '';
    if (firstLine) updates.title = firstLine.slice(0, 60);
    const versions = Array.isArray(note.versions) ? note.versions : [];
    if (versions.length === 0 || versions[versions.length - 1].content !== body.content) {
      updates.versions = [...versions.slice(-9), { content: body.content, timestamp: Date.now() }];
    }
  }
  if (typeof body.title === 'string') updates.title = body.title;
  if (typeof body.language === 'string') updates.language = body.language;
  if (typeof body.folderId === 'string' || body.folderId === null) updates.folder_id = body.folderId;
  if (Array.isArray(body.tags)) updates.tags = body.tags.filter((t: unknown) => typeof t === 'string');
  if (typeof body.pinned === 'boolean') updates.pinned = body.pinned;

  const { data: updated, error: updateErr } = await client
    .from('notehub_notes')
    .update(updates)
    .eq('user_id', auth.userId)
    .eq('id', params.id)
    .select('*')
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ note: toNote(updated as NoteRow) });
}

// DELETE /api/mcp/notes/[id] — delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { error } = await client
    .from('notehub_notes')
    .delete()
    .eq('user_id', auth.userId)
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
