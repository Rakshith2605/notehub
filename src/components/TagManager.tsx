'use client';

import { useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { Plus, X, Check } from 'lucide-react';

const COLOR_OPTIONS = [
  { label: 'Red', value: 'red', hex: '#ef4444' },
  { label: 'Orange', value: 'orange', hex: '#f97316' },
  { label: 'Yellow', value: 'yellow', hex: '#eab308' },
  { label: 'Green', value: 'green', hex: '#22c55e' },
  { label: 'Blue', value: 'blue', hex: '#3b82f6' },
  { label: 'Purple', value: 'purple', hex: '#a855f7' },
  { label: 'Pink', value: 'pink', hex: '#ec4899' },
];

const TAG_COLORS: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e',
  blue: '#3b82f6', purple: '#a855f7', pink: '#ec4899',
};

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
          onClick={() => { setIsCreating(true); setTagName(''); }}
          className="p-0.5 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="space-y-1">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1.5 group">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: TAG_COLORS[tag.color] || '#3b82f6' }}
            />
            <span className="text-[11px] text-muted-foreground flex-1 truncate">{tag.name}</span>
            <button
              onClick={() => deleteTag(tag.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-red-400 transition-all"
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
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTagColor(c.value)}
                  className={`w-4 h-4 rounded-full transition-transform ${tagColor === c.value ? 'ring-1 ring-foreground scale-110' : 'hover:scale-110'}`}
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
              return (
                <button
                  key={tag.id}
                  onClick={() => isActive ? removeTagFromNote(selectedNote.id, tag.id) : addTagToNote(selectedNote.id, tag.id)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-all ${
                    isActive
                      ? 'ring-1 ring-foreground/20'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  style={{ backgroundColor: (TAG_COLORS[tag.color] || '#3b82f6') + '30', color: TAG_COLORS[tag.color] || '#3b82f6' }}
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