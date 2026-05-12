'use client';

import { useMemo } from 'react';
import katex from 'katex';

interface LatexPreviewProps {
  content: string;
}

function renderLatexBlock(block: string): string {
  // Remove common LaTeX preamble/package lines
  const lines = block.split('\n').filter((line) => {
    const t = line.trim();
    if (!t) return true;
    if (t.startsWith('\\documentclass')) return false;
    if (t.startsWith('\\usepackage')) return false;
    if (t.startsWith('\\title{')) return false;
    if (t.startsWith('\\author{')) return false;
    if (t.startsWith('\\date{')) return false;
    if (t.startsWith('\\maketitle')) return true;
    if (t === '\\begin{document}') return false;
    if (t === '\\end{document}') return false;
    return true;
  });

  let html = lines.join('\n');

  // Render display math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="latex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<div class="latex-display latex-error">$$${math}$$</div>`;
    }
  });

  // Render inline math $...$
  html = html.replace(/\$([^$]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${math}$`;
    }
  });

  // Render \(...\) math
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `\\(${math}\\)`;
    }
  });

  // Render \[...\] math
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return `<div class="latex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<div class="latex-display latex-error">\\[${math}\\]</div>`;
    }
  });

  // Render sections
  html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="latex-section">$1</h2>');
  html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="latex-subsection">$1</h3>');
  html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="latex-subsubsection">$1</h4>');

  // Render text formatting
  html = html.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
  html = html.replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>');

  // Render \maketitle as a header
  html = html.replace(/\\maketitle/g, '');

  // Line breaks
  html = html.replace(/\\\\/g, '<br />');

  // Wrap paragraphs (double newlines)
  const paragraphs = html.split(/\n\n+/);
  return paragraphs.map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h2') || trimmed.startsWith('<h3') || trimmed.startsWith('<h4') || trimmed.startsWith('<div class="latex-display"')) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');
}

export default function LatexPreview({ content }: LatexPreviewProps) {
  const html = useMemo(() => renderLatexBlock(content), [content]);

  if (!content.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center bg-editor text-muted text-sm">
        No LaTeX content to preview
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto bg-editor px-6 py-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
