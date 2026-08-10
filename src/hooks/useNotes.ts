import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Note, Folder, Tag, Version, ClipboardItem } from '@/types';
import * as db from '@/lib/db';

export type ClipboardSyncState = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

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
  activeFolderId: string | null;
  theme: 'dark' | 'light';
  clipboardMode: boolean;
  clipboardItems: ClipboardItem[];
  activeClipboardId: string | null;
  clipboardEditing: boolean;
  clipboardLoading: boolean;
  clipboardSyncState: ClipboardSyncState;
  clipboardError: string | null;
  clipboardLastSyncedAt: number | null;

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
  setActiveFolder: (folderId: string | null) => void;
  togglePin: (noteId: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'newest' | 'oldest' | 'modified' | 'alpha') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleClipboardMode: () => void;
  setClipboardMode: (mode: boolean) => void;
  addClipboardItem: (content: string) => Promise<void>;
  loadClipboardItems: () => Promise<void>;
  selectClipboardItem: (id: string) => void;
  deleteClipboardItem: (id: string) => Promise<void>;
  clearClipboardHistory: () => Promise<void>;
  setClipboardEditing: (editing: boolean) => void;
  updateCurrentClipboard: (content: string) => void;
}

const MAX_CLIPBOARD_ITEMS = 15;

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

let clipboardSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingClipboardEdit: { id: string; content: string } | null = null;

function flushPendingClipboardEdit(userId: string, set: (partial: Partial<NoteStore>) => void) {
  if (clipboardSaveTimer) {
    clearTimeout(clipboardSaveTimer);
    clipboardSaveTimer = null;
  }
  const pending = pendingClipboardEdit;
  pendingClipboardEdit = null;
  if (pending) {
    void db.updateClipboardItem(userId, pending.id, pending.content)
      .then(() => set({ clipboardSyncState: 'saved', clipboardLastSyncedAt: Date.now(), clipboardError: null }))
      .catch((error: unknown) => set({
        clipboardSyncState: 'error',
        clipboardError: error instanceof Error ? error.message : 'Unable to save this clip.',
      }));
  }
}

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
  activeFolderId: null,
  theme: 'dark',
  clipboardMode: false,
  clipboardItems: [],
  activeClipboardId: null,
  clipboardEditing: false,
  clipboardLoading: false,
  clipboardSyncState: 'idle',
  clipboardError: null,
  clipboardLastSyncedAt: null,

  loadFromDB: async (userId) => {
    set({
      activeUserId: userId,
      isLoading: true,
      syncError: null,
      clipboardItems: [],
      activeClipboardId: null,
      clipboardLoading: false,
      clipboardSyncState: 'idle',
      clipboardError: null,
      clipboardLastSyncedAt: null,
    });

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
    if (clipboardSaveTimer) clearTimeout(clipboardSaveTimer);
    pendingClipboardEdit = null;
    lastPersistedSnapshot = '';
    set({
      activeUserId: null,
      notes: [],
      folders: [],
      tags: [],
      selectedNoteId: null,
      isLoading: false,
      syncError: null,
      clipboardItems: [],
      activeClipboardId: null,
      clipboardEditing: false,
      clipboardLoading: false,
      clipboardSyncState: 'idle',
      clipboardError: null,
      clipboardLastSyncedAt: null,
      activeFolderId: null,
    });
  },

  createNote: (content?: string) => {
    const now = Date.now();
    const body = content || '';
    const note: Note = {
      id: nanoid(),
      title: generateTitle(body),
      content: body,
      language: 'plaintext',
      folderId: get().activeFolderId,
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
      activeFolderId: s.activeFolderId === id ? null : s.activeFolderId,
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

  setActiveFolder: (folderId) => set({ activeFolderId: folderId }),

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

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('light', theme === 'light');
      localStorage.setItem('notehub-theme', theme);
    }
  },

  toggleClipboardMode: () => set((s) => ({ clipboardMode: !s.clipboardMode })),

  setClipboardMode: (mode) => set({ clipboardMode: mode }),

  addClipboardItem: async (content) => {
    const userId = get().activeUserId;
    if (!userId) return;

    const existing = get().clipboardItems;
    // Pasting the same content again changes nothing: it is already the current clipboard.
    if (existing[0]?.content === content) {
      set({ activeClipboardId: existing[0].id, clipboardSyncState: 'saved', clipboardError: null });
      return;
    }

    const item: ClipboardItem = {
      id: nanoid(),
      content,
      createdAt: Date.now(),
    };

    const overflow = existing.slice(MAX_CLIPBOARD_ITEMS - 1);
    set((s) => ({
      clipboardItems: [item, ...s.clipboardItems].slice(0, MAX_CLIPBOARD_ITEMS),
      activeClipboardId: item.id,
      clipboardSyncState: 'saving',
      clipboardError: null,
    }));

    try {
      await db.saveClipboardItem(userId, item);
      await Promise.all(overflow.map((old) => db.deleteClipboardItem(userId, old.id)));
      set({ clipboardSyncState: 'saved', clipboardLastSyncedAt: Date.now(), clipboardError: null });
    } catch (error) {
      set({
        clipboardSyncState: 'error',
        clipboardError: error instanceof Error ? error.message : 'Unable to save this clip.',
      });
    }
  },

  loadClipboardItems: async () => {
    const userId = get().activeUserId;
    if (!userId) return;

    if (get().clipboardLastSyncedAt === null) set({ clipboardLoading: true, clipboardSyncState: 'loading', clipboardError: null });

    try {
      const items = await db.getClipboardItems(userId, MAX_CLIPBOARD_ITEMS);
      const currentActiveId = get().activeClipboardId;
      const activeClipboardId = items.some((item) => item.id === currentActiveId)
        ? currentActiveId
        : items[0]?.id || null;
      set({
        clipboardItems: items,
        activeClipboardId,
        clipboardLoading: false,
        clipboardSyncState: 'saved',
        clipboardError: null,
        clipboardLastSyncedAt: Date.now(),
      });
    } catch (error) {
      set({
        clipboardLoading: false,
        clipboardSyncState: 'error',
        clipboardError: error instanceof Error ? error.message : 'Unable to load clipboard history.',
      });
    }
  },

  selectClipboardItem: (id) => {
    set((s) => ({ activeClipboardId: s.clipboardItems.some((item) => item.id === id) ? id : s.activeClipboardId }));
  },

  deleteClipboardItem: async (id) => {
    const userId = get().activeUserId;
    const previousItems = get().clipboardItems;
    const deletedIndex = previousItems.findIndex((item) => item.id === id);
    if (deletedIndex < 0) return;
    const nextItems = previousItems.filter((item) => item.id !== id);
    const wasActive = get().activeClipboardId === id;
    set((s) => ({
      clipboardItems: nextItems,
      activeClipboardId: wasActive ? nextItems[0]?.id || null : s.activeClipboardId,
      clipboardSyncState: userId ? 'saving' : s.clipboardSyncState,
      clipboardError: null,
    }));
    if (userId) {
      try {
        await db.deleteClipboardItem(userId, id);
        set({ clipboardSyncState: 'saved', clipboardLastSyncedAt: Date.now(), clipboardError: null });
      } catch (error) {
        set((s) => ({
          clipboardItems: [...s.clipboardItems.slice(0, deletedIndex), previousItems[deletedIndex], ...s.clipboardItems.slice(deletedIndex)],
          activeClipboardId: wasActive ? id : s.activeClipboardId,
          clipboardSyncState: 'error',
          clipboardError: error instanceof Error ? error.message : 'Unable to delete this clip.',
        }));
      }
    }
  },

  clearClipboardHistory: async () => {
    const userId = get().activeUserId;
    const previousItems = get().clipboardItems;
    if (previousItems.length === 0) return;

    set({ clipboardItems: [], activeClipboardId: null, clipboardSyncState: userId ? 'saving' : 'idle', clipboardError: null });
    if (!userId) return;

    try {
      await Promise.all(previousItems.map((item) => db.deleteClipboardItem(userId, item.id)));
      set({ clipboardSyncState: 'saved', clipboardLastSyncedAt: Date.now(), clipboardError: null });
    } catch (error) {
      set({
        clipboardItems: previousItems,
        activeClipboardId: previousItems[0]?.id || null,
        clipboardSyncState: 'error',
        clipboardError: error instanceof Error ? error.message : 'Unable to clear clipboard history.',
      });
    }
  },

  setClipboardEditing: (editing) => {
    set({ clipboardEditing: editing });
    if (!editing) {
      const userId = get().activeUserId;
      if (userId) flushPendingClipboardEdit(userId, set);
    }
  },

  updateCurrentClipboard: (content) => {
    const userId = get().activeUserId;
    if (!userId) return;

    const current = get().clipboardItems.find((item) => item.id === get().activeClipboardId) || get().clipboardItems[0];

    // No clipboard yet: the first edit becomes the current clipboard.
    if (!current) {
      if (!content) return;
      const item: ClipboardItem = { id: nanoid(), content, createdAt: Date.now() };
      set((s) => ({
        clipboardItems: [item, ...s.clipboardItems].slice(0, MAX_CLIPBOARD_ITEMS),
        activeClipboardId: item.id,
        clipboardSyncState: 'saving',
        clipboardError: null,
      }));
      void db.saveClipboardItem(userId, item)
        .then(() => set({ clipboardSyncState: 'saved', clipboardLastSyncedAt: Date.now(), clipboardError: null }))
        .catch((error: unknown) => set({
          clipboardSyncState: 'error',
          clipboardError: error instanceof Error ? error.message : 'Unable to save this clip.',
        }));
      return;
    }

    if (current.content === content) return;

    if (!content) {
      set((s) => {
        const items = s.clipboardItems.filter((item) => item.id !== current.id);
        return { clipboardItems: items, activeClipboardId: items[0]?.id || null, clipboardSyncState: 'saving', clipboardError: null };
      });
      if (clipboardSaveTimer) clearTimeout(clipboardSaveTimer);
      pendingClipboardEdit = null;
      void db.deleteClipboardItem(userId, current.id)
        .then(() => set({ clipboardSyncState: 'saved', clipboardLastSyncedAt: Date.now(), clipboardError: null }))
        .catch((error: unknown) => set({
          clipboardSyncState: 'error',
          clipboardError: error instanceof Error ? error.message : 'Unable to clear this clip.',
        }));
      return;
    }

    // Editing updates the current clipboard in place (no new history entries).
    set((s) => ({
      clipboardItems: s.clipboardItems.map((i) => (i.id === current.id ? { ...i, content } : i)),
      clipboardSyncState: 'saving',
      clipboardError: null,
    }));

    pendingClipboardEdit = { id: current.id, content };
    if (clipboardSaveTimer) clearTimeout(clipboardSaveTimer);
    clipboardSaveTimer = setTimeout(() => flushPendingClipboardEdit(userId, set), 600);
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
