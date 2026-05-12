'use client';

import { useMemo } from 'react';
import { renderLatex } from '@/lib/latex';

interface LatexPreviewProps {
  content: string;
}

export default function LatexPreview({ content }: LatexPreviewProps) {
  const html = useMemo(() => {
    if (!content.trim()) return '';
    return renderLatex(content);
  }, [content]);

  if (!content.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center bg-editor text-muted text-sm">
        No LaTeX content to preview
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-editor">
      <div 
        className="max-w-[48rem] mx-auto px-6 py-5 text-sm leading-6 text-foreground latex-preview"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
