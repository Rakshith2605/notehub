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