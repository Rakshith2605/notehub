/**
 * Parse N brace-delimited arguments starting at position `start`.
 * Returns [args[], endIndex] or null if parse fails.
 * Handles arbitrary nesting and skips whitespace between args.
 */
export function parseBraceArgs(
  src: string,
  start: number,
  count: number
): { args: string[]; end: number } | null {
  const args: string[] = [];
  let i = start;
  for (let n = 0; n < count; n++) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] !== '{') return null;
    let depth = 1;
    let j = i + 1;
    while (j < src.length && depth > 0) {
      if (src[j] === '\\' && j + 1 < src.length) { j += 2; continue; }
      if (src[j] === '{') depth++;
      else if (src[j] === '}') depth--;
      if (depth > 0) j++;
    }
    if (depth !== 0) return null;
    args.push(src.slice(i + 1, j));
    i = j + 1;
  }
  return { args, end: i };
}
