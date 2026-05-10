'use client';

import { useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { WrapText, Map, Minus, Plus, Braces, Copy, Check, FileJson, Columns2, Eye, Download } from 'lucide-react';
import type { Note } from '@/types';
import { prettifyJson, minifyJson, validateJson, yamlToJson, jsonToYaml, validateYaml } from '@/lib/formatters';
import { exportNote, exportNoteAsPdf } from '@/lib/export';

const LANGUAGES = [
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'SQL', value: 'sql' },
  { label: 'Bash', value: 'bash' },
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'TOML', value: 'toml' },
  { label: 'Markdown', value: 'markdown' },
];

interface ToolbarProps {
  note: Note;
  wordWrap: boolean;
  setWordWrap: (v: boolean) => void;
  minimap: boolean;
  setMinimap: (v: boolean) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  splitView: boolean;
  setSplitView: (v: boolean) => void;
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;
}

export default function Toolbar(props: ToolbarProps) {
  const { note, wordWrap, setWordWrap, minimap, setMinimap, fontSize } = props;
  const { setFontSize, splitView, setSplitView, previewMode, setPreviewMode } = props;
  const { updateNote } = useNoteStore();
  const [copied, setCopied] = useState('');

  const handleCopy = (type: string) => {
    let text = note.content;
    if (type === 'formatted' && note.language === 'json') text = prettifyJson(note.content);
    if (type === 'minified' && note.language === 'json') text = minifyJson(note.content);
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 1500);
  };

  const handlePrettify = () => {
    if (note.language === 'json') {
      updateNote(note.id, { content: prettifyJson(note.content) });
    }
  };

  const handleMinify = () => {
    if (note.language === 'json') {
      updateNote(note.id, { content: minifyJson(note.content) });
    }
  };

  const handleValidate = () => {
    if (note.language === 'json') {
      const result = validateJson(note.content);
      alert(result.valid ? 'JSON is valid' : `JSON Error: ${result.error}`);
    } else if (note.language === 'yaml') {
      const result = validateYaml(note.content);
      alert(result.valid ? 'YAML looks valid' : `YAML Warning: ${result.error}`);
    }
  };

  const isJson = note.language === 'json';
  const isYaml = note.language === 'yaml';
  const isMarkdown = note.language === 'markdown';

  return (
    <div className="flex-1 h-8 flex items-center gap-1 px-3 border-b border-border bg-surface-secondary shrink-0 overflow-x-auto">
      <select
        value={note.language}
        onChange={(e) => updateNote(note.id, { language: e.target.value })}
        className="bg-surface-tertiary text-[11px] text-foreground rounded px-2 py-1 outline-none border border-border cursor-pointer hover:border-accent transition-colors"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      <div className="w-px h-4 bg-border mx-1" />

      {isJson && (
        <>
          <button onClick={handlePrettify} className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Prettify JSON">
            <Braces size={14} />
          </button>
          <button onClick={handleMinify} className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Minify JSON">
            <FileJson size={14} />
          </button>
          <button onClick={handleValidate} className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Validate JSON">
            <span className="text-[11px]">&#10003;</span>
          </button>
          <button onClick={() => handleCopy('formatted')} className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Copy formatted">
            {copied === 'formatted' ? <Check size={14} className="text-green-400 animate-checkmark" /> : <Copy size={14} />}
          </button>
          <button onClick={() => handleCopy('minified')} className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Copy minified">
            {copied === 'minified' ? <Check size={14} className="text-green-400 animate-checkmark" /> : <Copy size={14} />}
          </button>
          <button onClick={() => updateNote(note.id, { content: jsonToYaml(note.content), language: 'yaml' })} className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Convert to YAML">
            <span className="text-[10px]">YML</span>
          </button>
          <div className="w-px h-4 bg-border mx-1" />
        </>
      )}

      {isYaml && (
        <>
          <button onClick={handleValidate} className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Validate YAML">
            <span className="text-[11px]">&#10003;</span>
          </button>
          <button onClick={() => updateNote(note.id, { content: yamlToJson(note.content), language: 'json' })} className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Convert to JSON">
            <Braces size={14} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
        </>
      )}

      {(isJson || isYaml) && (
        <button
          onClick={() => setSplitView(!splitView)}
          className={`p-1 rounded transition-colors ${splitView ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
          title="Toggle tree view"
        >
          <Columns2 size={14} />
        </button>
      )}

      {isMarkdown && (
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`p-1 rounded transition-colors ${previewMode ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
          title="Toggle preview"
        >
          <Eye size={14} />
        </button>
      )}

      <div className="w-px h-4 bg-border mx-1" />

      <button
        onClick={() => setWordWrap(!wordWrap)}
        className={`p-1 rounded transition-colors ${wordWrap ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
        title="Toggle word wrap"
      >
        <WrapText size={14} />
      </button>

      <button
        onClick={() => setMinimap(!minimap)}
        className={`p-1 rounded transition-colors ${minimap ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
        title="Toggle minimap"
      >
        <Map size={14} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <select
          value=""
          onChange={(e) => {
            if (e.target.value === 'same-format') exportNote(note);
            if (e.target.value === 'pdf') exportNoteAsPdf(note);
            e.target.value = '';
          }}
          className="h-6 max-w-[132px] rounded border border-border bg-surface-tertiary px-2 text-[11px] text-foreground outline-none hover:border-accent"
          aria-label="Download note"
          title="Download note"
        >
          <option value="">Download</option>
          <option value="same-format">Same format</option>
          <option value="pdf">PDF</option>
        </select>
        <Download size={13} className="text-muted" aria-hidden="true" />
        <button
          onClick={() => setFontSize(Math.max(10, fontSize - 2))}
          className="p-0.5 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Decrease font size"
        >
          <Minus size={12} />
        </button>
        <span className="text-[11px] text-muted-foreground min-w-[28px] text-center">{fontSize}px</span>
        <button
          onClick={() => setFontSize(Math.min(24, fontSize + 2))}
          className="p-0.5 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Increase font size"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}