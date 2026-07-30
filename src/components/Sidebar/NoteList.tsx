'use client';

import { useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { Pin, PinOff, Trash2, MoreHorizontal, FolderInput, Folder as FolderIcon, X } from 'lucide-react';
import { getLanguageColor } from '@/lib/languages';
import { getTagColor } from '@/lib/tagColors';

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' as const },
  { label: 'Oldest', value: 'oldest' as const },
  { label: 'Modified', value: 'modified' as const },
  { label: 'A-Z', value: 'alpha' as const },
];

export default function NoteList() {
  const { notes, folders, selectedNoteId, selectNote, togglePin, deleteNote, searchQuery, sortBy, setSortBy, tags, activeFolderId, setActiveFolder, setNoteFolder } = useNoteStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string; view: 'main' | 'move' } | null>(null);

  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const searchLower = searchQuery.toLowerCase();
  const activeFolder = activeFolderId ? folders.find((f) => f.id === activeFolderId) : undefined;

  // Search is global; otherwise the open folder filters the list
  const filtered = searchQuery
    ? notes.filter((n) => n.title.toLowerCase().includes(searchLower) || n.content.toLowerCase().includes(searchLower))
    : activeFolderId
      ? notes.filter((n) => n.folderId === activeFolderId)
      : notes;

  const sorted = [...filtered].sort((a, b) => {
    const aPinned = a.pinned ? 1 : 0;
    const bPinned = b.pinned ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;

    switch (sortBy) {
      case 'oldest': return a.createdAt - b.createdAt;
      case 'modified': return b.updatedAt - a.updatedAt;
      case 'alpha': return a.title.localeCompare(b.title);
      default: return b.createdAt - a.createdAt;
    }
  });

  const handleContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, noteId, view: 'main' });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleMoveTo = (folderId: string | null) => {
    if (contextMenu) {
      setNoteFolder(contextMenu.noteId, folderId);
    }
    closeContextMenu();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 flex items-center gap-1 border-b border-border">
        {activeFolder && !searchQuery ? (
          <span className="flex items-center gap-1 text-[10px] text-accent bg-accent-muted border border-accent/20 rounded px-1.5 py-0.5">
            <FolderIcon size={10} />
            <span className="max-w-[100px] truncate">{activeFolder.name}</span>
            <button
              onClick={() => setActiveFolder(null)}
              className="text-accent/70 hover:text-accent"
              title="Show all notes"
            >
              <X size={10} />
            </button>
          </span>
        ) : (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-transparent text-[10px] text-muted-foreground outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
        <span className="text-[10px] text-muted ml-auto">{filtered.length} notes</span>
      </div>

      <div className="flex-1 overflow-y-auto" onClick={closeContextMenu}>
        {sorted.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted">
            {searchQuery ? 'No matching notes' : activeFolderId ? 'No notes in this folder' : 'No notes yet'}
          </div>
        ) : (
          sorted.map((note) => {
            const isPinned = note.pinned && (!searchQuery);
            return (
              <div
                key={note.id}
                onClick={() => selectNote(note.id)}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/note-id', note.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className={`group px-3 py-2 cursor-pointer transition-colors border-l-2 ${
                  note.id === selectedNoteId
                    ? 'bg-accent-muted border-accent'
                    : 'border-transparent hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {isPinned && <Pin size={10} className="text-accent shrink-0" />}
                      <div className="text-xs font-medium text-foreground truncate">{note.title || 'Untitled'}</div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(note.language) }} />
                      <span className="text-[10px] text-muted uppercase">{note.language}</span>
                      <span className="text-[10px] text-muted">&middot;</span>
                      <span className="text-[10px] text-muted">{relativeTime(note.updatedAt)}</span>
                    </div>
                    {note.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {note.tags.map((tagId) => {
                          const tag = tagMap.get(tagId);
                          if (!tag) return null;
                          const tagHex = getTagColor(tag.color);
                          return (
                            <span
                              key={tagId}
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: tagHex + '30', color: tagHex }}
                            >
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); togglePin(note.id); }} className="p-0.5 rounded hover:bg-surface-tertiary text-muted hover:text-foreground transition-colors">
                      {note.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="p-0.5 rounded hover:bg-surface-tertiary text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e, note.id); }} className="p-0.5 rounded hover:bg-surface-tertiary text-muted hover:text-foreground transition-colors">
                      <MoreHorizontal size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 bg-surface-tertiary border border-border rounded-md shadow-lg py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.view === 'main' ? (
              <>
                <button
                  onClick={() => { togglePin(contextMenu.noteId); closeContextMenu(); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover transition-colors"
                >
                  {notes.find((n) => n.id === contextMenu.noteId)?.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => setContextMenu({ ...contextMenu, view: 'move' })}
                  className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover transition-colors flex items-center gap-1.5"
                >
                  <FolderInput size={12} />
                  Move to folder
                </button>
                <button
                  onClick={() => { deleteNote(contextMenu.noteId); closeContextMenu(); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-surface-hover transition-colors"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider">Move to</div>
                <button
                  onClick={() => handleMoveTo(null)}
                  className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover transition-colors"
                >
                  No folder
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveTo(f.id)}
                    className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover transition-colors flex items-center gap-1.5"
                  >
                    <FolderIcon size={12} className="text-muted shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
                {folders.length === 0 && (
                  <div className="px-3 py-1.5 text-[10px] text-muted">No folders yet</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}