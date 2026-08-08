'use client';

import { useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { WrapText, Map, Minus, Plus, Braces, Copy, Check, FileJson, Columns2, Eye, Download } from 'lucide-react';
import type { Note } from '@/types';
import { prettifyJson, minifyJson, validateJson, yamlToJson, jsonToYaml, validateYaml } from '@/lib/formatters';
import { LANGUAGES } from '@/lib/languages';

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
  const [validationMessage, setValidationMessage] = useState<{ valid: boolean; text: string } | null>(null);

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
    let result: { valid: boolean; error?: string } | null = null;
    if (note.language === 'json') {
      result = validateJson(note.content);
    } else if (note.language === 'yaml') {
      result = validateYaml(note.content);
    }
    if (!result) return;
    setValidationMessage({
      valid: result.valid,
      text: result.valid ? `${note.language.toUpperCase()} is valid` : `${note.language.toUpperCase()}: ${result.error}`,
    });
    setTimeout(() => setValidationMessage(null), 4000);
  };

  const isJson = note.language === 'json';
  const isYaml = note.language === 'yaml';
  const isMarkdown = note.language === 'markdown';
  const isLatex = note.language === 'latex';

  return (
    <div className="flex-1 min-w-0 h-9 flex items-center gap-1 px-2 sm:px-3 bg-surface-secondary shrink-0 overflow-x-auto">
      <select
        value={note.language}
        onChange={(e) => updateNote(note.id, { language: e.target.value })}
        className="h-7 bg-surface-tertiary text-[11px] text-foreground rounded px-2 outline-none border border-border cursor-pointer hover:border-accent transition-colors"
      >
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      <div className="w-px h-4 bg-border mx-1" />

      {isJson && (
        <>
          <button onClick={handlePrettify} className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Prettify JSON" aria-label="Prettify JSON">
            <Braces size={14} />
          </button>
          <button onClick={handleMinify} className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Minify JSON" aria-label="Minify JSON">
            <FileJson size={14} />
          </button>
          <button onClick={handleValidate} className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Validate JSON" aria-label="Validate JSON">
            <span className="text-[11px]">&#10003;</span>
          </button>
          <button onClick={() => handleCopy('formatted')} className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Copy formatted" aria-label="Copy formatted">
            {copied === 'formatted' ? <Check size={14} className="text-green-400 animate-checkmark" /> : <Copy size={14} />}
          </button>
          <button onClick={() => handleCopy('minified')} className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Copy minified" aria-label="Copy minified">
            {copied === 'minified' ? <Check size={14} className="text-green-400 animate-checkmark" /> : <Copy size={14} />}
          </button>
          <button onClick={() => updateNote(note.id, { content: jsonToYaml(note.content), language: 'yaml' })} className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Convert to YAML" aria-label="Convert to YAML">
            <span className="text-[10px]">YML</span>
          </button>
          <div className="w-px h-4 bg-border mx-1" />
        </>
      )}

      {isYaml && (
        <>
          <button onClick={handleValidate} className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Validate YAML" aria-label="Validate YAML">
            <span className="text-[11px]">&#10003;</span>
          </button>
          <button onClick={() => updateNote(note.id, { content: yamlToJson(note.content), language: 'json' })} className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors" title="Convert to JSON" aria-label="Convert to JSON">
            <Braces size={14} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
        </>
      )}

      {(isJson || isYaml) && (
        <button
          onClick={() => setSplitView(!splitView)}
           className={`min-w-7 min-h-7 flex items-center justify-center rounded transition-colors ${splitView ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
          title="Toggle tree view"
        >
          <Columns2 size={14} />
        </button>
      )}

      {(isMarkdown || isLatex) && (
        <button
          onClick={() => setPreviewMode(!previewMode)}
           className={`min-w-7 min-h-7 flex items-center justify-center rounded transition-colors ${previewMode ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
          title="Toggle preview"
        >
          <Eye size={14} />
        </button>
      )}

      <div className="w-px h-4 bg-border mx-1" />

      <button
        onClick={() => setWordWrap(!wordWrap)}
        className={`min-w-7 min-h-7 flex items-center justify-center rounded transition-colors ${wordWrap ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
        title="Toggle word wrap"
      >
        <WrapText size={14} />
      </button>

      <button
        onClick={() => setMinimap(!minimap)}
        className={`min-w-7 min-h-7 flex items-center justify-center rounded transition-colors ${minimap ? 'text-accent bg-accent-muted' : 'text-muted hover:text-foreground hover:bg-surface-hover'}`}
        title="Toggle minimap"
      >
        <Map size={14} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <div className="relative inline-flex items-center">
          <Download size={12} className="absolute left-2 text-muted pointer-events-none" aria-hidden="true" />
          <select
            value=""
            onChange={(e) => {
              const action = e.target.value;
              if (action) {
                import('@/lib/export').then((m) => {
                  if (action === 'same-format') m.exportNote(note);
                  else if (action === 'pdf') m.exportNoteAsPdf(note);
                });
              }
              e.target.value = '';
            }}
            className="h-6 rounded border border-border bg-surface-tertiary pl-6 pr-2 text-[11px] text-foreground outline-none hover:border-accent cursor-pointer"
            aria-label="Download note"
            title="Download note"
          >
            <option value="">Download</option>
            <option value="same-format">Same format</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        {validationMessage && (
          <span role="status" className={`max-w-32 sm:max-w-52 truncate text-[10px] ${validationMessage.valid ? 'text-green-400' : 'text-red-400'}`}>
            {validationMessage.text}
          </span>
        )}
        <button
          onClick={() => setFontSize(Math.max(10, fontSize - 2))}
          className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Decrease font size"
        >
          <Minus size={12} />
        </button>
        <span className="text-[11px] text-muted-foreground min-w-[28px] text-center">{fontSize}px</span>
        <button
          onClick={() => setFontSize(Math.min(24, fontSize + 2))}
          className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title="Increase font size"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
