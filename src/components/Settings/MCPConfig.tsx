'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

async function fetchWithAuth(path: string) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

function buildConfig(apiUrl: string, pat: string | null, serverPath: string): string {
  const env: Record<string, string> = {
    NOTEHUB_API_URL: apiUrl,
  };
  if (pat) {
    env.NOTEHUB_PAT = pat;
  } else {
    env.NOTEHUB_PAT = 'nhpat_YOUR_TOKEN_HERE';
  }

  const config = {
    mcpServers: {
      notehub: {
        command: 'node',
        args: [serverPath],
        env,
      },
    },
  };

  return JSON.stringify(config, null, 2);
}

export default function MCPConfig() {
  const [apiUrl, setApiUrl] = useState('');
  const [latestPat, setLatestPat] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverPath, setServerPath] = useState('/path/to/notehub/mcp-server/index.mjs');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiUrl(window.location.origin);
    }
    fetchWithAuth('/api/auth/pat/list')
      .then((data) => {
        if (data.pats?.length > 0) {
          setLatestPat(data.pats[0].prefix);
        }
      })
      .catch(() => {});
  }, []);

  const config = buildConfig(apiUrl || 'https://your-notehub-app.vercel.app', latestPat, serverPath);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Add this to your{' '}
        <a
          href="https://docs.anthropic.com/en/docs/claude-code/mcp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline inline-flex items-center gap-0.5"
        >
          Claude Desktop MCP config
          <ExternalLink size={10} />
        </a>
        {' '}or any MCP client. Replace the server path with where you cloned NoteHub.
      </p>

      <div className="space-y-1.5">
        <label className="text-[10px] font-medium text-muted-foreground">Server path</label>
        <input
          type="text"
          value={serverPath}
          onChange={(e) => setServerPath(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground font-mono outline-none focus:border-accent"
        />
      </div>

      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center gap-1 rounded bg-surface-tertiary px-2 py-1 text-[10px] text-muted hover:text-foreground border border-border transition-colors"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <pre className="rounded-md border border-border bg-background p-3 overflow-x-auto text-xs text-foreground font-mono leading-relaxed">
          <code>{config}</code>
        </pre>
      </div>

      {!latestPat && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Generate a PAT above first, then the config will include your token.
        </div>
      )}
    </div>
  );
}
