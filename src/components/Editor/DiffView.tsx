'use client';

import dynamic from 'next/dynamic';
import { useNoteStore } from '@/hooks/useNotes';
import { mapLanguageToMonaco } from '@/lib/languages';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Note } from '@/types';

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  { ssr: false }
);

interface DiffViewProps {
  original: string;
  modified: string;
  modifiedLang: string;
  notes: Note[];
  currentNoteId: string;
  comparisonNoteId: string | null;
  onComparisonChange: (id: string) => void;
  onClose: () => void;
}

export default function DiffView({ original, modified, modifiedLang, notes, currentNoteId, comparisonNoteId, onComparisonChange, onClose }: DiffViewProps) {
  const { theme } = useNoteStore();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-8 flex items-center justify-between px-3 bg-surface-secondary border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-muted-foreground shrink-0">Compare</span>
          <select
            value={comparisonNoteId ?? ''}
            onChange={(event) => onComparisonChange(event.target.value)}
            className="min-w-0 max-w-[min(60vw,18rem)] h-7 rounded border border-border bg-surface-tertiary px-2 text-[11px] text-foreground outline-none"
            aria-label="Choose note to compare"
          >
            <option value="">Choose a note...</option>
            {notes.filter((note) => note.id !== currentNoteId).map((note) => (
              <option key={note.id} value={note.id}>{note.title || 'Untitled'}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={onClose} className="min-h-7 px-2 text-[11px] text-muted hover:text-foreground transition-colors">Close</button>
      </div>
      <div className="flex-1 min-h-0">
        {comparisonNoteId ? <MonacoDiffEditor
          original={original}
          modified={modified}
          language={mapLanguageToMonaco(modifiedLang)}
          theme={theme === 'light' ? 'vs' : 'vs-dark'}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderSideBySide: !isMobile,
            readOnly: true,
            padding: { top: 16 },
          }}
        /> : (
          <div className="h-full flex items-center justify-center text-xs text-muted">Choose another note to compare.</div>
        )}
      </div>
    </div>
  );
}
