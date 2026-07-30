'use client';

import { useNoteStore } from '@/hooks/useNotes';
import { Clipboard } from 'lucide-react';

export default function ClipboardHistory() {
  const { clipboardItems, clipboardMode, setClipboardMode } = useNoteStore();

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Clipboard</span>
        <span className="text-[10px] text-muted">{clipboardItems.length}</span>
      </div>

      <button
        onClick={() => setClipboardMode(!clipboardMode)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
          clipboardMode
            ? 'bg-accent-muted text-accent border border-accent/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-transparent'
        }`}
      >
        <Clipboard size={14} />
        <span className="flex-1 text-left">{clipboardMode ? 'Clipboard Mode On' : 'Enter Clipboard Mode'}</span>
      </button>
    </div>
  );
}
