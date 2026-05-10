import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Note, Folder, Tag, Version } from '@/types';
import * as db from '@/lib/db';

interface NoteStore {
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  selectedNoteId: string | null;
  isLoading: boolean;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'modified' | 'alpha';
  sidebarOpen: boolean;
  theme: 'dark' | 'light';

  loadFromDB: () => Promise<void>;
  createNote: (content?: string) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  createFolder: (name: string) => Folder;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  createTag: (name: string, color: string) => Tag;
  deleteTag: (id: string) => void;
  addTagToNote: (noteId: string, tagId: string) => void;
  removeTagFromNote: (noteId: string, tagId: string) => void;
  setNoteFolder: (noteId: string, folderId: string | null) => void;
  togglePin: (noteId: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'newest' | 'oldest' | 'modified' | 'alpha') => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

function generateTitle(content: string): string {
  const firstLine = content.split('\n')[0]?.trim() || '';
  return firstLine.slice(0, 60) || 'Untitled';
}

function addVersion(versions: Version[], content: string): Version[] {
  const newVersion: Version = { content, timestamp: Date.now() };
  const deduped = versions.length > 0 && versions[versions.length - 1].content === content
    ? versions
    : [...versions, newVersion];
  return deduped.slice(-10);
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  folders: [],
  tags: [],
  selectedNoteId: null,
  isLoading: true,
  searchQuery: '',
  sortBy: 'newest',
  sidebarOpen: true,
  theme: 'dark',

  loadFromDB: async () => {
    const [notes, folders, tags] = await Promise.all([
      db.getAllNotes(),
      db.getAllFolders(),
      db.getAllTags(),
    ]);
    set({ notes, folders, tags, isLoading: false });
  },

  createNote: (content?: string) => {
    const now = Date.now();
    const body = content || '';
    const note: Note = {
      id: nanoid(),
      title: generateTitle(body),
      content: body,
      language: 'plaintext',
      folderId: null,
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
      versions: body ? [{ content: body, timestamp: now }] : [],
    };
    set((s) => ({ notes: [note, ...s.notes], selectedNoteId: note.id }));
    return note;
  },

  updateNote: (id, updates) => {
    set((s) => ({
      notes: s.notes.map((n) => {
        if (n.id !== id) return n;
        const updated = { ...n, ...updates, updatedAt: Date.now() };
        if (updates.content !== undefined) {
          updated.title = generateTitle(updates.content);
          updated.versions = addVersion(n.versions, updates.content);
        }
        return updated;
      }),
    }));
  },

  deleteNote: (id) => {
    set((s) => {
      const filtered = s.notes.filter((n) => n.id !== id);
      const nextId = s.selectedNoteId === id
        ? filtered[0]?.id || null
        : s.selectedNoteId;
      return { notes: filtered, selectedNoteId: nextId };
    });
  },

  selectNote: (id) => set({ selectedNoteId: id }),

  createFolder: (name) => {
    const folder: Folder = { id: nanoid(), name, order: Date.now() };
    set((s) => ({ folders: [...s.folders, folder] }));
    return folder;
  },

  deleteFolder: (id) => {
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      notes: s.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
    }));
  },

  renameFolder: (id, name) => {
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
    }));
  },

  createTag: (name, color) => {
    const tag: Tag = { id: nanoid(), name, color };
    set((s) => ({ tags: [...s.tags, tag] }));
    return tag;
  },

  deleteTag: (id) => {
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== id),
      notes: s.notes.map((n) => ({
        ...n,
        tags: n.tags.filter((t) => t !== id),
      })),
    }));
  },

  addTagToNote: (noteId, tagId) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === noteId && !n.tags.includes(tagId)
          ? { ...n, tags: [...n.tags, tagId] }
          : n
      ),
    }));
  },

  removeTagFromNote: (noteId, tagId) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === noteId
          ? { ...n, tags: n.tags.filter((t) => t !== tagId) }
          : n
      ),
    }));
  },

  setNoteFolder: (noteId, folderId) => {
    set((s) => ({
      notes: s.notes.map((n) => (n.id === noteId ? { ...n, folderId } : n)),
    }));
  },

  togglePin: (noteId) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === noteId ? { ...n, pinned: !n.pinned } : n
      ),
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSortBy: (sortBy) => set({ sortBy }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('light', theme === 'light');
      localStorage.setItem('notehub-theme', theme);
    }
  },
}));

let persistTimer: ReturnType<typeof setTimeout> | null = null;

useNoteStore.subscribe((state) => {
  if (state.isLoading) return;

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    Promise.all([
      ...state.notes.map((n) => db.saveNote(n)),
      ...state.folders.map((f) => db.saveFolder(f)),
      ...state.tags.map((t) => db.saveTag(t)),
    ]).catch(console.error);
  }, 500);
});