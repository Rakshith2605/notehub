'use client';

import { useState } from 'react';
import { Clipboard, History, Loader2, Check, AlertCircle } from 'lucide-react';
import { useNoteStore } from '@/hooks/useNotes';
import type { ClipboardItem } from '@/types';
import ClipboardComposer from './Clipboard/ClipboardComposer';
import ClipboardHistory from './Clipboard/ClipboardHistory';

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
}

function relativeTime(timestamp: number | null): string {
  if (!timestamp) return '';
  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ClipboardPane() {
  const {
    clipboardItems,
    activeClipboardId,
    selectClipboardItem,
    addClipboardItem,
    deleteClipboardItem,
    clearClipboardHistory,
    updateCurrentClipboard,
    setClipboardEditing,
    loadClipboardItems,
    clipboardLoading,
    clipboardSyncState,
    clipboardError,
    clipboardLastSyncedAt,
  } = useNoteStore();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [message, setMessage] = useState('');

  const currentItem = clipboardItems.find((item) => item.id === activeClipboardId) || clipboardItems[0] || null;

  const announce = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage((current) => (current === text ? '' : current)), 1800);
  };

  const handlePasteNew = async (content: string) => {
    setPasting(true);
    try {
      const nextContent = content || await navigator.clipboard.readText();
      if (!nextContent) {
        announce('Clipboard is empty');
        return;
      }
      await addClipboardItem(nextContent);
      announce('Clip saved');
    } catch {
      announce('Unable to read the clipboard. Paste directly into the editor instead.');
    } finally {
      setPasting(false);
    }
  };

  const handleCopy = async () => {
    if (!currentItem?.content) return;
    await copyText(currentItem.content);
    setCopied(true);
    announce('Clip copied');
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyItem = async (item: ClipboardItem) => {
    await copyText(item.content);
    setCopiedId(item.id);
    announce('Clip copied');
    window.setTimeout(() => setCopiedId((current) => (current === item.id ? null : current)), 1500);
  };

  const handleDelete = async (id: string) => {
    await deleteClipboardItem(id);
    announce('Clip removed');
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all saved clips? This cannot be undone.')) return;
    await clearClipboardHistory();
    setHistoryOpen(false);
    announce('Clipboard history cleared');
  };

  const syncLabel = clipboardSyncState === 'loading'
    ? 'Loading history'
    : clipboardSyncState === 'saving'
      ? 'Saving'
      : clipboardSyncState === 'error'
        ? 'Sync issue'
        : clipboardLastSyncedAt
          ? `Saved ${relativeTime(clipboardLastSyncedAt)}`
          : 'Ready to save';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Clipboard size={17} className="shrink-0 text-accent" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground">Clipboard</h1>
            <p className="hidden text-[11px] text-muted sm:block">Capture once. Reuse anywhere.</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-[11px] ${clipboardSyncState === 'error' ? 'text-red-300' : clipboardSyncState === 'saved' ? 'text-accent' : 'text-muted'}`} role="status" aria-live="polite">
            {clipboardSyncState === 'saving' || clipboardSyncState === 'loading' ? <Loader2 size={12} className="animate-spin" /> : clipboardSyncState === 'error' ? <AlertCircle size={12} /> : clipboardSyncState === 'saved' ? <Check size={12} /> : null}
            <span className="hidden sm:inline">{syncLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex min-h-10 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted transition-colors hover:border-muted hover:text-foreground md:hidden"
            aria-label={`Open recent clips, ${clipboardItems.length} saved`}
          >
            <History size={14} />
            <span>History</span>
            <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px]">{clipboardItems.length}</span>
          </button>
        </div>
      </div>

      {clipboardError && (
        <div className="flex shrink-0 items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200" role="alert">
          <AlertCircle size={14} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{clipboardError}</span>
          <button type="button" onClick={() => void loadClipboardItems()} className="shrink-0 font-medium underline underline-offset-2 hover:text-white">Retry</button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-4 p-4 pb-24 md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:gap-5 md:p-6">
          <ClipboardComposer
            item={currentItem}
            onChange={updateCurrentClipboard}
            onPasteNew={(content) => void handlePasteNew(content)}
            onCopy={() => void handleCopy()}
            onClear={() => { if (currentItem) void handleDelete(currentItem.id); }}
            onEditingChange={setClipboardEditing}
            copied={copied}
            pasting={pasting}
          />
          <ClipboardHistory
            items={clipboardItems}
            activeId={activeClipboardId}
            loading={clipboardLoading}
            copiedId={copiedId}
            mobileOpen={historyOpen}
            onSelect={(id) => { selectClipboardItem(id); setHistoryOpen(false); }}
            onCopy={(item) => void handleCopyItem(item)}
            onDelete={(id) => void handleDelete(id)}
            onClear={() => void handleClear()}
            onClose={() => setHistoryOpen(false)}
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2 border-t border-border bg-surface/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <button type="button" onClick={() => void handlePasteNew('')} disabled={pasting} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-accent text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-70">
          {pasting ? <Loader2 size={15} className="animate-spin" /> : <Clipboard size={15} />}
          Paste new clip
        </button>
        <button type="button" onClick={() => void handleCopy()} disabled={!currentItem?.content} className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface-secondary text-muted hover:text-foreground disabled:opacity-40" aria-label="Copy current clip">
          {copied ? <Check size={16} /> : <span className="text-xs font-medium">Copy</span>}
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
