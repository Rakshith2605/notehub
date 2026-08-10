'use client';

import { useEffect, useCallback, useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import Sidebar from '@/components/Sidebar/Sidebar';
import EditorPane from '@/components/Editor/EditorPane';
import StatusBar from '@/components/StatusBar';
import CommandPalette from '@/components/CommandPalette';
import LoginScreen from '@/components/Auth/LoginScreen';
import SettingsModal from '@/components/Settings/SettingsModal';
import ClipboardPane from '@/components/ClipboardPane';
import { Plus, PanelLeftClose, PanelLeft, Search, Clipboard } from 'lucide-react';
import { importFile } from '@/lib/export';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function Home() {
  const auth = useAuth();
  const userId = auth.user?.id || null;
  const { loadFromDB, clearWorkspace, isLoading, syncError, createNote, sidebarOpen, toggleSidebar, setSidebarOpen, setTheme, setSearchQuery, searchQuery, clipboardMode, toggleClipboardMode, loadClipboardItems, addClipboardItem } = useNoteStore();
  const { commandPaletteOpen, setCommandPaletteOpen } = useKeyboardShortcuts(Boolean(userId));
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncErrorDismissed, setSyncErrorDismissed] = useState(false);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setSidebarOpen]);

  useEffect(() => {
    setSyncErrorDismissed(false);
  }, [syncError]);

  useEffect(() => {
    if (auth.isLoading) return;
    if (userId) {
      void loadFromDB(userId);
      void loadClipboardItems();
      return;
    }
    clearWorkspace();
  }, [auth.isLoading, userId, loadFromDB, loadClipboardItems, clearWorkspace]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notehub-theme') as 'dark' | 'light' | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = saved || (prefersDark ? 'dark' : 'light');
      setTheme(initial);
    }
  }, [setTheme]);

  // Refresh occasionally for cross-device changes without interrupting active edits.
  useEffect(() => {
    if (!clipboardMode || !userId) return;

    let isMounted = true;
    let isPolling = false;

    const poll = async () => {
      if (!isMounted || isPolling) return;
      // Don't clobber local edits while the user is typing in the clipboard area
      const state = useNoteStore.getState();
      if (state.clipboardEditing || state.clipboardSyncState === 'saving' || state.clipboardSyncState === 'loading') return;
      isPolling = true;
      await loadClipboardItems();
      isPolling = false;
    };

    const interval = setInterval(poll, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [clipboardMode, userId, loadClipboardItems]);

  // Clipboard mode: global paste handler
  useEffect(() => {
    if (!clipboardMode) return;

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isInput) return;
      const text = e.clipboardData?.getData('text');
      if (text) {
        e.preventDefault();
        void addClipboardItem(text);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [clipboardMode, addClipboardItem]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const result = await importFile(file);
      createNote(result.content);
    }
  }, [createNote]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (auth.isLoading || (userId && isLoading)) {
    return (
      <div className="h-dvh w-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted text-sm">Loading Copybook...</div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <LoginScreen
        authError={auth.authError}
        authMessage={auth.authMessage}
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
      />
    );
  }

  return (
    <div
      className="h-dvh w-screen flex flex-col bg-background"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <header className="app-header flex items-center gap-2 px-3 border-b border-border bg-header shrink-0">
        <button
          onClick={toggleSidebar}
          className="min-w-8 min-h-8 flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>
        <h1 className="hidden sm:block text-sm font-semibold text-foreground mr-2 whitespace-nowrap">Copybook</h1>
        <div className="flex-1 min-w-0 flex items-center gap-2 max-w-md">
          <Search size={14} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder-muted outline-none w-full"
            data-search-input
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="min-w-8 min-h-8 flex items-center justify-center px-2 rounded text-[10px] text-muted bg-surface-tertiary border border-border hover:text-foreground hover:border-muted transition-colors"
            aria-label="Open command palette"
          >
            <span className="hidden sm:inline">⌘K</span>
            <Search size={15} className="sm:hidden" aria-hidden="true" />
          </button>
          <button
            onClick={() => createNote()}
            className="min-h-8 flex items-center justify-center gap-1.5 px-2.5 bg-accent text-white rounded-md text-xs font-medium hover:bg-accent-hover transition-colors"
            aria-label="Create new note"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            onClick={() => toggleClipboardMode()}
            className={`min-h-8 flex items-center justify-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-colors ${
              clipboardMode
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'text-muted hover:bg-surface-hover hover:text-foreground border border-transparent'
            }`}
            title={clipboardMode ? 'Exit clipboard mode' : 'Open clipboard mode'}
            aria-pressed={clipboardMode}
          >
            <Clipboard size={14} />
            <span className="hidden sm:inline">Clipboard</span>
          </button>
        </div>
      </header>

      {syncError && !syncErrorDismissed && (
        <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300" role="alert">
          {syncError}
          <button type="button" onClick={() => setSyncErrorDismissed(true)} className="ml-auto min-w-7 min-h-7 flex items-center justify-center rounded text-red-200 hover:bg-red-500/20" aria-label="Dismiss sync error">&times;</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} mobile={isMobile} onSelectNote={() => { if (isMobile) setSidebarOpen(false); }} />
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {clipboardMode ? <ClipboardPane /> : <EditorPane />}
          {!clipboardMode && <StatusBar />}
        </div>
      </div>

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
