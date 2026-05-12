import type { Note } from '@/types';

const EXTENSION_MAP: Record<string, string> = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  go: '.go',
  rust: '.rs',
  sql: '.sql',
  bash: '.sh',
  json: '.json',
  yaml: '.yaml',
  toml: '.toml',
  markdown: '.md',
  latex: '.tex',
  plaintext: '.txt',
  url: '.txt',
};

const MARKDOWN_TICK = String.fromCharCode(96);
const CODE_FENCE = MARKDOWN_TICK.repeat(3);
const INLINE_CODE_PATTERN = new RegExp(MARKDOWN_TICK + '([^' + MARKDOWN_TICK + ']+)' + MARKDOWN_TICK, 'g');

const PDF_PRINT_STYLES = [
  '@page { margin: 0.75in; }',
  'body { color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 13px; line-height: 1.6; }',
  'h1 { border-bottom: 1px solid #d1d5db; font-size: 20px; margin: 0 0 16px; padding-bottom: 8px; }',
  '.meta { color: #6b7280; font-size: 10px; margin-bottom: 18px; text-transform: uppercase; }',
  '.markdown-body > :first-child { margin-top: 0; }',
  '.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { line-height: 1.3; margin: 18px 0 8px; }',
  '.markdown-body h1 { font-size: 22px; }',
  '.markdown-body h2 { border-bottom: 1px solid #e5e7eb; font-size: 18px; padding-bottom: 4px; }',
  '.markdown-body h3 { font-size: 15px; }',
  '.markdown-body p, .markdown-body ul, .markdown-body ol, .markdown-body blockquote, .markdown-body table, .markdown-body pre { margin: 10px 0; }',
  '.markdown-body ul, .markdown-body ol { padding-left: 22px; }',
  '.markdown-body blockquote { border-left: 3px solid #d1d5db; color: #4b5563; padding-left: 12px; }',
  '.markdown-body table { border-collapse: collapse; width: 100%; }',
  '.markdown-body th, .markdown-body td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }',
  '.markdown-body th { background: #f3f4f6; }',
  '.markdown-body img { max-width: 100%; }',
  '.markdown-body a { color: #1d4ed8; }',
  '.markdown-body :not(pre) > code { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 0.9em; padding: 1px 4px; }',
  '.plain-text, .code-block { background: #f8fafc; border: 1px solid #d1d5db; border-radius: 8px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 11px; margin: 10px 0; overflow: hidden; page-break-inside: avoid; padding: 12px; white-space: pre-wrap; word-break: break-word; }',
  '.code-block code { display: block; white-space: pre-wrap; }',
  '.code-language { border-bottom: 1px solid #e5e7eb; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; margin: -2px -2px 10px; padding-bottom: 8px; text-transform: uppercase; }',
].join('\n');

export function exportNote(note: Note) {
  const ext = EXTENSION_MAP[note.language] || '.txt';
  const fileName = (note.title || 'note').replace(/[^a-zA-Z0-9_-]/g, '_') + ext;
  const blob = new Blob([note.content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, fileName);
}

export function exportNoteAsPdf(note: Note) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Allow pop-ups to export this note as PDF.');
    return;
  }

  const bodyHtml = renderNoteForPdf(note);
  printWindow.document.write(createPdfDocument(note, bodyHtml));
  printWindow.document.close();
}

export function renderNoteForPdf(note: Note): string {
  if (note.language === 'markdown') {
    return renderMarkdownForPdf(note.content);
  }

  if (isCodeLanguage(note.language)) {
    return renderCodeForPdf(note.content, note.language);
  }

  return `<pre class="plain-text">${escapeHtml(note.content)}</pre>`;
}

function renderMarkdownForPdf(content: string): string {
  return renderMarkdownBlocks(content.replace(/\r\n?/g, '\n').split('\n'));
}

function renderCodeForPdf(content: string, language: string): string {
  return `<pre class="code-block"><div class="code-language">${escapeHtml(getLanguageLabel(language))}</div><code>${escapeHtml(content)}</code></pre>`;
}

function createPdfDocument(note: Note, bodyHtml: string): string {
  const title = note.title || 'Untitled note';
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}.pdf</title>
    <style>
${PDF_PRINT_STYLES}
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${escapeHtml(note.language)} &middot; ${new Date(note.updatedAt).toLocaleString()}</div>
    <main class="markdown-body">${bodyHtml}</main>
    <script>
      window.addEventListener('load', () => {
        window.print();
      });
    </script>
  </body>
</html>`;
}

export async function exportAllNotes(notes: Note[]) {
  const { default: JSZip } = await import('jszip');

  const zip = new JSZip();
  for (const note of notes) {
    const ext = EXTENSION_MAP[note.language] || '.txt';
    const fileName = (note.title || 'note').replace(/[^a-zA-Z0-9_-]/g, '_') + ext;
    zip.file(fileName, note.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `notehub-export-${new Date().toISOString().slice(0, 10)}.zip`);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderMarkdownBlocks(lines: string[]): string {
  const html: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index++;
      continue;
    }

    const codeLanguage = getCodeFenceLanguage(trimmed);
    if (codeLanguage !== null) {
      const codeLines: string[] = [];
      index++;
      while (index < lines.length && !lines[index].trim().startsWith(CODE_FENCE)) {
        codeLines.push(lines[index]);
        index++;
      }
      if (index < lines.length) index++;
      html.push(renderCodeForPdf(codeLines.join('\n'), codeLanguage || 'code'));
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 6);
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      index++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      html.push('<hr />');
      index++;
      continue;
    }

    if (isTableStart(lines, index)) {
      const table = renderTable(lines, index);
      html.push(table.html);
      index = table.nextIndex;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index++;
      }
      html.push(`<blockquote>${renderMarkdownBlocks(quoteLines)}</blockquote>`);
      continue;
    }

    if (/^\s*(?:[-*+]|\d+\.)\s+/.test(line)) {
      const list = renderList(lines, index);
      html.push(list.html);
      index = list.nextIndex;
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !isMarkdownBlockStart(lines, index)) {
      paragraph.push(lines[index].trim());
      index++;
    }
    html.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}

function renderList(lines: string[], startIndex: number): { html: string; nextIndex: number } {
  const ordered = /^\s*\d+\.\s+/.test(lines[startIndex]);
  const tag = ordered ? 'ol' : 'ul';
  const items: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const match = lines[index].match(/^\s*(?:[-*+]|\d+\.)\s+(.+)$/);
    if (!match) break;

    const isOrderedItem = /^\s*\d+\.\s+/.test(lines[index]);
    if (isOrderedItem !== ordered) break;

    items.push(`<li>${renderInlineMarkdown(match[1])}</li>`);
    index++;
  }

  return { html: `<${tag}>${items.join('')}</${tag}>`, nextIndex: index };
}

function renderTable(lines: string[], startIndex: number): { html: string; nextIndex: number } {
  const headers = splitTableRow(lines[startIndex]);
  const rows: string[][] = [];
  let index = startIndex + 2;

  while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
    rows.push(splitTableRow(lines[index]));
    index++;
  }

  const head = headers.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`)
    .join('');

  return {
    html: `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
    nextIndex: index,
  };
}

function splitTableRow(row: string): string[] {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isTableStart(lines: string[], index: number): boolean {
  return Boolean(
    lines[index]?.includes('|') &&
    lines[index + 1] &&
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])
  );
}

function isMarkdownBlockStart(lines: string[], index: number): boolean {
  const trimmed = lines[index].trim();
  return Boolean(
    trimmed.startsWith(CODE_FENCE) ||
    /^(#{1,6})\s+/.test(trimmed) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed) ||
    /^>\s?/.test(trimmed) ||
    /^\s*(?:[-*+]|\d+\.)\s+/.test(lines[index]) ||
    isTableStart(lines, index)
  );
}

function renderInlineMarkdown(text: string): string {
  const codeTokens: string[] = [];
  let html = text.replace(INLINE_CODE_PATTERN, (_, code: string) => {
    const token = `\u0000CODE${codeTokens.length}\u0000`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  html = escapeHtml(html)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (match, alt: string, url: string) => {
      const safeUrl = sanitizeUrl(url);
      return safeUrl ? `<img src="${escapeAttribute(safeUrl)}" alt="${alt}" />` : match;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (match, label: string, url: string) => {
      const safeUrl = sanitizeUrl(url);
      return safeUrl ? `<a href="${escapeAttribute(safeUrl)}">${label}</a>` : label;
    })
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  codeTokens.forEach((code, index) => {
    html = html.replace(`\u0000CODE${index}\u0000`, code);
  });

  return html;
}

function sanitizeUrl(url: string): string | null {
  const normalized = url.trim().replace(/&amp;/g, '&');
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(normalized)) {
    return normalized;
  }
  return null;
}

function getCodeFenceLanguage(trimmed: string): string | null {
  if (!trimmed.startsWith(CODE_FENCE)) return null;
  return trimmed.slice(CODE_FENCE.length).trim();
}

function isCodeLanguage(language: string): boolean {
  return Boolean(EXTENSION_MAP[language] && !['markdown', 'plaintext', 'url'].includes(language));
}

function getLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    go: 'Go',
    rust: 'Rust',
    sql: 'SQL',
    bash: 'Bash',
    json: 'JSON',
    yaml: 'YAML',
    toml: 'TOML',
    markdown: 'Markdown',
    latex: 'LaTeX',
  };
  return labels[language] || language;
}

export async function importFile(file: File): Promise<{ content: string; language: string; title: string }> {
  const { detectLanguage } = await import('@/lib/detect');
  const content = await file.text();
  const language = detectLanguage(content);
  const title = (content.split('\n')[0]?.trim() || file.name).slice(0, 60);
  return { content, language, title };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).split(MARKDOWN_TICK).join('&#96;');
}
