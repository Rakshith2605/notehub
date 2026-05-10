export function detectLanguage(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return 'plaintext';

  if (isUrl(trimmed)) return 'url';
  if (isJson(trimmed)) return 'json';
  if (isYaml(trimmed)) return 'yaml';
  if (isToml(trimmed)) return 'toml';
  if (isMarkdown(trimmed)) return 'markdown';

  const codeLang = detectCodeLanguage(trimmed);
  if (codeLang) return codeLang;

  return 'plaintext';
}

function isUrl(text: string): boolean {
  const urlPattern = /^(https?:\/\/|ftp:\/\/)[^\s/$.?#].[^\s]*$/i;
  return text.split('\n').length === 1 && urlPattern.test(text) && text.length < 2000;
}

function isJson(text: string): boolean {
  const clean = text.trim();
  if (!clean.startsWith('{') && !clean.startsWith('[')) return false;
  try {
    JSON.parse(clean);
    return true;
  } catch {
    return false;
  }
}

function isYaml(text: string): boolean {
  if (text.startsWith('{') || text.startsWith('[')) return false;
  const lines = text.split('\n');
  let keyValueCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (/^[\w.-]+\s*:/.test(trimmed)) {
      keyValueCount++;
    }
  }
  return keyValueCount >= 2;
}

function isToml(text: string): boolean {
  if (text.startsWith('{') || text.startsWith('[')) return false;
  const lines = text.split('\n');
  let tomlScore = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (/^\[.*\]$/.test(trimmed)) tomlScore += 2;
    if (/^\w+\s*=\s*(true|false|".*"|'.*'|\d+|\[.*\])/.test(trimmed)) tomlScore++;
  }
  return tomlScore >= 2;
}

function isMarkdown(text: string): boolean {
  const mdPatterns = [
    /^#{1,6}\s+/m,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /\*\*.*\*\*/,
    /\[.+\]\(.+\)/,
    /^>\s+/m,
    /```[\s\S]*```/,
  ];
  let score = 0;
  for (const pattern of mdPatterns) {
    if (pattern.test(text)) score++;
  }
  return score >= 2;
}

function detectCodeLanguage(text: string): string | null {
  const patterns: { lang: string; keywords: RegExp; score: number }[] = [
    {
      lang: 'python',
      keywords: /\b(def|class|import|from|print|lambda|elif|except|finally|with|as|yield|async|await|raise|pass|return|if __name__)\b/,
      score: 0,
    },
    {
      lang: 'typescript',
      keywords: /\b(interface|type\s+\w+\s*=|enum|as\s+\w+|readonly|private|public|protected|implements|extends|keyof|typeof)\b/,
      score: 0,
    },
    {
      lang: 'javascript',
      keywords: /\b(const|let|function|var|=>|console\.|document\.|window\.|module\.exports|require\s*\(|new\s+\w+\(|this\.|prototype)\b/,
      score: 0,
    },
    {
      lang: 'java',
      keywords: /\b(public\s+class|public\s+static\s+void|System\.out|package\s+\w+|import\s+java|extends\s+\w+|implements\s+\w+|@Override|new\s+\w+\(\))\b/,
      score: 0,
    },
    {
      lang: 'go',
      keywords: /\b(func\s+\w+|package\s+\w+|import\s+\(|go\s+func|defer\s+|chan\s+|select\s+{|go\s+fmt|:=|fmt\.Print)\b/,
      score: 0,
    },
    {
      lang: 'rust',
      keywords: /\b(fn\s+\w+|let\s+mut|impl\s+\w+|use\s+\w+::|pub\s+fn|struct\s+\w+|enum\s+\w+|match\s+|println!|Vec<|Option<|Result<)\b/,
      score: 0,
    },
    {
      lang: 'cpp',
      keywords: /\b(#include\s*<|std::|template\s*<|vector<|cout\s*<<|cin\s*>>|namespace\s+\w+|class\s+\w+\s*{|public:|private:|protected:)\b/,
      score: 0,
    },
    {
      lang: 'c',
      keywords: /\b(#include\s*<|int\s+main\s*\(|printf\s*\(|scanf\s*\(|malloc\s*\(|free\s*\(|typedef\s+struct|#define\s+|#ifdef\s+|#ifndef\s+)\b/,
      score: 0,
    },
    {
      lang: 'sql',
      keywords: /\b(SELECT\s+|FROM\s+|WHERE\s+|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|JOIN\s+|GROUP\s+BY|ORDER\s+BY|LIMIT\s+)\b/i,
      score: 0,
    },
    {
      lang: 'bash',
      keywords: /(^#!\/bin\/(bash|sh)|^#!\/usr\/bin\/env|echo\b|export\s|if\s+\[|fi\b|for\s+\w+\s+in|while\s|do\b|done\b|case\s|esac\b|chmod\b|chown\b|grep\b|sed\b|awk\b|curl\b|wget\b)/m,
      score: 0,
    },
  ];

  for (const p of patterns) {
    const matches = text.match(p.keywords);
    if (matches) {
      p.score = matches.length;
    }
  }

  // Check for JS vs TS distinction
  const hasTS = patterns.find((p) => p.lang === 'typescript')!;
  const hasJS = patterns.find((p) => p.lang === 'javascript')!;
  if (hasTS.score > 0 && hasTS.score >= hasJS.score) return 'typescript';
  if (hasJS.score > 0) return 'javascript';

  // Sort by score descending
  patterns.sort((a, b) => b.score - a.score);

  if (patterns[0].score > 0) return patterns[0].lang;

  // Heuristic checks
  if (text.includes('def ') && text.includes(':')) return 'python';
  if (text.includes('func ') && text.includes('package ') && text.includes('{')) return 'go';
  if (text.includes('fn ') && text.includes('->')) return 'rust';

  return null;
}
