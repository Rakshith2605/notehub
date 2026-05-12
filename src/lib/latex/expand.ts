import { Macro } from './macros';
import { parseBraceArgs } from './parseArgs';

const PREAMBLE_PATTERNS: RegExp[] = [
  /\\documentclass(\[[^\]]*\])?\{[^}]*\}/g,
  /\\usepackage(\[[^\]]*\])?\{[^}]*\}/g,
  /\\newcommand\\\w+(\[\d+\])?\{[^}]*\}/g,
  /\\renewcommand\\\w+(\[\d+\])?\{[^}]*\}/g,
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

export function stripPreamble(src: string): string {
  let out = src;
  for (const pat of PREAMBLE_PATTERNS) out = out.replace(pat, '');
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
