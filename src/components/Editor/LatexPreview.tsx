'use client';

import { useMemo } from 'react';
import katex from 'katex';

interface LatexPreviewProps {
  content: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLatexToHtml(source: string): string {
  let text = source;

  // Protect math blocks from other processing
  const mathBlocks: string[] = [];
  let idx = 0;

  // Display math $$...$$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const token = `\u0000MATH${idx}\u0000`;
    try {
      mathBlocks[idx] = `<div class="latex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      mathBlocks[idx] = `<div class="latex-display latex-error">$$${escapeHtml(math)}$</div>`;
    }
    idx++;
    return token;
  });

  // Inline math $...$
  text = text.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    const token = `\u0000MATH${idx}\u0000`;
    try {
      mathBlocks[idx] = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      mathBlocks[idx] = `<span class="latex-error">$${escapeHtml(math)}$</span>`;
    }
    idx++;
    return token;
  });

  // \[...\] display math
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    const token = `\u0000MATH${idx}\u0000`;
    try {
      mathBlocks[idx] = `<div class="latex-display">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      mathBlocks[idx] = `<div class="latex-display latex-error">\\[${escapeHtml(math)}\\]</div>`;
    }
    idx++;
    return token;
  });

  // \(...\) inline math
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    const token = `\u0000MATH${idx}\u0000`;
    try {
      mathBlocks[idx] = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      mathBlocks[idx] = `<span class="latex-error">\\(${escapeHtml(math)}\\)</span>`;
    }
    idx++;
    return token;
  });

  // Strip preamble lines (keep their content but don't render as text)
  text = text
    .replace(/^\\documentclass\{[^}]*\}/gm, '')
    .replace(/^\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/gm, '')
    .replace(/^\\title\{([^}]*)\}/gm, '')
    .replace(/^\\author\{([^}]*)\}/gm, '')
    .replace(/^\\date\{([^}]*)\}/gm, '');

  // Strip \begin{document} / \end{document}
  text = text.replace(/\\begin\{document\}/g, '').replace(/\\end\{document\}/g, '');

  // Headings
  text = text.replace(/\\section\*?\{([^}]*)\}/g, '<h2 class="latex-section">$1</h2>');
  text = text.replace(/\\subsection\*?\{([^}]*)\}/g, '<h3 class="latex-subsection">$1</h3>');
  text = text.replace(/\\subsubsection\*?\{([^}]*)\}/g, '<h4 class="latex-subsubsection">$1</h4>');

  // Text formatting (handle up to 2 levels of nesting)
  text = text.replace(/\\textbf\{((?:[^{}]|\{[^{}]*\})*)\}/g, '<strong>$1</strong>');
  text = text.replace(/\\textit\{((?:[^{}]|\{[^{}]*\})*)\}/g, '<em>$1</em>');
  text = text.replace(/\\texttt\{((?:[^{}]|\{[^{}]*\})*)\}/g, '<code class="latex-tt">$1</code>');
  text = text.replace(/\\emph\{((?:[^{}]|\{[^{}]*\})*)\}/g, '<em>$1</em>');
  text = text.replace(/\\underline\{((?:[^{}]|\{[^{}]*\})*)\}/g, '<u>$1</u>');

  // Lists
  text = text.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, inner) => {
    const items = inner.replace(/\\item\s*/g, '<li>').replace(/(?<=<\/li>)\s*(?=<li>)/g, '');
    return `<ul class="latex-list">${items}</ul>`;
  });
  text = text.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, inner) => {
    const items = inner.replace(/\\item\s*/g, '<li>').replace(/(?<=<\/li>)\s*(?=<li>)/g, '');
    return `<ol class="latex-list">${items}</ol>`;
  });

  // Line breaks
  text = text.replace(/\\\\/g, '<br />');

  // escape remaining HTML-like content
  text = text.replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;');
  text = text.replace(/</g, '&lt;');
  text = text.replace(/>/g, '&gt;');

  // Put math blocks back
  mathBlocks.forEach((block, i) => {
    text = text.replace(`\u0000MATH${i}\u0000`, block);
  });

  // Wrap paragraphs — split on double newlines
  const paragraphs = text.split(/\n\s*\n/);
  const html = paragraphs.map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    // Don't wrap headings, display math, or lists in <p>
    if (/^<(h[234]|div|ul|ol)/.test(trimmed)) return trimmed;
    return `<p>${trimmed}</p>`;
  });

  return html.join('\n');
}

export default function LatexPreview({ content }: LatexPreviewProps) {
  const html = useMemo(() => renderLatexToHtml(content), [content]);

  return (
    <div className="flex-1 overflow-auto bg-editor px-6 py-5 text-sm leading-6 text-foreground">
      {!content.trim() ? (
        <div className="flex items-center justify-center h-full text-muted">
          No LaTeX content to preview
        </div>
      ) : (
        <div
          className="latex-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
