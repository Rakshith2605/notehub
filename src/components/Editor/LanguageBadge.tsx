'use client';

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3572a5',
  java: '#b07219',
  c: '#555555',
  cpp: '#f34b7d',
  go: '#00add8',
  rust: '#dea584',
  sql: '#e38c00',
  bash: '#89e051',
  json: '#e0e0e0',
  yaml: '#cb171e',
  toml: '#9c4221',
  markdown: '#519aba',
  plaintext: '#8b8b9e',
  url: '#3b82f6',
};

interface LanguageBadgeProps {
  language: string;
}

export default function LanguageBadge({ language }: LanguageBadgeProps) {
  const color = LANGUAGE_COLORS[language] || LANGUAGE_COLORS.plaintext;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide animate-fade-in"
      style={{
        backgroundColor: color + '20',
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {language}
    </span>
  );
}
