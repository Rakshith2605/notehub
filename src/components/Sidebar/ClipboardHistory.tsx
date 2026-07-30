'use client';

import { useNoteStore } from '@/hooks/useNotes';
import { Clipboard, Trash2 } from 'lucide-react';

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

export default function ClipboardHistory() {
  const { clipboardItems, deleteClipboardItem, clipboardMode, setClipboardMode } = useNoteStore();

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Clipboard</span>
        <span className="text-[10px] text-muted">{clipboardItems.length}</span>
      </div>

      <button
        onClick={() => setClipboardMode(!clipboardMode)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors mb-2 ${
          clipboardMode
            ? 'bg-accent-muted text-accent border border-accent/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-transparent'
        }`}
      >
        <Clipboard size={14} />
        <span className="flex-1 text-left">{clipboardMode ? 'Clipboard Mode On' : 'Enter Clipboard Mode'}</span>
      </button>

      <div className="space-y-0.5 max-h-48 overflow-y-auto">
        {clipboardItems.length === 0 ? (
          <div className="text-center py-2 text-[10px] text-muted">No history</div>
        ) : (
          clipboardItems.slice(0, 20).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-surface-hover transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-[11px] text-foreground">{item.content.slice(0, 60)}</p>
                <p className="text-[10px] text-muted mt-0.5">{relativeTime(item.createdAt)}</p>
              </div>
              <button
                onClick={() => deleteClipboardItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
