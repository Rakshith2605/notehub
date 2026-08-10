#!/usr/bin/env node
// Copybook MCP Server — zero dependencies, single file
// Protocol: JSON-RPC 2.0 over stdio (newline-delimited)

import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';

const API_URL = process.env.NOTEHUB_API_URL;
const PAT = process.env.NOTEHUB_PAT;

if (!API_URL) {
  process.stderr.write('NOTEHUB_API_URL is required\n');
  process.exit(1);
}
if (!PAT) {
  process.stderr.write('NOTEHUB_PAT is required\n');
  process.exit(1);
}

const apiUrl = API_URL.replace(/\/$/, '');

async function api(path, opts = {}) {
  const res = await fetch(apiUrl + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAT}`,
      ...opts.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const TOOLS = [
  {
    name: 'list_notes',
    description: 'List all notes in your Copybook workspace. Optionally filter by a search query.',
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
      properties: {
        id: { type: 'string', description: 'The note ID (returned by list_notes)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_note',
    description: 'Create a new note in your Copybook workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The note content (code, markdown, JSON, etc.)' },
        title: { type: 'string', description: 'Optional. Auto-generated from first line if not provided.' },
        language: { type: 'string', description: 'Language/format. Use list_note_types to see options. Default: plaintext' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional list of tag names' },
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
        pinned: { type: 'boolean', description: 'Whether to pin the note' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_note',
    description: 'Delete a note permanently.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The note ID to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_note_types',
    description: 'List all supported note types (programming languages and formats) available in Copybook.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function error(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

async function handleRequest(msg) {
  const { id, method, params } = msg;

  try {
    switch (method) {
      case 'initialize':
        return respond(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'copybook', version: '1.0.0' },
        });

      case 'notifications/initialized':
        return; // no response

      case 'ping':
        return respond(id, {});

      case 'tools/list':
        return respond(id, { tools: TOOLS });

      case 'tools/call': {
        const { name, arguments: args = {} } = params;
        let result;

        switch (name) {
          case 'list_notes': {
            const qs = new URLSearchParams();
            if (args.query) qs.set('query', args.query);
            if (args.limit) qs.set('limit', String(args.limit));
            result = await api(`/api/mcp/notes${qs.toString() ? '?' + qs.toString() : ''}`);
            break;
          }
          case 'get_note':
            result = await api(`/api/mcp/notes/${encodeURIComponent(args.id)}`);
            break;
          case 'create_note':
            result = await api('/api/mcp/notes', {
              method: 'POST',
              body: JSON.stringify({ content: args.content, title: args.title, language: args.language, tags: args.tags }),
            });
            break;
          case 'update_note': {
            const body = {};
            if (args.content !== undefined) body.content = args.content;
            if (args.title !== undefined) body.title = args.title;
            if (args.language !== undefined) body.language = args.language;
            if (args.tags !== undefined) body.tags = args.tags;
            if (args.pinned !== undefined) body.pinned = args.pinned;
            result = await api(`/api/mcp/notes/${encodeURIComponent(args.id)}`, { method: 'PUT', body: JSON.stringify(body) });
            break;
          }
          case 'delete_note':
            result = await api(`/api/mcp/notes/${encodeURIComponent(args.id)}`, { method: 'DELETE' });
            break;
          case 'list_note_types':
            result = await api('/api/mcp/note-types');
            break;
          default:
            return error(id, -32601, `Unknown tool: ${name}`);
        }

        return respond(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        });
      }

      default:
        return error(id, -32601, `Unknown method: ${method}`);
    }
  } catch (err) {
    return error(id, -32000, err.message);
  }
}

const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line);
    handleRequest(msg);
  } catch {
    // skip unparseable lines
  }
});

process.stderr.write(`Copybook MCP server started (API: ${apiUrl})\n`);
