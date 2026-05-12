import { Macro } from './macros';
import { parseBraceArgs } from './parseArgs';

// Simple patterns without nested braces
const SIMPLE_PATTERNS: RegExp[] = [
  /\\documentclass(\[[^\]]*\])?\{[^}]*\}/g,
  /\\usepackage(\[[^\]]*\])?\{[^}]*\}/g,
  /\\input\{[^}]*\}/g,
  /\\begin\{document\}/g,
  /\\end\{document\}/g,
  /\\pagestyle\{[^}]*\}/g,
  /\\setlength\{[^}]*\}\{[^}]*\}/g,
  /\\urlstyle\{[^}]*\}/g,
  /\\raggedbottom/g,
  /\\raggedright/g,
  /\\pdfgentounicode=\d+/g,
  /^%.*$/gm,
];

function skipBalancedBraces(src: string, start: number): number {
  if (src[start] !== '{') return start;
  let depth = 1;
  let i = start + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '\\' && i + 1 < src.length) {
      i += 2;
      continue;
    }
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    if (depth > 0) i++;
  }
  return i + 1;
}

function stripNewcommand(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const ncMatch = /^\\(newcommand|renewcommand|def)\{/.exec(src.slice(i));
    if (!ncMatch) {
      out += src[i++];
      continue;
    }
    // Found \newcommand{ or \renewcommand{ or \def{
    i += ncMatch[0].length;
    // Skip the command name braces
    const nameEnd = src.indexOf('}', i);
    if (nameEnd === -1) break;
    i = nameEnd + 1;
    // Skip optional arg count [N] if present
    if (src[i] === '[') {
      const optEnd = src.indexOf(']', i);
      if (optEnd !== -1) i = optEnd + 1;
    }
    // Skip the body (balanced braces)
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] === '{') {
      i = skipBalancedBraces(src, i);
    }
  }
  return out;
}

export function stripPreamble(src: string): string {
  let out = src;
  // Apply simple patterns first
  for (const pat of SIMPLE_PATTERNS) {
    out = out.replace(pat, '');
  }
  // Then handle newcommand/renewcommand with nested braces
  out = stripNewcommand(out);
  return out;
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
    // match command name
    const m = /^\\([a-zA-Z]+)\*?/.exec(src.slice(i));
    if (!m) {
      // \\ → line break,  \{ \} → literal braces, etc.
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
      // unknown command — skip it
      i += m[0].length;
      continue;
    }
    const parsed = parseBraceArgs(src, i + m[0].length, macro.argCount);
    if (!parsed) {
      i += m[0].length;
      continue;
    }
    out += macro.render(parsed.args, (s) => expandMacros(s, macros));
    i = parsed.end;
  }
  return out;
}
