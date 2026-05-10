import type { Note } from '@/types';

const EXTENSION_MAP: Record<string, string> = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  go: '.go',
  rust: '.rs',
  sql: '.sql',
  bash: '.sh',
  json: '.json',
  yaml: '.yaml',
  toml: '.toml',
  markdown: '.md',
  plaintext: '.txt',
  url: '.txt',
};

export function exportNote(note: Note) {
  const ext = EXTENSION_MAP[note.language] || '.txt';
  const fileName = (note.title || 'note').replace(/[^a-zA-Z0-9_-]/g, '_') + ext;
  const blob = new Blob([note.content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, fileName);
}

export async function exportAllNotes(notes: Note[]) {
  const { default: JSZip } = await import('jszip');

  const zip = new JSZip();
  for (const note of notes) {
    const ext = EXTENSION_MAP[note.language] || '.txt';
    const fileName = (note.title || 'note').replace(/[^a-zA-Z0-9_-]/g, '_') + ext;
    zip.file(fileName, note.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `notehub-export-${new Date().toISOString().slice(0, 10)}.zip`);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importFile(file: File): Promise<{ content: string; language: string; title: string }> {
  const { detectLanguage } = await import('@/lib/detect');
  const content = await file.text();
  const language = detectLanguage(content);
  const title = (content.split('\n')[0]?.trim() || file.name).slice(0, 60);
  return { content, language, title };
}
