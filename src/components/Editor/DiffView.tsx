'use client';

import dynamic from 'next/dynamic';
import { useNoteStore } from '@/hooks/useNotes';
import { mapLanguageToMonaco } from '@/lib/languages';

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  { ssr: false }
);

interface DiffViewProps {
  original: string;
  modified: string;
  modifiedLang: string;
  onClose: () => void;
}

export default function DiffView({ original, modified, modifiedLang, onClose }: DiffViewProps) {
  const { theme } = useNoteStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-8 flex items-center justify-between px-3 bg-surface-secondary border-b border-border">
        <span className="text-[11px] text-muted-foreground">
          Comparing two notes
        </span>
        <button
          onClick={onClose}
          className="text-[11px] text-muted hover:text-foreground transition-colors"
        >
          Close diff view
        </button>
      </div>
      <div className="flex-1">
        <MonacoDiffEditor
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
            renderSideBySide: true,
            readOnly: true,
            padding: { top: 16 },
          }}
        />
      </div>
    </div>
  );
}
