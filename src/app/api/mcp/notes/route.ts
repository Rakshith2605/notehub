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

// GET /api/mcp/notes — list all notes, optional ?query= search
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const query = request.nextUrl.searchParams.get('query') || '';
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 50, 100);

  let dbQuery = client
    .from('notehub_notes')
    .select('*')
    .eq('user_id', auth.userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
  }

  const { data, error } = await dbQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notes = (data || []).map((row) => toNote(row as NoteRow));
  return NextResponse.json({ notes, total: notes.length });
}

// POST /api/mcp/notes — create a new note
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content : '';
  const title = typeof body.title === 'string' ? body.title : '';
  const language = typeof body.language === 'string' ? body.language : 'plaintext';
  const folderId = typeof body.folderId === 'string' ? body.folderId : null;
  const tags = Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === 'string') : [];

  const now = Date.now();
  const versions: Version[] = content ? [{ content, timestamp: now }] : [];
  const id = body.id || crypto.randomUUID();

  const firstLine = content.split('\n')[0]?.trim() || '';
  const noteTitle = title || firstLine.slice(0, 60) || 'Untitled';

  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { data, error } = await client
    .from('notehub_notes')
    .insert({
      id,
      user_id: auth.userId,
      title: noteTitle,
      content,
      language,
      folder_id: folderId,
      tags,
      pinned: false,
      created_at: now,
      updated_at: now,
      versions,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: toNote(data as NoteRow) }, { status: 201 });
}
