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
import { LogOut, Moon, Plus, PanelLeftClose, PanelLeft, Search, Settings, Sun } from 'lucide-react';
import { importFile } from '@/lib/export';

export default function Home() {
  const auth = useAuth();
  const userId = auth.user?.id || null;
  const { loadFromDB, clearWorkspace, isLoading, syncError, createNote, sidebarOpen, toggleSidebar, theme, setTheme, setSearchQuery, searchQuery } = useNoteStore();
  const { commandPaletteOpen, setCommandPaletteOpen } = useKeyboardShortcuts(Boolean(userId));
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (auth.isLoading) return;
    if (userId) {
      void loadFromDB(userId);
      return;
    }
    clearWorkspace();
  }, [auth.isLoading, userId, loadFromDB, clearWorkspace]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notehub-theme') as 'dark' | 'light' | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = saved || (prefersDark ? 'dark' : 'light');
      if (initial === 'light') setTheme('light');
    }
  }, [setTheme]);

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
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted text-sm">Loading Note Hub...</div>
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
      className="h-screen w-screen flex flex-col bg-background"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <header className="h-11 flex items-center gap-2 px-3 border-b border-border bg-header shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>
        <h1 className="text-sm font-semibold text-foreground mr-4 whitespace-nowrap">Note Hub</h1>
        <div className="flex-1 flex items-center gap-2 max-w-md">
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="px-2 py-1 rounded text-[10px] text-muted bg-surface-tertiary border border-border hover:text-foreground hover:border-muted transition-colors"
          >
            ⌘K
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors text-xs"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            title="Settings"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => createNote()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent text-white rounded-md text-xs font-medium hover:bg-accent-hover transition-colors ml-1"
          >
            <Plus size={14} />
            New
          </button>
          <span className="hidden max-w-[180px] truncate px-2 text-[11px] text-muted md:inline">
            {auth.username}
          </span>
          <button
            onClick={auth.signOut}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            title="Sign out"
          >
            <LogOut size={14} />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </header>

      {syncError && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300" role="alert">
          {syncError}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorPane />
          <StatusBar />
        </div>
      </div>

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
