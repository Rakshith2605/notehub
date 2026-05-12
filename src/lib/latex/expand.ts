import { Macro } from './macros';
import { parseBraceArgs } from './parseArgs';

function extractDocumentBody(src: string): string {
  const docMatch = src.match(/\\begin\{document\}([\s\S]*)\\end\{document\}/);
  if (docMatch) {
    return docMatch[1];
  }
  return src;
}

function skipBalancedBraces(src: string, start: number): number {
  if (src[start] !== '{') return start;
  let depth = 1;
  let i = start + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '\\' && i + 1 < src.length) { i += 2; continue; }
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    if (depth > 0) i++;
  }
  return i + 1;
}

// Strip newcommand/renewcommand with nested braces - processes character by character
function stripCommandDefs(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    if (src[i] !== '\\') {
      out += src[i++];
      continue;
    }
    // Check for command definition keywords
    const kwMatch = /^\\(?:newcommand|renewcommand|def)\b/.exec(src.slice(i));
    if (!kwMatch) {
      out += src[i++];
      continue;
    }
    // Found a command definition - skip it entirely
    i += kwMatch[0].length;
    // Skip optional [N] argument
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] === '[') {
      let j = i + 1;
      while (j < src.length && src[j] !== ']') {
        if (src[j] === '\\' && j + 1 < src.length) j += 2;
        else j++;
      }
      i = j + 1;
    }
    // Skip the body (balanced braces)
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] === '{') {
      i = skipBalancedBraces(src, i);
    }
  }
  return out;
}

// Strip common preamble-only commands from body
function stripPreambleCommands(src: string): string {
  return src
    // Comments
    .replace(/^%.*$/gm, '')
    // Standalone commands
    .replace(/\\pagebreak/g, '')
    .replace(/\\newpage/g, '')
    .replace(/\\clearpage/g, '')
    // Paragraph formatting
    .replace(/\\paragraph\{[^}]*\}/g, '')
    .replace(/\\subparagraph\{[^}]*\}/g, '')
    // Section formatting commands that leak through
    .replace(/\\titleformat\{[^}]*\}\{[^}]*\}\{[^}]*\}\{[^}]*\}\{[^}]*\}\{[^}]*\}/g, '')
    // Spacing commands \[...\]
    .replace(/\\\[\d+pt?\]/g, '')
    .replace(/\\\[([\s\S]*?)\\\]/g, '')
    // itemize with optional args
    .replace(/\\begin\{itemize\}(?:\[[^\]]*\])?/g, '')
    .replace(/\\end\{itemize\}/g, '')
    // center
    .replace(/\\begin\{center\}/g, '')
    .replace(/\\end\{center\}/g, '');
}

export function stripPreamble(src: string): string {
  // First: extract only the document body (everything between \begin{document} and \end{document})
  const body = extractDocumentBody(src);
  // Second: strip any remaining preamble commands that leak through
  const cleaned = stripPreambleCommands(body);
  // Third: strip command definitions (newcommand, etc.)
  return stripCommandDefs(cleaned);
}

export function expandMacros(src: string, macros: Macro[]): string {
  const byName = new Map(macros.map(m => [m.name, m]));
  let out = '';
  let i = 0;
  while (i < src.length) {
    if (src[i] !== '\\') {
      out += src[i++];
      continue;
    }
    const m = /^\\([a-zA-Z]+)\*?/.exec(src.slice(i));
    if (!m) {
      if (src[i + 1] === '\\') { out += '<br/>'; i += 2; continue; }
      if (src[i + 1] === '{') { out += '{'; i += 2; continue; }
      if (src[i + 1] === '}') { out += '}'; i += 2; continue; }
      if (src[i + 1] === '$') { out += '$'; i += 2; continue; }
      if (src[i + 1] === '&') { out += '&amp;'; i += 2; continue; }
      if (src[i + 1] === '%') { out += '%'; i += 2; continue; }
      out += src[i++];
      continue;
    }
    const cmd = m[1];
    const macro = byName.get(cmd);
    if (!macro) {
      out += src[i++];
      continue;
    }
    const parsed = parseBraceArgs(src, i + m[0].length, macro.argCount);
    if (!parsed) {
      out += src[i++];
      continue;
    }
    out += macro.render(parsed.args, (s) => expandMacros(s, macros));
    i = parsed.end;
  }
  return out;
}
