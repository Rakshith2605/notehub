'use client';

import { useNoteStore } from '@/hooks/useNotes';

export default function StatusBar() {
  const { notes, selectedNoteId, folders } = useNoteStore();
  const note = notes.find((n) => n.id === selectedNoteId);

  if (!note) {
    return (
      <div className="h-7 flex items-center px-3 border-t border-border bg-status text-[11px] text-muted shrink-0">
        <span>No note selected</span>
      </div>
    );
  }

  const charCount = note.content.length;
  const lineCount = note.content ? note.content.split('\n').length : 0;
  const folderName = note.folderId ? folders.find((f) => f.id === note.folderId)?.name || 'Unknown' : null;
  const versionCount = note.versions?.length || 0;

  return (
    <div className="h-7 flex items-center gap-4 px-3 border-t border-border bg-status text-[11px] text-muted-foreground shrink-0">
      <span>chars: {charCount.toLocaleString()}</span>
      <span>lines: {lineCount}</span>
      <span className="px-1.5 py-0.5 rounded bg-surface-tertiary text-[10px] font-medium uppercase">
        {note.language}
      </span>
      {versionCount > 1 && (
        <span className="text-muted">versions: {versionCount}</span>
      )}
      {note.tags.length > 0 && (
        <span className="text-muted">tags: {note.tags.length}</span>
      )}
      {folderName && (
        <span className="text-muted">{folderName}</span>
      )}
      <div className="flex-1" />
    </div>
  );
}
