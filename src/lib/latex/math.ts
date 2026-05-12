import katex from 'katex';

export function renderMath(html: string): string {
  // Order matters: longest delimiters first
  // Display math: \[...\] and $$...$$
  html = html.replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => tryRender(m, true));
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => tryRender(m, true));
  // Inline math: $...$ (not escaped)
  html = html.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (_, m) => tryRender(m, false));
  return html;
}

function tryRender(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
    });
  } catch {
    return `<span class="latex-error">${escape(math)}</span>`;
  }
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
