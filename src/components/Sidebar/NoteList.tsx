'use client';

import { useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { Pin, PinOff, Trash2, MoreHorizontal } from 'lucide-react';

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

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5',
  java: '#b07219', c: '#555555', cpp: '#f34b7d', go: '#00add8',
  rust: '#dea584', sql: '#e38c00', bash: '#89e051', json: '#e0e0e0',
  yaml: '#cb171e', toml: '#9c4221', markdown: '#519aba',
  plaintext: '#8b8b9e', url: '#3b82f6',
};

const TAG_COLORS: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e',
  blue: '#3b82f6', purple: '#a855f7', pink: '#ec4899',
};

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' as const },
  { label: 'Oldest', value: 'oldest' as const },
  { label: 'Modified', value: 'modified' as const },
  { label: 'A-Z', value: 'alpha' as const },
];

export default function NoteList() {
  const { notes, selectedNoteId, selectNote, togglePin, deleteNote, searchQuery, sortBy, setSortBy, tags } = useNoteStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);

  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const searchLower = searchQuery.toLowerCase();

  const filtered = searchQuery
    ? notes.filter((n) => n.title.toLowerCase().includes(searchLower) || n.content.toLowerCase().includes(searchLower))
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
    setContextMenu({ x: e.clientX, y: e.clientY, noteId });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 py-1.5 flex items-center gap-1 border-b border-border">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-transparent text-[10px] text-muted-foreground outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="text-[10px] text-muted ml-auto">{filtered.length} notes</span>
      </div>

      <div className="flex-1 overflow-y-auto" onClick={closeContextMenu}>
        {sorted.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted">
            {searchQuery ? 'No matching notes' : 'No notes yet'}
          </div>
        ) : (
          sorted.map((note) => {
            const isPinned = note.pinned && (!searchQuery);
            return (
              <div
                key={note.id}
                onClick={() => selectNote(note.id)}
                onContextMenu={(e) => handleContextMenu(e, note.id)}
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
                      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LANGUAGE_COLORS[note.language] || LANGUAGE_COLORS.plaintext }} />
                      <span className="text-[10px] text-muted uppercase">{note.language}</span>
                      <span className="text-[10px] text-muted">&middot;</span>
                      <span className="text-[10px] text-muted">{relativeTime(note.updatedAt)}</span>
                    </div>
                    {note.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {note.tags.map((tagId) => {
                          const tag = tagMap.get(tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: (TAG_COLORS[tag.color] || '#3b82f6') + '30', color: TAG_COLORS[tag.color] || '#3b82f6' }}
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
            <button
              onClick={() => { togglePin(contextMenu.noteId); closeContextMenu(); }}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover transition-colors"
            >
              {notes.find((n) => n.id === contextMenu.noteId)?.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => { deleteNote(contextMenu.noteId); closeContextMenu(); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-surface-hover transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}