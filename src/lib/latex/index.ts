import DOMPurify from 'isomorphic-dompurify';
import { stripPreamble, expandMacros } from './expand';
import { renderMath } from './math';
import { RESUME_MACROS } from './macros';

export function renderLatex(source: string): string {
  const stripped = stripPreamble(source);
  const expanded = expandMacros(stripped, RESUME_MACROS);
  const withMath = renderMath(expanded);
  return DOMPurify.sanitize(withMath, {
    ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'mfrac', 'annotation', 'semantics', 'mtext', 'mspace', 'mstyle', 'span', 'div', 'h2', 'h3', 'hr', 'ul', 'li', 'strong', 'em', 'u', 'a', 'br'],
    ADD_ATTR: ['target', 'rel', 'href', 'class'],
  });
}

export { stripPreamble, expandMacros, renderMath, RESUME_MACROS };
