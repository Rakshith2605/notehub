'use client';

import { Fragment, useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexPreviewProps {
  content: string;
}

type Segment =
  | { type: 'text'; parts: InlinePart[] }
  | { type: 'inline-math'; math: string }
  | { type: 'display-math'; math: string }
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'list-start'; ordered: boolean }
  | { type: 'list-end' }
  | { type: 'list-item'; parts: InlinePart[] }
  | { type: 'hr' };

type InlinePart =
  | { kind: 'text'; text: string }
  | { kind: 'math'; math: string }
  | { kind: 'bold'; parts: InlinePart[] }
  | { kind: 'italic'; parts: InlinePart[] }
  | { kind: 'teletype'; text: string }
  | { kind: 'underline'; text: string };

function parseInline(source: string): InlinePart[] {
  const mathTokens: string[] = [];
  let safe = source;

  // Protect $...$ inline math first
  safe = safe.replace(/\$([^$\n]+?)\$/g, (_, m) => {
    mathTokens.push(m.trim());
    return `\u0000IM${mathTokens.length - 1}\u0000`;
  });
  safe = safe.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => {
    mathTokens.push(m.trim());
    return `\u0000IM${mathTokens.length - 1}\u0000`;
  });

  const parts: InlinePart[] = [];
  let remaining = safe;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\\textbf\{/);
    if (boldMatch) {
      const inner = extractBraced(remaining.slice(boldMatch[0].length));
      remaining = inner.rest;
      parts.push({ kind: 'bold', parts: parseInline(inner.content) });
      continue;
    }
    const italicMatch = remaining.match(/^\\textit\{/);
    if (italicMatch) {
      const inner = extractBraced(remaining.slice(italicMatch[0].length));
      remaining = inner.rest;
      parts.push({ kind: 'italic', parts: parseInline(inner.content) });
      continue;
    }
    const emphMatch = remaining.match(/^\\emph\{/);
    if (emphMatch) {
      const inner = extractBraced(remaining.slice(emphMatch[0].length));
      remaining = inner.rest;
      parts.push({ kind: 'italic', parts: parseInline(inner.content) });
      continue;
    }
    const ttMatch = remaining.match(/^\\texttt\{/);
    if (ttMatch) {
      const inner = extractBraced(remaining.slice(ttMatch[0].length));
      remaining = inner.rest;
      parts.push({ kind: 'teletype', text: inner.content });
      continue;
    }
    const ulMatch = remaining.match(/^\\underline\{/);
    if (ulMatch) {
      const inner = extractBraced(remaining.slice(ulMatch[0].length));
      remaining = inner.rest;
      parts.push({ kind: 'underline', text: inner.content });
      continue;
    }
    const mathMatch = remaining.match(/^\u0000IM(\d+)\u0000/);
    if (mathMatch) {
      parts.push({ kind: 'math', math: mathTokens[parseInt(mathMatch[1])] });
      remaining = remaining.slice(mathMatch[0].length);
      continue;
    }

    const nextSpecial = remaining.search(/(\\textbf\{|\\textit\{|\\emph\{|\\texttt\{|\\underline\{|\u0000IM)/);
    if (nextSpecial === -1) {
      parts.push({ kind: 'text', text: remaining });
      remaining = '';
    } else {
      parts.push({ kind: 'text', text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

function extractBraced(source: string): { content: string; rest: string } {
  let depth = 1;
  let i = 0;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  return { content: source.slice(0, i - 1), rest: source.slice(i) };
}

function RenderInline({ parts }: { parts: InlinePart[] }) {
  return (
    <>
      {parts.map((p, i) => {
        switch (p.kind) {
          case 'text':
            return <Fragment key={i}>{p.text}</Fragment>;
          case 'math':
            return <InlineMath key={i} math={p.math} />;
          case 'bold':
            return <strong key={i}><RenderInline parts={p.parts} /></strong>;
          case 'italic':
            return <em key={i}><RenderInline parts={p.parts} /></em>;
          case 'teletype':
            return <code key={i} className="latex-tt">{p.text}</code>;
          case 'underline':
            return <u key={i}>{p.text}</u>;
        }
      })}
    </>
  );
}

function parseLatex(source: string): Segment[] {
  const segments: Segment[] = [];
  const mathTokens: string[] = [];

  let safe = source;

  // $$...$$ display math
  safe = safe.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => {
    mathTokens.push(m.trim());
    return `\u0000DM${mathTokens.length - 1}\u0000`;
  });
  // \[...\] display math
  safe = safe.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => {
    mathTokens.push(m.trim());
    return `\u0000DM${mathTokens.length - 1}\u0000`;
  });

  // Strip preamble
  safe = safe
    .replace(/^\\documentclass\{[^}]*\}/gm, '')
    .replace(/^\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/gm, '')
    .replace(/^\\title\{[^}]*\}/gm, '')
    .replace(/^\\author\{[^}]*\}/gm, '')
    .replace(/^\\date\{[^}]*\}/gm, '');
  safe = safe.replace(/\\begin\{document\}/g, '').replace(/\\end\{document\}/g, '');

  const lines = safe.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) { i++; continue; }

    if (line === '\\begin{document}' || line === '\\end{document}') { i++; continue; }

    // Display math token
    const dmMatch = line.match(/^\u0000DM(\d+)\u0000$/);
    if (dmMatch) {
      segments.push({ type: 'display-math', math: mathTokens[parseInt(dmMatch[1])] });
      i++; continue;
    }

    // Headings
    const secMatch = line.match(/^\\section\*?\{([^}]*)\}/);
    if (secMatch) {
      segments.push({ type: 'heading', level: 2, text: secMatch[1] });
      i++; continue;
    }
    const subMatch = line.match(/^\\subsection\*?\{([^}]*)\}/);
    if (subMatch) {
      segments.push({ type: 'heading', level: 3, text: subMatch[1] });
      i++; continue;
    }
    const ssubMatch = line.match(/^\\subsubsection\*?\{([^}]*)\}/);
    if (ssubMatch) {
      segments.push({ type: 'heading', level: 4, text: ssubMatch[1] });
      i++; continue;
    }

    // itemize
    if (line === '\\begin{itemize}') {
      segments.push({ type: 'list-start', ordered: false });
      i++;
      while (i < lines.length && lines[i].trim() !== '\\end{itemize}') {
        const itemMatch = lines[i].trim().match(/^\\item\s+(.*)/);
        if (itemMatch) {
          segments.push({ type: 'list-item', parts: parseInline(itemMatch[1]) });
        }
        i++;
      }
      segments.push({ type: 'list-end' });
      i++; continue;
    }

    // enumerate
    if (line === '\\begin{enumerate}') {
      segments.push({ type: 'list-start', ordered: true });
      i++;
      while (i < lines.length && lines[i].trim() !== '\\end{enumerate}') {
        const itemMatch = lines[i].trim().match(/^\\item\s+(.*)/);
        if (itemMatch) {
          segments.push({ type: 'list-item', parts: parseInline(itemMatch[1]) });
        }
        i++;
      }
      segments.push({ type: 'list-end' });
      i++; continue;
    }

    // hr
    if (/^\\hrulefill?$/.test(line)) {
      segments.push({ type: 'hr' });
      i++; continue;
    }

    // Normal text with possible line breaks
    segments.push({ type: 'text', parts: parseInline(line.replace(/\\\\/g, '\n')) });
    i++;
  }

  return segments;
}

export default function LatexPreview({ content }: LatexPreviewProps) {
  const segments = useMemo(() => parseLatex(content), [content]);

  if (!content.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center bg-editor text-muted text-sm">
        No LaTeX content to preview
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-editor">
      <div className="max-w-[48rem] mx-auto px-6 py-5 text-sm leading-6 text-foreground latex-preview">
        {segments.map((seg, idx) => {
          switch (seg.type) {
            case 'display-math':
              return <BlockMath key={idx} math={seg.math} />;
            case 'heading':
              if (seg.level === 2) return <h2 key={idx} className="border-b border-border text-xl font-semibold pb-2 mt-7 mb-3">{seg.text}</h2>;
              if (seg.level === 3) return <h3 key={idx} className="text-base font-semibold mt-5 mb-2">{seg.text}</h3>;
              return <h4 key={idx} className="text-sm font-semibold mt-4 mb-1.5">{seg.text}</h4>;
            case 'list-start':
              return seg.ordered
                ? <ol key={idx} className="list-decimal pl-6 my-2.5 space-y-0.5" />
                : <ul key={idx} className="list-disc pl-6 my-2.5 space-y-0.5" />;
            case 'list-end':
              return null;
            case 'list-item':
              return <li key={idx}><RenderInline parts={seg.parts} /></li>;
            case 'hr':
              return <hr key={idx} className="border-border my-4" />;
            case 'text':
              return (
                <p key={idx} className="my-2">
                  {seg.parts.length > 0 ? (
                    <RenderInline parts={seg.parts} />
                  ) : (
                    seg.toString()
                  )}
                </p>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
