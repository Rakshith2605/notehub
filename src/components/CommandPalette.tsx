'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNoteStore } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { Search, FilePlus, ClipboardPaste, PanelLeft, Sun, Moon, Download, Trash2, Pin, Settings, LogOut, User } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

interface CommandItem {
  id: string;
  type: 'note' | 'command';
  label: string;
  subtitle?: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPalette({ open, onClose, onOpenSettings }: CommandPaletteProps) {
  const { notes, createNote, selectNote, deleteNote, toggleSidebar, togglePin, theme, setTheme, selectedNoteId, setClipboardMode } = useNoteStore();
  const auth = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  const allItems = useMemo((): CommandItem[] => {
    const cmdItems: CommandItem[] = [
      {
        id: 'new-note', type: 'command',
        label: 'New Note', shortcut: '⌘N',
        icon: <FilePlus size={16} />,
        action: () => { createNote(); handleClose(); },
      },
      {
        id: 'new-clipboard', type: 'command',
        label: 'New from Clipboard', shortcut: '⌘⇧V',
        icon: <ClipboardPaste size={16} />,
        action: () => { navigator.clipboard.readText().then((t) => { if (t) { createNote(t); handleClose(); } }); },
      },
      {
        id: 'toggle-sidebar', type: 'command',
        label: 'Toggle Sidebar', shortcut: '⌘B',
        icon: <PanelLeft size={16} />,
        action: () => { toggleSidebar(); handleClose(); },
      },
      {
        id: 'toggle-theme', type: 'command',
        label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
        icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
        action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); handleClose(); },
      },
      {
        id: 'delete-note', type: 'command',
        label: 'Delete Current Note',
        icon: <Trash2 size={16} />,
        action: () => { if (selectedNoteId) { deleteNote(selectedNoteId); handleClose(); } },
      },
      {
        id: 'pin-note', type: 'command',
        label: selectedNoteId && notes.find((n) => n.id === selectedNoteId)?.pinned ? 'Unpin Current Note' : 'Pin Current Note',
        icon: <Pin size={16} />,
        action: () => { if (selectedNoteId) { togglePin(selectedNoteId); handleClose(); } },
      },
      {
        id: 'export-all', type: 'command',
        label: 'Export All Notes',
        icon: <Download size={16} />,
        action: () => {
          import('@/lib/export').then(({ exportAllNotes }) => {
            exportAllNotes(notes);
            handleClose();
          });
        },
      },
      {
        id: 'clipboard-mode', type: 'command',
        label: 'Clipboard Mode',
        icon: <ClipboardPaste size={16} />,
        action: () => { setClipboardMode(true); handleClose(); },
      },
      {
        id: 'open-settings', type: 'command',
        label: 'Settings',
        icon: <Settings size={16} />,
        action: () => { onOpenSettings?.(); handleClose(); },
      },
      {
        id: 'username', type: 'command',
        label: auth.username || 'User',
        icon: <User size={16} />,
        action: () => {},
      },
      {
        id: 'sign-out', type: 'command',
        label: 'Sign out',
        icon: <LogOut size={16} />,
        action: () => { auth.signOut(); handleClose(); },
      },
    ];

    const matchingNotes = notes
      .filter((n) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      })
      .map((n): CommandItem => ({
        id: n.id, type: 'note',
        label: n.title || 'Untitled',
        subtitle: n.language,
        icon: <Search size={16} />,
        action: () => { selectNote(n.id); handleClose(); },
      }));

    if (query) {
      return [
        ...matchingNotes,
        ...cmdItems.filter((c) => c.label.toLowerCase().includes(query.toLowerCase())),
      ];
    }
    return cmdItems;
  }, [query, notes, theme, selectedNoteId, createNote, deleteNote, togglePin, toggleSidebar, setTheme, selectNote, handleClose, onOpenSettings, auth, setClipboardMode]);

  const safeSelectedIdx = Math.min(selectedIdx, allItems.length - 1);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && allItems[safeSelectedIdx]) {
        e.preventDefault();
        allItems[safeSelectedIdx].action();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, allItems, safeSelectedIdx]);

  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-idx="${safeSelectedIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [safeSelectedIdx]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={handleClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-surface-secondary border border-border rounded-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search size={16} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes or commands..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted outline-none"
          />
          <kbd className="text-[10px] text-muted px-1.5 py-0.5 rounded bg-surface-tertiary border border-border">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {allItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted">No results</div>
          ) : (
            allItems.map((item, idx) => (
              <button
                key={item.id}
                data-idx={idx}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  idx === safeSelectedIdx ? 'bg-accent-muted text-accent' : 'text-foreground hover:bg-surface-hover'
                }`}
              >
                <span className="text-muted">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.subtitle && (
                  <span className="text-[10px] uppercase text-muted">{item.subtitle}</span>
                )}
                {item.shortcut && (
                  <kbd className="text-[10px] text-muted px-1.5 py-0.5 rounded bg-surface-tertiary border border-border">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
