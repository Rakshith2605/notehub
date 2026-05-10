'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { OnMount } from '@monaco-editor/react';
import { useNoteStore } from '@/hooks/useNotes';
import Toolbar from './Toolbar';
import LanguageBadge from './LanguageBadge';
import MarkdownPreview from './MarkdownPreview';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-editor text-muted text-sm">
      Loading editor...
    </div>
  ),
});

const JsonTreeView = dynamic(() => import('./JsonTreeView'), { ssr: false });
const DiffView = dynamic(() => import('./DiffView'), { ssr: false });

function mapLanguageToMonaco(lang: string): string {
  const langMap: Record<string, string> = {
    javascript: 'javascript', typescript: 'typescript', python: 'python',
    java: 'java', c: 'c', cpp: 'cpp', go: 'go', rust: 'rust',
    sql: 'sql', bash: 'shell', json: 'json', yaml: 'yaml',
    markdown: 'markdown', toml: 'plaintext', url: 'plaintext', plaintext: 'plaintext',
  };
  return langMap[lang] || 'plaintext';
}

export default function EditorPane() {
  const { notes, selectedNoteId, updateNote } = useNoteStore();
  const note = notes.find((n) => n.id === selectedNoteId);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [splitView, setSplitView] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [versionPanel, setVersionPanel] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [diffNoteId, setDiffNoteId] = useState<string | null>(null);
  const pasteHandlerRef = useRef<{ dispose: () => void } | null>(null);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      if (pasteHandlerRef.current) pasteHandlerRef.current.dispose();
      pasteHandlerRef.current = editor.onDidPaste(() => {
        const content = editor.getValue();
        if (content && content.length > 0) {
          import('@/lib/detect').then(({ detectLanguage }) => {
            const detected = detectLanguage(content);
            const monacoLang = mapLanguageToMonaco(detected);
            const model = editor.getModel();
            if (model) monaco.editor.setModelLanguage(model, monacoLang);
            if (note) updateNote(note.id, { language: detected });
            setDetectedLang(detected);
            setTimeout(() => setDetectedLang(null), 3000);
          });
        }
      });
    },
    [note, updateNote]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (note && value !== undefined) updateNote(note.id, { content: value });
    },
    [note, updateNote]
  );

  const handleRestoreVersion = (content: string) => {
    if (note) {
      updateNote(note.id, { content });
    }
  };

  const diffNote = diffNoteId ? notes.find((n) => n.id === diffNoteId) : null;

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-editor text-muted text-sm">
        Select a note or create a new one
      </div>
    );
  }

  if (diffMode && diffNote) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <DiffView
          original={diffNote.content}
          modified={note.content}
          originalLang={diffNote.language}
          modifiedLang={note.language}
          onClose={() => { setDiffMode(false); setDiffNoteId(null); }}
        />
      </div>
    );
  }

  const versions = note.versions || [];
  const hasVersions = versions.length > 1;

  const openDiff = () => {
    const other = notes.find((n) => n.id !== note.id);
    if (other) {
      setDiffNoteId(other.id);
      setDiffMode(true);
    }
  };

  return (
    <div className="flex-1 flex flex-row overflow-hidden">
      <div className={`flex-1 flex flex-col overflow-hidden ${versionPanel ? 'w-[calc(100%-256px)]' : 'w-full'}`}>
        <div className="flex items-center gap-2 bg-surface-secondary border-b border-border">
          <Toolbar
            note={note}
            wordWrap={wordWrap} setWordWrap={setWordWrap}
            minimap={minimap} setMinimap={setMinimap}
            fontSize={fontSize} setFontSize={setFontSize}
            splitView={splitView} setSplitView={setSplitView}
            previewMode={previewMode} setPreviewMode={setPreviewMode}
          />
          <button
            onClick={() => setVersionPanel(!versionPanel)}
            className={`mr-2 p-1 rounded text-[10px] transition-colors shrink-0 ${
              versionPanel ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
            title="Version history"
          >
            v{hasVersions ? versions.length : 1}
          </button>
          {notes.length > 1 && (
            <button
              onClick={openDiff}
              className="mr-2 p-1 rounded text-[10px] text-muted hover:text-foreground hover:bg-surface-hover transition-colors shrink-0"
              title="Compare with another note"
            >
              Diff
            </button>
          )}
          {detectedLang && (
            <div className="pr-3 shrink-0">
              <LanguageBadge language={detectedLang} />
            </div>
          )}
        </div>

        {previewMode && note.language === 'markdown' ? (
          <MarkdownPreview content={note.content} />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className={`${splitView && (note.language === 'json' || note.language === 'yaml') ? 'w-1/2' : 'flex-1'} overflow-hidden`}>
              <MonacoEditor
                key={`${note.id}-${note.language}`}
                language={mapLanguageToMonaco(note.language)}
                value={note.content}
                onChange={handleChange}
                onMount={handleMount}
                theme="vs-dark"
                options={{
                  fontSize, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true, lineNumbers: 'on',
                  minimap: { enabled: minimap },
                  wordWrap: wordWrap ? 'on' : 'off',
                  scrollBeyondLastLine: false, automaticLayout: true,
                  tabSize: 2, renderWhitespace: 'selection',
                  bracketPairColorization: { enabled: true },
                  padding: { top: 16, bottom: 16 },
                  smoothScrolling: true, cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                }}
              />
            </div>
            {splitView && (note.language === 'json' || note.language === 'yaml') && (
              <div className="w-1/2 border-l border-border overflow-hidden bg-surface">
                <JsonTreeView content={note.content} language={note.language} />
              </div>
            )}
          </div>
        )}
      </div>

      {versionPanel && (
        <div className="w-64 border-l border-border bg-sidebar overflow-y-auto shrink-0">
          <div className="p-3 border-b border-border">
            <h3 className="text-[10px] font-semibold text-muted uppercase tracking-wider">Version History</h3>
          </div>
          {versions.length === 0 ? (
            <div className="p-4 text-xs text-muted text-center">No versions yet</div>
          ) : (
            <div className="py-1">
              {[...versions].reverse().map((v, i) => {
                const idx = versions.length - 1 - i;
                const isCurrent = idx === versions.length - 1;
                const time = new Date(v.timestamp);
                return (
                  <div
                    key={v.timestamp}
                    className={`px-3 py-2 border-l-2 ${
                      isCurrent ? 'border-accent bg-accent-muted' : 'border-transparent hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' '}&middot;{' '}
                        {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      {isCurrent && <span className="text-[9px] text-accent">current</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {v.content.slice(0, 80) || '(empty)'}
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => handleRestoreVersion(v.content)}
                        className="text-[10px] text-accent hover:text-accent-hover mt-1 transition-colors"
                      >
                        Restore this version
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
