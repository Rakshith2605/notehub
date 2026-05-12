'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
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

export default function MCPConfig() {
  const [apiUrl, setApiUrl] = useState('');
  const [latestPat, setLatestPat] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    setApiUrl(origin);

    fetchWithAuth('/api/auth/pat/list')
      .then((data) => {
        if (data.pats?.length > 0) {
          setLatestPat(data.pats[0].prefix);
        }
      })
      .catch(() => {});
  }, []);

  const config = JSON.stringify({
    mcpServers: {
      notehub: {
        command: 'npx',
        args: [
          '-y',
          'mcp-remote',
          `${apiUrl || 'https://notehub-nine.vercel.app'}/api/mcp`,
          '--header',
          `Authorization: Bearer \${NOTEHUB_PAT}`,
        ],
        env: {
          NOTEHUB_PAT: latestPat ? 'nhpat_YOUR_TOKEN' : 'nhpat_YOUR_TOKEN_HERE',
        },
      },
    },
  }, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Paste this into your MCP client config. Uses{' '}
        <code className="px-1 rounded bg-surface-tertiary text-[11px]">mcp-remote</code> to connect
        via HTTP — no local server file needed.
      </p>

      <div className="space-y-1.5">
        <label className="text-[10px] font-medium text-muted-foreground">
          API URL <span className="text-muted">(your deployment)</span>
        </label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="https://notehub-nine.vercel.app"
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground font-mono outline-none focus:border-accent"
        />
        {apiUrl.includes('localhost') && (
          <p className="text-[10px] text-amber-300">Change to your Vercel deployment URL.</p>
        )}
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

      <p className="text-[10px] text-muted leading-relaxed">
        No local files or install steps. <code className="px-1 rounded bg-surface-tertiary text-[11px]">npx mcp-remote</code> bridges
        stdio to the NoteHub HTTP API. Works with Claude Desktop, OpenCode, and any MCP client.
      </p>
    </div>
  );
}
