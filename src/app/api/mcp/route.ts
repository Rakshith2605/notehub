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

async function authenticate(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
  const client = await getAdminClient();
  if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  const result = await verifyPat(client, token);
  if (!result) return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 });
  return { userId: result.userId };
}

const TOOLS = [
  {
    name: 'list_notes',
    description: 'List all notes in your NoteHub workspace. Optionally filter by a search query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query to filter notes by title or content' },
        limit: { type: 'number', description: 'Maximum notes to return (default 50, max 100)' },
      },
    },
  },
  {
    name: 'get_note',
    description: 'Get a specific note by its ID, including full content, language, tags, and version history.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The note ID' } },
      required: ['id'],
    },
  },
  {
    name: 'create_note',
    description: 'Create a new note in your NoteHub workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Note content (code, markdown, JSON, etc.)' },
        title: { type: 'string', description: 'Optional title. Auto-generated from first line if not provided.' },
        language: { type: 'string', description: 'Language/format. Use list_note_types to see options.' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional tag names' },
      },
      required: ['content'],
    },
  },
  {
    name: 'update_note',
    description: 'Update an existing note. Only specify fields you want to change.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The note ID to update' },
        content: { type: 'string', description: 'New content' },
        title: { type: 'string', description: 'New title' },
        language: { type: 'string', description: 'New language/format' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Replace all tags' },
        pinned: { type: 'boolean', description: 'Pin the note' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_note',
    description: 'Delete a note permanently.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The note ID to delete' } },
      required: ['id'],
    },
  },
  {
    name: 'list_note_types',
    description: 'List all supported note types (programming languages and formats).',
    inputSchema: { type: 'object', properties: {} },
  },
];

const LANGUAGES = [
  { id: 'plaintext', label: 'Plain Text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML' },
  { id: 'toml', label: 'TOML' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'latex', label: 'LaTeX' },
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }, { status: 200 });
  }

  const { id, method, params } = body;

  try {
    switch (method) {
      case 'initialize':
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'notehub', version: '1.0.0' },
          },
        });

      case 'notifications/initialized':
        return NextResponse.json({ jsonrpc: '2.0' });

      case 'ping':
        return NextResponse.json({ jsonrpc: '2.0', id, result: {} });

      case 'tools/list':
        return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } });

      case 'tools/call': {
        const auth = await authenticate(req);
        if (auth instanceof NextResponse) {
          return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32001, message: 'Authentication failed' } });
        }

        const client = await getAdminClient();
        if (!client) {
          return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32603, message: 'Server configuration error' } });
        }

        const { name, arguments: args = {} } = params;
        let result;

        switch (name) {
          case 'list_notes': {
            let query = client.from('notehub_notes').select('*').eq('user_id', auth.userId).order('updated_at', { ascending: false });
            if (args.query) query = query.or(`title.ilike.%${args.query}%,content.ilike.%${args.query}%`);
            query = query.limit(Math.min(args.limit || 50, 100));
            const { data, error } = await query;
            if (error) throw new Error(error.message);
            const notes = (data || []).map((r) => toNote(r as NoteRow));
            result = { notes, total: notes.length };
            break;
          }

          case 'get_note': {
            const { data, error } = await client.from('notehub_notes').select('*').eq('user_id', auth.userId).eq('id', args.id).maybeSingle();
            if (error) throw new Error(error.message);
            if (!data) throw new Error('Note not found');
            result = { note: toNote(data as NoteRow) };
            break;
          }

          case 'create_note': {
            const now = Date.now();
            const content = args.content || '';
            const firstLine = content.split('\n')[0]?.trim() || '';
            const noteTitle = args.title || firstLine.slice(0, 60) || 'Untitled';
            const versions = content ? [{ content, timestamp: now }] : [];
            const { data, error } = await client.from('notehub_notes').insert({
              id: crypto.randomUUID(),
              user_id: auth.userId,
              title: noteTitle,
              content,
              language: args.language || 'plaintext',
              folder_id: null,
              tags: Array.isArray(args.tags) ? args.tags : [],
              pinned: false,
              created_at: now,
              updated_at: now,
              versions,
            }).select('*').single();
            if (error) throw new Error(error.message);
            result = { note: toNote(data as NoteRow) };
            break;
          }

          case 'update_note': {
            const { data: existing, error: fetchErr } = await client.from('notehub_notes').select('*').eq('user_id', auth.userId).eq('id', args.id).maybeSingle();
            if (fetchErr) throw new Error(fetchErr.message);
            if (!existing) throw new Error('Note not found');

            const note = existing as NoteRow;
            const updates: Record<string, unknown> = { updated_at: Date.now() };
            if (typeof args.content === 'string') {
              updates.content = args.content;
              const fl = args.content.split('\n')[0]?.trim() || '';
              if (fl) updates.title = fl.slice(0, 60);
              const vs = Array.isArray(note.versions) ? note.versions : [];
              if (vs.length === 0 || vs[vs.length - 1].content !== args.content) {
                updates.versions = [...vs.slice(-9), { content: args.content, timestamp: Date.now() }];
              }
            }
            if (typeof args.title === 'string') updates.title = args.title;
            if (typeof args.language === 'string') updates.language = args.language;
            if (typeof args.tags === 'object') updates.tags = args.tags;
            if (typeof args.pinned === 'boolean') updates.pinned = args.pinned;

            const { data: updated, error: updateErr } = await client.from('notehub_notes').update(updates).eq('user_id', auth.userId).eq('id', args.id).select('*').single();
            if (updateErr) throw new Error(updateErr.message);
            result = { note: toNote(updated as NoteRow) };
            break;
          }

          case 'delete_note': {
            const { error } = await client.from('notehub_notes').delete().eq('user_id', auth.userId).eq('id', args.id);
            if (error) throw new Error(error.message);
            result = { success: true };
            break;
          }

          case 'list_note_types':
            result = { noteTypes: LANGUAGES };
            break;

          default:
            return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown tool: ${name}` } });
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
        });
      }

      default:
        return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown method: ${method}` } });
    }
  } catch (err) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: err instanceof Error ? err.message : 'Internal error' },
    });
  }
}
