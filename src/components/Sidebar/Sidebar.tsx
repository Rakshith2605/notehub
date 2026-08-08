'use client';

import FolderTree from './FolderTree';
import NoteList from './NoteList';
import TagManager from '@/components/TagManager';

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
        className={`fixed inset-y-0 left-0 z-40 w-[min(20rem,calc(100vw-2rem))] border-r border-border bg-sidebar pt-[env(safe-area-inset-top)] flex flex-col overflow-hidden transition-transform duration-200 ease-out md:relative md:inset-auto md:z-auto md:w-64 md:translate-x-0 md:pt-0 md:transition-none ${open ? 'translate-x-0' : '-translate-x-full md:hidden'}`}
      >
        <FolderTree />
        <NoteList onSelectNote={onSelectNote} />
        <TagManager />
      </aside>
    </>
  );
}
