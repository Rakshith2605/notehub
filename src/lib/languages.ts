export interface LanguageOption {
  label: string;
  value: string;
}

export const LANGUAGES: LanguageOption[] = [
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'SQL', value: 'sql' },
  { label: 'Bash', value: 'bash' },
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'TOML', value: 'toml' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'LaTeX', value: 'latex' },
];

export const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3572a5',
  java: '#b07219',
  c: '#6b6b6b',
  cpp: '#f34b7d',
  go: '#00add8',
  rust: '#dea584',
  sql: '#e38c00',
  bash: '#89e051',
  json: '#cccccc',
  yaml: '#cb171e',
  toml: '#9c4221',
  markdown: '#519aba',
  latex: '#008080',
  plaintext: '#9e9e9e',
  url: '#3b82f6',
};

export function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.plaintext;
}

const MONACO_LANG_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
  sql: 'sql',
  bash: 'shell',
  json: 'json',
  yaml: 'yaml',
  markdown: 'markdown',
  latex: 'latex',
  toml: 'plaintext',
  url: 'plaintext',
  plaintext: 'plaintext',
};

export function mapLanguageToMonaco(lang: string): string {
  return MONACO_LANG_MAP[lang] || 'plaintext';
}
