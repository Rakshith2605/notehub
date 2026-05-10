'use client';

import dynamic from 'next/dynamic';

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  { ssr: false }
);

interface DiffViewProps {
  original: string;
  modified: string;
  originalLang: string;
  modifiedLang: string;
  onClose: () => void;
}

function mapLanguageToMonaco(lang: string): string {
  const langMap: Record<string, string> = {
    javascript: 'javascript', typescript: 'typescript', python: 'python',
    java: 'java', c: 'c', cpp: 'cpp', go: 'go', rust: 'rust',
    sql: 'sql', bash: 'shell', json: 'json', yaml: 'yaml',
    markdown: 'markdown', toml: 'plaintext', url: 'plaintext', plaintext: 'plaintext',
  };
  return langMap[lang] || 'plaintext';
}

export default function DiffView({ original, modified, modifiedLang, onClose }: DiffViewProps) {
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
          theme="vs-dark"
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
