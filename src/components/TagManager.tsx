'use client';

import { useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { Plus, X, Check } from 'lucide-react';
import { TAG_COLOR_OPTIONS, getTagColor } from '@/lib/tagColors';

export default function TagManager() {
  const { tags, createTag, deleteTag, notes, selectedNoteId, addTagToNote, removeTagFromNote } = useNoteStore();
  const [isCreating, setIsCreating] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('blue');

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleCreate = () => {
    if (tagName.trim()) {
      createTag(tagName.trim(), tagColor);
      setTagName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="p-3 border-t border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Tags</span>
        <button
          type="button"
          aria-label="Create tag"
          onClick={() => { setIsCreating(true); setTagName(''); }}
          className="min-w-7 min-h-7 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="space-y-1">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1.5 group">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: getTagColor(tag.color) }}
            />
            <span className="text-[11px] text-muted-foreground flex-1 truncate">{tag.name}</span>
            <button
              type="button"
              aria-label={`Delete ${tag.name} tag`}
              onClick={() => deleteTag(tag.id)}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 min-w-7 min-h-7 flex items-center justify-center text-muted hover:text-red-400 transition-all"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {isCreating && (
          <div className="space-y-1">
            <input
              autoFocus
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setIsCreating(false); setTagName(''); } }}
              placeholder="Tag name..."
              className="w-full bg-surface-tertiary text-[11px] text-foreground outline-none px-1.5 py-0.5 rounded placeholder-muted"
            />
            <div className="flex gap-1 flex-wrap">
              {TAG_COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTagColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-transform ${tagColor === c.value ? 'ring-1 ring-foreground scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
            <button
              onClick={handleCreate}
              className="text-[10px] text-accent hover:text-accent-hover transition-colors"
            >
              Create
            </button>
          </div>
        )}
      </div>

      {selectedNote && tags.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1 flex-wrap">
            {tags.map((tag) => {
              const isActive = selectedNote.tags.includes(tag.id);
              const tagHex = getTagColor(tag.color);
              return (
                <button
                  key={tag.id}
                  onClick={() => isActive ? removeTagFromNote(selectedNote.id, tag.id) : addTagToNote(selectedNote.id, tag.id)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-all ${
                    isActive
                      ? 'ring-1 ring-foreground/20'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  style={{ backgroundColor: tagHex + '30', color: tagHex }}
                >
                  {tag.name}
                  {isActive && <Check size={8} className="inline ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
