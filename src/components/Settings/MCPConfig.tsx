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
  const [serverPath, setServerPath] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    setApiUrl(origin);

    fetch('/api/mcp/server-path')
      .then((res) => res.json())
      .then((data) => {
        if (data.serverPath) setServerPath(data.serverPath);
      })
      .catch(() => {});

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
        command: 'node',
        args: [serverPath || 'mcp-server/index.mjs'],
        env: {
          NOTEHUB_API_URL: apiUrl || 'https://your-app.vercel.app',
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
        Paste this into your MCP client config. No extra install needed — the server is a single file with zero dependencies.
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
          <p className="text-[10px] text-amber-300">Running locally? Change this to your Vercel deployment URL.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-medium text-muted-foreground">
          Server path <span className="text-muted">(auto-detected)</span>
        </label>
        <input
          type="text"
          value={serverPath}
          onChange={(e) => setServerPath(e.target.value)}
          placeholder="path/to/notehub/mcp-server/index.mjs"
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

      <p className="text-[10px] text-muted leading-relaxed">
        This server uses the MCP stdio protocol (JSON-RPC over stdin/stdout).
        It has <strong>zero npm dependencies</strong> — just Node.js built-ins.
        Works with{' '}
        <a href="https://docs.anthropic.com/en/docs/claude-code/mcp" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Claude Desktop
        </a>,{' '}
        <a href="https://opencode.ai" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          OpenCode
        </a>, and any MCP-compatible client.
      </p>
    </div>
  );
}
