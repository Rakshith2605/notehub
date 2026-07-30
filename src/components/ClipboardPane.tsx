'use client';

import { useEffect, useRef, useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { Clipboard, ClipboardPaste, Trash2, Clock, Copy, Check } from 'lucide-react';

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ClipboardPane() {
  const { clipboardItems, addClipboardItem, deleteClipboardItem } = useNoteStore();
  const [pasted, setPasted] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentContent = clipboardItems[0]?.content ?? '';

  useEffect(() => {
    // Auto-focus the paste area when entering clipboard mode
    textareaRef.current?.focus();
  }, []);

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (text) {
      e.preventDefault();
      void addClipboardItem(text);
      setPasted(true);
      setTimeout(() => setPasted(false), 1500);
    }
  };

  const handleCopy = async () => {
    if (!currentContent) return;
    try {
      await navigator.clipboard.writeText(currentContent);
    } catch {
      // Fallback for environments where the async clipboard API is unavailable
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        ta.select();
        document.execCommand('copy');
        ta.blur();
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Clipboard size={16} className="text-accent" />
        <span className="text-sm font-medium text-foreground">Clipboard Mode</span>
        <span className="text-[10px] text-muted ml-auto flex items-center gap-1">
          <Clock size={10} />
          Syncing every second
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="mb-4 text-center">
            <ClipboardPaste size={32} className="mx-auto text-muted mb-2" />
            <p className="text-sm text-muted">
              Paste anywhere to sync across devices
            </p>
            {pasted && (
              <p className="text-xs text-accent mt-1 animate-pulse">Saved to clipboard history!</p>
            )}
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={currentContent}
              onPaste={handleTextareaPaste}
              placeholder="Paste here or press Ctrl+V / Cmd+V..."
              className="w-full h-40 bg-surface-secondary border border-border rounded-md p-3 pr-24 text-sm text-foreground placeholder-muted outline-none resize-none focus:border-accent focus:ring-1 focus:ring-accent"
              readOnly
            />
            <button
              onClick={handleCopy}
              disabled={!currentContent}
              className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                copied
                  ? 'bg-accent-muted text-accent border-accent/30'
                  : 'bg-surface-tertiary text-muted border-border hover:text-foreground hover:border-muted'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Copy current clipboard"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Recent History</span>
              <span className="text-[10px] text-muted">{clipboardItems.length} items</span>
            </div>
            {clipboardItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted">No clipboard history yet</div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {clipboardItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-surface-secondary border border-border group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{item.content.slice(0, 200)}</p>
                      <p className="text-[10px] text-muted mt-0.5">{relativeTime(item.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => deleteClipboardItem(item.id)}
                      className="p-0.5 rounded text-muted hover:text-red-400 hover:bg-surface-hover transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      title="Delete"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
