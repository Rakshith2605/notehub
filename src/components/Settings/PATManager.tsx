'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, Key, Loader2, Plus, Trash2 } from 'lucide-react';
import type { Pat } from '@/types';
import { getSupabase } from '@/lib/supabase';

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return res.json();
}

export default function PATManager() {
  const [pats, setPats] = useState<Pat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadPats = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/api/auth/pat/list');
      if (data.error) { setError(data.error); return; }
      setPats(data.pats || []);
    } catch {
      setError('Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPats(); }, [loadPats]);

  const handleGenerate = async () => {
    if (!name.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const data = await fetchWithAuth('/api/auth/pat/generate', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (data.error) { setError(data.error); setGenerating(false); return; }
      setNewToken(data.token);
      setName('');
      setGenerating(false);
      loadPats();
    } catch {
      setError('Failed to generate token');
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const data = await fetchWithAuth('/api/auth/pat/revoke', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      if (data.error) { setError(data.error); return; }
      loadPats();
    } catch {
      setError('Failed to revoke token');
    }
  };

  const handleCopy = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dismissToken = () => {
    setNewToken(null);
    setTokenVisible(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Personal Access Tokens</h2>
        <p className="text-xs text-muted">
          Generate tokens to connect AI tools like Claude to your NoteHub workspace via MCP.
          Use them in your MCP client config as <code className="px-1 rounded bg-surface-tertiary text-[11px]">NOTEHUB_PAT</code>.
        </p>
      </div>

      {newToken && (
        <div className="rounded-md border border-accent/40 bg-accent-muted p-3 space-y-2">
          <p className="text-xs text-muted-foreground">Copy this token now — you won&apos;t see it again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-background px-2 py-1.5 text-xs text-foreground break-all select-all">
              {tokenVisible ? newToken : newToken.replace(/./g, '•')}
            </code>
            <button
              onClick={() => setTokenVisible(!tokenVisible)}
              className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors shrink-0"
              title={tokenVisible ? 'Hide' : 'Show'}
            >
              {tokenVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => handleCopy(newToken!)}
              className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors shrink-0"
              title="Copy to clipboard"
            >
              {copied ? <span className="text-[10px] text-green-400">Copied</span> : <Copy size={14} />}
            </button>
          </div>
          <button onClick={dismissToken} className="text-[10px] text-muted hover:text-foreground transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name (e.g. Claude Desktop)"
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted focus:border-accent"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          maxLength={50}
        />
        <button
          onClick={handleGenerate}
          disabled={generating || !name.trim()}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70 shrink-0"
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Generate
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-xs text-muted animate-pulse">Loading tokens...</div>
        ) : pats.length === 0 ? (
          <div className="text-xs text-muted">No tokens yet. Generate one to get started.</div>
        ) : (
          pats.map((pat) => (
            <div key={pat.id} className="flex items-center gap-2 rounded-md border border-border bg-surface-secondary px-3 py-2">
              <Key size={12} className="text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground truncate">{pat.name}</div>
                <div className="text-[10px] text-muted font-mono">{pat.prefix}...</div>
                {pat.lastUsedAt && (
                  <div className="text-[10px] text-muted mt-0.5">
                    Last used: {new Date(pat.lastUsedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRevoke(pat.id)}
                className="p-1 rounded text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                title="Revoke token"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
