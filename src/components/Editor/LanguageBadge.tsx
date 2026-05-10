'use client';

import { getLanguageColor } from '@/lib/languages';

interface LanguageBadgeProps {
  language: string;
}

export default function LanguageBadge({ language }: LanguageBadgeProps) {
  const color = getLanguageColor(language);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide animate-fade-in"
      style={{
        backgroundColor: color + '20',
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {language}
    </span>
  );
}

