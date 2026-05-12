import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Note, Folder, Tag, Version } from '@/types';
import * as db from '@/lib/db';

interface NoteStore {
  activeUserId: string | null;
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  selectedNoteId: string | null;
  isLoading: boolean;
  syncError: string | null;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'modified' | 'alpha';
  sidebarOpen: boolean;
  theme: 'dark' | 'light';

  loadFromDB: (userId: string) => Promise<void>;
  clearWorkspace: () => void;
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

function workspaceSnapshot(userId: string | null, notes: Note[], folders: Folder[], tags: Tag[]): string {
  return JSON.stringify({ userId, notes, folders, tags });
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let lastPersistedSnapshot = '';

export const useNoteStore = create<NoteStore>((set, get) => ({
  activeUserId: null,
  notes: [],
  folders: [],
  tags: [],
  selectedNoteId: null,
  isLoading: true,
  syncError: null,
  searchQuery: '',
  sortBy: 'newest',
  sidebarOpen: true,
  theme: 'dark',

  loadFromDB: async (userId) => {
    set({ activeUserId: userId, isLoading: true, syncError: null });

    try {
      const [notes, folders, tags] = await Promise.all([
        db.getAllNotes(userId),
        db.getAllFolders(userId),
        db.getAllTags(userId),
      ]);
      const selectedNoteId = notes.some((note) => note.id === get().selectedNoteId)
        ? get().selectedNoteId
        : notes[0]?.id || null;

      lastPersistedSnapshot = workspaceSnapshot(userId, notes, folders, tags);
      set({ notes, folders, tags, selectedNoteId, isLoading: false, syncError: null });
    } catch (error) {
      const syncError = error instanceof Error ? error.message : 'Unable to load Supabase workspace.';
      set({ notes: [], folders: [], tags: [], selectedNoteId: null, isLoading: false, syncError });
    }
  },

  clearWorkspace: () => {
    if (persistTimer) clearTimeout(persistTimer);
    lastPersistedSnapshot = '';
    set({ activeUserId: null, notes: [], folders: [], tags: [], selectedNoteId: null, isLoading: false, syncError: null });
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
    const userId = get().activeUserId;
    set((s) => {
      const filtered = s.notes.filter((n) => n.id !== id);
      const nextId = s.selectedNoteId === id
        ? filtered[0]?.id || null
        : s.selectedNoteId;
      return { notes: filtered, selectedNoteId: nextId };
    });
    if (userId) void db.deleteNote(userId, id).catch(console.error);
  },

  selectNote: (id) => set({ selectedNoteId: id }),

  createFolder: (name) => {
    const folder: Folder = { id: nanoid(), name, order: Date.now() };
    set((s) => ({ folders: [...s.folders, folder] }));
    return folder;
  },

  deleteFolder: (id) => {
    const userId = get().activeUserId;
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      notes: s.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
    }));
    if (userId) void db.deleteFolder(userId, id).catch(console.error);
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
    const userId = get().activeUserId;
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== id),
      notes: s.notes.map((n) => ({
        ...n,
        tags: n.tags.filter((t) => t !== id),
      })),
    }));
    if (userId) void db.deleteTag(userId, id).catch(console.error);
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

useNoteStore.subscribe((state) => {
  if (state.isLoading || !state.activeUserId) return;

  const nextSnapshot = workspaceSnapshot(state.activeUserId, state.notes, state.folders, state.tags);
  if (nextSnapshot === lastPersistedSnapshot) return;

  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const currentState = useNoteStore.getState();
    if (currentState.isLoading || !currentState.activeUserId) return;

    const currentSnapshot = workspaceSnapshot(currentState.activeUserId, currentState.notes, currentState.folders, currentState.tags);
    if (currentSnapshot === lastPersistedSnapshot) return;

    Promise.all([
      ...currentState.notes.map((note) => db.saveNote(currentState.activeUserId!, note)),
      ...currentState.folders.map((folder) => db.saveFolder(currentState.activeUserId!, folder)),
      ...currentState.tags.map((tag) => db.saveTag(currentState.activeUserId!, tag)),
    ])
      .then(() => {
        lastPersistedSnapshot = currentSnapshot;
      })
      .catch(console.error);
  }, 500);
});