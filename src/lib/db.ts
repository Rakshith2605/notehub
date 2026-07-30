import type { PostgrestError } from '@supabase/supabase-js';
import type { Note, Folder, Tag, Version, ClipboardItem } from '@/types';
import { getSupabase } from '@/lib/supabase';

const NOTES_TABLE = 'notehub_notes';
const FOLDERS_TABLE = 'notehub_folders';
const TAGS_TABLE = 'notehub_tags';
const CLIPBOARD_TABLE = 'notehub_clipboard';

interface NoteRow {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  language: string | null;
  folder_id: string | null;
  tags: unknown;
  pinned: boolean | null;
  created_at: number | string | null;
  updated_at: number | string | null;
  versions: unknown;
}

interface FolderRow {
  id: string;
  user_id: string;
  name: string | null;
  sort_order: number | string | null;
}

interface TagRow {
  id: string;
  user_id: string;
  name: string | null;
  color: string | null;
}

function fail(action: string, error: PostgrestError): never {
  throw new Error(`${action}: ${error.message}`);
}

function toTimestamp(value: number | string | null | undefined): number {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function toVersions(value: unknown): Version[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const maybeVersion = item as Partial<Version>;
    if (typeof maybeVersion.content !== 'string' || typeof maybeVersion.timestamp !== 'number') return [];
    return [{ content: maybeVersion.content, timestamp: maybeVersion.timestamp }];
  });
}

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title || 'Untitled',
    content: row.content || '',
    language: row.language || 'plaintext',
    folderId: row.folder_id,
    tags: toStringArray(row.tags),
    pinned: Boolean(row.pinned),
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
    versions: toVersions(row.versions),
  };
}

function toNoteRow(userId: string, note: Note): NoteRow {
  return {
    id: note.id,
    user_id: userId,
    title: note.title,
    content: note.content,
    language: note.language,
    folder_id: note.folderId,
    tags: note.tags,
    pinned: note.pinned,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    versions: note.versions,
  };
}

function toFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name || 'Untitled folder',
    order: toTimestamp(row.sort_order),
  };
}

function toFolderRow(userId: string, folder: Folder): FolderRow {
  return {
    id: folder.id,
    user_id: userId,
    name: folder.name,
    sort_order: folder.order,
  };
}

function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name || 'Tag',
    color: row.color || 'blue',
  };
}

function toTagRow(userId: string, tag: Tag): TagRow {
  return {
    id: tag.id,
    user_id: userId,
    name: tag.name,
    color: tag.color,
  };
}

export async function getAllNotes(userId: string): Promise<Note[]> {
  const { data, error } = await getSupabase()
    .from(NOTES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) fail('Unable to load notes from Supabase', error);
  return (data || []).map((row) => toNote(row as NoteRow));
}

export async function getNote(userId: string, id: string): Promise<Note | undefined> {
  const { data, error } = await getSupabase()
    .from(NOTES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();

  if (error) fail('Unable to load note from Supabase', error);
  return data ? toNote(data as NoteRow) : undefined;
}

export async function saveNote(userId: string, note: Note): Promise<void> {
  const { error } = await getSupabase()
    .from(NOTES_TABLE)
    .upsert(toNoteRow(userId, note), { onConflict: 'id' });

  if (error) fail('Unable to save note to Supabase', error);
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase()
    .from(NOTES_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) fail('Unable to delete note from Supabase', error);
}

export async function getAllFolders(userId: string): Promise<Folder[]> {
  const { data, error } = await getSupabase()
    .from(FOLDERS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) fail('Unable to load folders from Supabase', error);
  return (data || []).map((row) => toFolder(row as FolderRow));
}

export async function saveFolder(userId: string, folder: Folder): Promise<void> {
  const { error } = await getSupabase()
    .from(FOLDERS_TABLE)
    .upsert(toFolderRow(userId, folder), { onConflict: 'id' });

  if (error) fail('Unable to save folder to Supabase', error);
}

export async function deleteFolder(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase()
    .from(FOLDERS_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) fail('Unable to delete folder from Supabase', error);
}

export async function getAllTags(userId: string): Promise<Tag[]> {
  const { data, error } = await getSupabase()
    .from(TAGS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) fail('Unable to load tags from Supabase', error);
  return (data || []).map((row) => toTag(row as TagRow));
}

export async function saveTag(userId: string, tag: Tag): Promise<void> {
  const { error } = await getSupabase()
    .from(TAGS_TABLE)
    .upsert(toTagRow(userId, tag), { onConflict: 'id' });

  if (error) fail('Unable to save tag to Supabase', error);
}

export async function deleteTag(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase()
    .from(TAGS_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) fail('Unable to delete tag from Supabase', error);
}

interface ClipboardRow {
  id: string;
  user_id: string;
  content: string | null;
  created_at: number | string | null;
}

function toClipboardItem(row: ClipboardRow): ClipboardItem {
  return {
    id: row.id,
    content: row.content || '',
    createdAt: toTimestamp(row.created_at),
  };
}

export async function getClipboardItems(userId: string, limit = 50): Promise<ClipboardItem[]> {
  const { data, error } = await getSupabase()
    .from(CLIPBOARD_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) fail('Unable to load clipboard from Supabase', error);
  return (data || []).map((row) => toClipboardItem(row as ClipboardRow));
}

export async function saveClipboardItem(userId: string, item: ClipboardItem): Promise<void> {
  const { error } = await getSupabase()
    .from(CLIPBOARD_TABLE)
    .insert({
      id: item.id,
      user_id: userId,
      content: item.content,
      created_at: item.createdAt,
    });

  if (error) fail('Unable to save clipboard to Supabase', error);
}

export async function updateClipboardItem(userId: string, id: string, content: string): Promise<void> {
  const { error } = await getSupabase()
    .from(CLIPBOARD_TABLE)
    .update({ content })
    .eq('user_id', userId)
    .eq('id', id);

  if (error) fail('Unable to update clipboard in Supabase', error);
}

export async function deleteClipboardItem(userId: string, id: string): Promise<void> {
  const { error } = await getSupabase()
    .from(CLIPBOARD_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) fail('Unable to delete clipboard item from Supabase', error);
}
