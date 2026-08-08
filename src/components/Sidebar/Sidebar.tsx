'use client';

import FolderTree from './FolderTree';
import NoteList from './NoteList';
import { X } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  mobile: boolean;
  onSelectNote: () => void;
}

export default function Sidebar({ open, mobile, onSelectNote }: SidebarProps) {
  return (
    <>
      {mobile && open && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onSelectNote}
        />
      )}
      <aside
        aria-label="Notes navigation"
        className={`fixed inset-y-0 left-0 z-40 w-full sm:w-80 border-r border-border bg-sidebar pt-[env(safe-area-inset-top)] flex flex-col overflow-hidden transition-transform duration-200 ease-out md:relative md:inset-auto md:z-auto md:w-64 md:translate-x-0 md:pt-0 md:transition-none ${open ? 'translate-x-0' : '-translate-x-full md:hidden'}`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
          <div>
            <p className="text-sm font-semibold text-foreground">Notes</p>
            <p className="text-[11px] text-muted">Browse your workspace</p>
          </div>
          <button type="button" onClick={onSelectNote} aria-label="Close sidebar" className="min-h-9 min-w-9 flex items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <FolderTree />
        <NoteList onSelectNote={onSelectNote} />
      </aside>
    </>
  );
}
