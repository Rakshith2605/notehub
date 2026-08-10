'use client';

import { ClipboardPaste, Copy, Check, Trash2, Loader2 } from 'lucide-react';
import type { ClipboardItem } from '@/types';

interface ClipboardComposerProps {
  item: ClipboardItem | null;
  onChange: (content: string) => void;
  onPasteNew: (content: string) => void;
  onCopy: () => void;
  onClear: () => void;
  onEditingChange: (editing: boolean) => void;
  copied: boolean;
  pasting: boolean;
}

export default function ClipboardComposer({
  item,
  onChange,
  onPasteNew,
  onCopy,
  onClear,
  onEditingChange,
  copied,
  pasting,
}: ClipboardComposerProps) {
  const content = item?.content || '';
  const lineCount = content ? content.split('\n').length : 0;

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = event.clipboardData.getData('text');
    if (!text) return;
    event.preventDefault();
    onPasteNew(text);
  };

  return (
    <section aria-labelledby="current-clip-title" className="flex min-h-0 flex-col rounded-lg border border-border bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 id="current-clip-title" className="text-sm font-semibold text-foreground">Current clip</h2>
          <p className="mt-0.5 text-xs text-muted">Paste, edit, and reuse your latest snippet.</p>
        </div>
        {item && (
          <span className="shrink-0 rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] text-muted">
            {content.length.toLocaleString()} chars
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <label htmlFor="current-clipboard" className="sr-only">Current clipboard content</label>
        <textarea
          id="current-clipboard"
          value={content}
          onChange={(event) => onChange(event.target.value)}
          onPaste={handlePaste}
          onFocus={() => onEditingChange(true)}
          onBlur={() => onEditingChange(false)}
          placeholder="Type or paste content here..."
          spellCheck={false}
          className="min-h-[14rem] h-[min(42dvh,20rem)] w-full flex-1 resize-none rounded-md border border-border bg-background p-3 font-mono text-[13px] leading-relaxed text-foreground placeholder:font-sans placeholder:text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />

        <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => onPasteNew('')}
            disabled={pasting}
            className="flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
          >
            {pasting ? <Loader2 size={14} className="animate-spin" /> : <ClipboardPaste size={14} />}
            Paste new clip
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={!content}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors ${
              copied
                ? 'border-accent/30 bg-accent-muted text-accent'
                : 'border-border bg-surface-secondary text-muted hover:border-muted hover:text-foreground'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {item && (
            <button
              type="button"
              onClick={onClear}
              className="ml-auto flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-red-400"
              aria-label="Remove current clip"
              title="Remove current clip"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted" aria-live="polite">
          <span>{lineCount || 0} {lineCount === 1 ? 'line' : 'lines'}</span>
          <span aria-hidden="true">•</span>
          <span>{item ? 'Active clip' : 'No clip saved yet'}</span>
        </div>
      </div>
    </section>
  );
}
