'use client';

import { useEffect, useRef, useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { Clipboard, ClipboardPaste, Trash2, Clock, Copy, Check, History } from 'lucide-react';

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

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for environments where the async clipboard API is unavailable
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

export default function ClipboardPane() {
  const { clipboardItems, addClipboardItem, deleteClipboardItem, updateCurrentClipboard, setClipboardEditing } = useNoteStore();
  const [pasted, setPasted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletedMessage, setDeletedMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
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
    await copyText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyItem = async (id: string, content: string) => {
    await copyText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
  };

  const handleDeleteItem = (id: string) => {
    deleteClipboardItem(id);
    setDeletedMessage('Clipboard item deleted');
    setTimeout(() => setDeletedMessage(''), 1800);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Clipboard size={16} className="text-accent" />
        <span className="text-sm font-medium text-foreground">Clipboard Mode</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`min-h-7 flex items-center gap-1.5 px-2 rounded-md text-[11px] font-medium border transition-colors ${
              showHistory
                ? 'bg-accent-muted text-accent border-accent/30'
                : 'text-muted border-border hover:text-foreground hover:border-muted'
            }`}
            title={showHistory ? 'Hide clipboard history' : 'Show clipboard history'}
          >
            <History size={12} />
            History
            <span className="text-[10px] px-1 rounded bg-surface-tertiary border border-border">
              {clipboardItems.length}
            </span>
          </button>
          <span className="text-[10px] text-muted flex items-center gap-1">
            <Clock size={10} />
            Syncing every second
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <div className="mb-4 text-center">
            <ClipboardPaste size={32} className="mx-auto text-muted mb-2" />
            <p className="text-sm text-muted">
              Paste anywhere to sync across devices
            </p>
            {pasted && (
              <p className="text-xs text-accent mt-1 animate-pulse">Saved to clipboard history!</p>
            )}
            <p className="sr-only" role="status" aria-live="polite">{deletedMessage}</p>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={currentContent}
              onChange={(e) => updateCurrentClipboard(e.target.value)}
              onPaste={handleTextareaPaste}
              onFocus={() => setClipboardEditing(true)}
              onBlur={() => setClipboardEditing(false)}
              placeholder="Paste or type here — synced across devices..."
              className="w-full h-40 bg-surface-secondary border border-border rounded-md p-3 pr-24 text-sm text-foreground placeholder-muted outline-none resize-none focus:border-accent focus:ring-1 focus:ring-accent"
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

          {showHistory && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">Recent History</span>
                <span className="text-[10px] text-muted">last {clipboardItems.length} copies</span>
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
                        onClick={() => void handleCopyItem(item.id, item.content)}
                        className={`min-w-7 min-h-7 flex items-center justify-center rounded transition-colors shrink-0 ${
                          copiedId === item.id
                            ? 'text-accent'
                            : 'text-muted hover:text-foreground hover:bg-surface-hover'
                        }`}
                        title="Copy this item"
                      >
                        {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        aria-label="Delete clipboard item"
                        className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-red-400 hover:bg-surface-hover transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
