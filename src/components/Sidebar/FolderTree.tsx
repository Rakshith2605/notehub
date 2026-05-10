'use client';

import { useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { Folder, FileText, Plus, Trash2 } from 'lucide-react';

export default function FolderTree() {
  const { folders, notes, createFolder, deleteFolder, renameFolder, setNoteFolder } = useNoteStore();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);

  const allCount = notes.length;

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

  const handleDrop = (folderId: string | null) => {
    if (draggedNoteId) {
      setNoteFolder(draggedNoteId, folderId);
      setDraggedNoteId(null);
    }
  };

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Folders</span>
        <button
          onClick={() => { setIsCreating(true); setNewFolderName(''); }}
          className="p-0.5 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="space-y-0.5">
        <button
          onClick={() => null}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(null)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <FileText size={14} />
          <span className="flex-1 text-left">All Notes</span>
          <span className="text-[10px] text-muted">{allCount}</span>
        </button>

        {folders.map((f) => {
          const noteCount = notes.filter((n) => n.folderId === f.id).length;
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
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(f.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors group"
            >
              <Folder size={14} className="shrink-0" />
              <span
                className="flex-1 text-left truncate cursor-pointer"
                onDoubleClick={() => { setEditingId(f.id); setEditName(f.name); }}
              >
                {f.name}
              </span>
              <span className="text-[10px] text-muted">{noteCount}</span>
              <button
                onClick={() => deleteFolder(f.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-red-400 transition-all shrink-0"
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