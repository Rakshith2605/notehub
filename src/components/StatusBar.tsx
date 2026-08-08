'use client';

import { useNoteStore } from '@/hooks/useNotes';

export default function StatusBar() {
  const { notes, selectedNoteId, folders } = useNoteStore();
  const note = notes.find((n) => n.id === selectedNoteId);

  if (!note) {
    return (
      <div className="min-h-[calc(1.75rem+env(safe-area-inset-bottom))] flex items-center px-3 pb-[env(safe-area-inset-bottom)] border-t border-border bg-status text-[11px] text-muted shrink-0">
        <span>No note selected</span>
      </div>
    );
  }

  const charCount = note.content.length;
  const lineCount = note.content ? note.content.split('\n').length : 0;
  const folderName = note.folderId ? folders.find((f) => f.id === note.folderId)?.name || 'Unknown' : null;
  const versionCount = note.versions?.length || 0;

  return (
      <div className="min-h-[calc(1.75rem+env(safe-area-inset-bottom))] flex items-center flex-wrap gap-x-3 gap-y-0.5 px-3 py-1 pb-[env(safe-area-inset-bottom)] border-t border-border bg-status text-[11px] text-muted-foreground shrink-0 overflow-hidden">
      <span>chars: {charCount.toLocaleString()}</span>
      <span>lines: {lineCount}</span>
      <span className="px-1.5 py-0.5 rounded bg-surface-tertiary text-[10px] font-medium uppercase">
        {note.language}
      </span>
      {versionCount > 1 && (
       <span className="hidden sm:inline text-muted">versions: {versionCount}</span>
      )}
      {folderName && (
         <span className="hidden sm:inline text-muted truncate max-w-40">{folderName}</span>
      )}
      <div className="flex-1" />
    </div>
  );
}
