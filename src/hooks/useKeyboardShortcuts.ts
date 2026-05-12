'use client';

import { useEffect, useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';

export function useKeyboardShortcuts(enabled = true) {
  const { createNote, toggleSidebar, setSearchQuery } = useNoteStore();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (mod && e.key === 'n') {
        e.preventDefault();
        createNote();
        return;
      }

      if (mod && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        navigator.clipboard.readText().then((text) => {
          if (text) createNote(text);
        });
        return;
      }

      if (mod && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (mod && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
        return;
      }

      if (e.key === 'Escape' && commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, createNote, toggleSidebar, setSearchQuery, commandPaletteOpen]);

  return { commandPaletteOpen, setCommandPaletteOpen };
}
