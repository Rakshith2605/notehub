'use client';

import FolderTree from './FolderTree';
import NoteList from './NoteList';
import TagManager from '@/components/TagManager';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0 overflow-hidden">
      <FolderTree />
      <NoteList />
      <TagManager />
    </aside>
  );
}
