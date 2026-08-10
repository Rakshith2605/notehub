'use client';

import { Check, Copy, FileCode2, History, Trash2, X } from 'lucide-react';
import type { ClipboardItem } from '@/types';

interface ClipboardHistoryProps {
  items: ClipboardItem[];
  activeId: string | null;
  loading: boolean;
  copiedId: string | null;
  mobileOpen: boolean;
  onSelect: (id: string) => void;
  onCopy: (item: ClipboardItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function contentType(content: string): string {
  const trimmed = content.trim();
  if (/^https?:\/\//i.test(trimmed)) return 'URL';
  if (/^(#{1,6}\s|```|\[[^\]]+\]\()/m.test(trimmed)) return 'Markdown';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'JSON';
    } catch {
      return 'Text';
    }
  }
  if (/\b(const|let|function|SELECT|import)\b/.test(trimmed)) return 'Code';
  return 'Text';
}

function HistoryList({
  items,
  activeId,
  loading,
  copiedId,
  onSelect,
  onCopy,
  onDelete,
}: Pick<ClipboardHistoryProps, 'items' | 'activeId' | 'loading' | 'copiedId' | 'onSelect' | 'onCopy' | 'onDelete'>) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading clipboard history">
        {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-md bg-surface-tertiary" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-4 py-10 text-center">
        <FileCode2 size={22} className="text-muted" />
        <p className="mt-2 text-xs font-medium text-foreground">No saved clips</p>
        <p className="mt-1 max-w-[15rem] text-[11px] leading-relaxed text-muted">Paste something to start building a private, synced history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <div
            key={item.id}
            className={`group rounded-md border transition-colors ${isActive ? 'border-accent/40 bg-accent-muted/50' : 'border-border bg-surface-secondary hover:border-muted'}`}
          >
            <div className="flex items-start gap-2 p-2">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="min-w-0 flex-1 rounded-sm text-left focus-visible:outline-offset-2"
                aria-label={`Select ${contentType(item.content)} clip from ${relativeTime(item.createdAt)}`}
              >
                <p className="max-h-14 overflow-hidden whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground">
                  {item.content || 'Empty clip'}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
                  <span className="rounded bg-surface-tertiary px-1.5 py-0.5 uppercase tracking-wide">{contentType(item.content)}</span>
                  <span>{relativeTime(item.createdAt)}</span>
                  <span>{item.content.length.toLocaleString()} chars</span>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onCopy(item)}
                  className={`flex min-h-10 min-w-10 items-center justify-center rounded-md transition-colors ${copiedId === item.id ? 'text-accent' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`}
                  aria-label={`Copy ${contentType(item.content)} clip`}
                  title="Copy clip"
                >
                  {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-red-400"
                  aria-label={`Delete ${contentType(item.content)} clip`}
                  title="Delete clip"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HistoryContent({
  items,
  activeId,
  loading,
  copiedId,
  onSelect,
  onCopy,
  onDelete,
  onClear,
}: Pick<ClipboardHistoryProps, 'items' | 'activeId' | 'loading' | 'copiedId' | 'onSelect' | 'onCopy' | 'onDelete' | 'onClear'>) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent clips</h2>
          <p className="mt-0.5 text-[11px] text-muted">Private to your Copybook workspace</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={items.length === 0 || loading}
          className="text-[11px] font-medium text-muted transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear all
        </button>
      </div>
      <HistoryList
        items={items}
        activeId={activeId}
        loading={loading}
        copiedId={copiedId}
        onSelect={onSelect}
        onCopy={onCopy}
        onDelete={onDelete}
      />
    </>
  );
}

export default function ClipboardHistory({
  items,
  activeId,
  loading,
  copiedId,
  mobileOpen,
  onSelect,
  onCopy,
  onDelete,
  onClear,
  onClose,
}: ClipboardHistoryProps) {
  return (
    <>
      <aside aria-label="Recent clipboard clips" className="hidden min-h-0 overflow-y-auto rounded-lg border border-border bg-surface p-4 md:block">
        <HistoryContent
          items={items}
          activeId={activeId}
          loading={loading}
          copiedId={copiedId}
          onSelect={onSelect}
          onCopy={onCopy}
          onDelete={onDelete}
          onClear={onClear}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-history-title">
          <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close recent clips" />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-xl border-t border-border bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-accent" />
                <h2 id="mobile-history-title" className="text-sm font-semibold text-foreground">Recent clips</h2>
              </div>
              <button type="button" onClick={onClose} className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground" aria-label="Close recent clips">
                <X size={17} />
              </button>
            </div>
            <HistoryContent
              items={items}
              activeId={activeId}
              loading={loading}
              copiedId={copiedId}
              onSelect={onSelect}
              onCopy={onCopy}
              onDelete={onDelete}
              onClear={onClear}
            />
          </div>
        </div>
      )}
    </>
  );
}
