export interface Version {
  content: string;
  timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  language: string;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  versions: Version[];
}

export interface Folder {
  id: string;
  name: string;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Pat {
  id: string;
  name: string;
  prefix: string;
  createdAt: number;
  lastUsedAt: number | null;
}

export interface NewPat {
  id: string;
  name: string;
  prefix: string;
  token: string;
  createdAt: number;
}

export interface ClipboardItem {
  id: string;
  content: string;
  createdAt: number;
}
