#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_URL = process.env.NOTEHUB_API_URL;
const PAT = process.env.NOTEHUB_PAT;

if (!API_URL) {
  console.error('NOTEHUB_API_URL is required. Set it to your NoteHub deployment URL (e.g. https://notehub.example.com)');
  process.exit(1);
}
if (!PAT) {
  console.error('NOTEHUB_PAT is required. Generate one in NoteHub Settings → Personal Access Tokens.');
  process.exit(1);
}

const apiUrl = API_URL.replace(/\/$/, '');

async function api(path, options = {}) {
  const url = `${apiUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAT}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

const server = new Server(
  { name: 'notehub', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_notes',
      description: 'List all notes in your NoteHub workspace. Optionally filter by a search query.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to filter notes by title or content (case-insensitive partial match)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of notes to return (default 50, max 100)',
          },
        },
      },
    },
    {
      name: 'get_note',
      description: 'Get a specific note by its ID, including full content, language, tags, and version history.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The note ID (returned by list_notes)',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'create_note',
      description: 'Create a new note in your NoteHub workspace. Auto-detects language from content if not specified.',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The note content (code, markdown, JSON, etc.)',
          },
          title: {
            type: 'string',
            description: 'Optional title. Auto-generated from first line of content if not provided.',
          },
          language: {
            type: 'string',
            description: 'Programming language / format. Use list_note_types to see available options. Defaults to plaintext.',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of tag IDs (use tag IDs from NoteHub, or new tag names)',
          },
        },
        required: ['content'],
      },
    },
    {
      name: 'update_note',
      description: 'Update an existing note. Only specify the fields you want to change.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The note ID to update',
          },
          content: {
            type: 'string',
            description: 'New content for the note',
          },
          title: {
            type: 'string',
            description: 'New title for the note',
          },
          language: {
            type: 'string',
            description: 'New language/format for the note',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Replace all tags with this list of tag IDs',
          },
          pinned: {
            type: 'boolean',
            description: 'Whether to pin the note',
          },
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
          id: {
            type: 'string',
            description: 'The note ID to delete',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'list_note_types',
      description: 'List all supported note types (programming languages and formats) available in NoteHub.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list_notes': {
      const params = new URLSearchParams();
      if (args?.query) params.set('query', args.query);
      if (args?.limit) params.set('limit', String(args.limit));
      const qs = params.toString();
      const data = await api(`/api/mcp/notes${qs ? '?' + qs : ''}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'get_note': {
      const data = await api(`/api/mcp/notes/${encodeURIComponent(args.id)}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'create_note': {
      const data = await api('/api/mcp/notes', {
        method: 'POST',
        body: JSON.stringify({
          content: args.content,
          title: args.title,
          language: args.language,
          tags: args.tags,
        }),
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'update_note': {
      const body = {};
      if (args.content !== undefined) body.content = args.content;
      if (args.title !== undefined) body.title = args.title;
      if (args.language !== undefined) body.language = args.language;
      if (args.tags !== undefined) body.tags = args.tags;
      if (args.pinned !== undefined) body.pinned = args.pinned;

      const data = await api(`/api/mcp/notes/${encodeURIComponent(args.id)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'delete_note': {
      const data = await api(`/api/mcp/notes/${encodeURIComponent(args.id)}`, {
        method: 'DELETE',
      });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    case 'list_note_types': {
      const data = await api('/api/mcp/note-types');
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NoteHub MCP server running');
  console.error(`API: ${apiUrl}`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
