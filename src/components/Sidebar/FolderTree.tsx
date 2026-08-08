'use client';

import { useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';

export default function FolderTree() {
  const { folders, notes, createFolder, deleteFolder, renameFolder, setNoteFolder, activeFolderId, setActiveFolder } = useNoteStore();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameFolder(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetId(null);
    const noteId = e.dataTransfer.getData('text/note-id');
    if (noteId) {
      setNoteFolder(noteId, folderId);
    }
  };

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Folders</span>
        <button
          type="button"
          aria-label="Create folder"
          onClick={() => { setIsCreating(true); setNewFolderName(''); }}
          className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="space-y-0.5">
        {folders.map((f) => {
          const noteCount = notes.filter((n) => n.folderId === f.id).length;
          const isActive = activeFolderId === f.id;
          if (editingId === f.id) {
            return (
              <div key={f.id} className="flex items-center gap-1 px-2 py-1">
                <Folder size={14} className="text-muted shrink-0" />
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(f.id); if (e.key === 'Escape') setEditingId(null); }}
                  onBlur={() => handleRename(f.id)}
                  className="flex-1 bg-surface-tertiary text-xs text-foreground outline-none px-1 rounded"
                />
              </div>
            );
          }
          return (
            <div
              key={f.id}
              onClick={() => setActiveFolder(isActive ? null : f.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveFolder(isActive ? null : f.id);
                }
                if (e.key === 'F2') {
                  e.preventDefault();
                  setEditingId(f.id);
                  setEditName(f.name);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDropTargetId(f.id); }}
              onDragLeave={() => setDropTargetId((prev) => (prev === f.id ? null : prev))}
              onDrop={(e) => handleDrop(e, f.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors group cursor-pointer ${
                dropTargetId === f.id
                  ? 'bg-accent-muted text-accent ring-1 ring-accent/40'
                  : isActive
                    ? 'bg-accent-muted text-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              {isActive ? <FolderOpen size={14} className="shrink-0" /> : <Folder size={14} className="shrink-0" />}
              <span
                className="flex-1 text-left truncate"
                onDoubleClick={() => { setEditingId(f.id); setEditName(f.name); }}
                title={`${f.name} (double-click to rename)`}
              >
                {f.name}
              </span>
              <span className="text-[10px] text-muted">{noteCount}</span>
              <button
                type="button"
                aria-label={`Delete ${f.name} folder`}
                onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 min-w-7 min-h-7 flex items-center justify-center text-muted hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 size={10} />
              </button>
            </div>
          );
        })}

        {isCreating && (
          <div className="flex items-center gap-1 px-2 py-1">
            <Folder size={14} className="text-muted shrink-0" />
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setIsCreating(false); setNewFolderName(''); } }}
              onBlur={handleCreate}
              placeholder="Folder name..."
              className="flex-1 bg-surface-tertiary text-xs text-foreground outline-none px-1 rounded placeholder-muted"
            />
          </div>
        )}
      </div>
    </div>
  );
}
