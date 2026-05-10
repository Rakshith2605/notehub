# Paste & Note Hub — Claude Code Build Prompt

Build a single-page web app called **"Note Hub"** — a smart clipboard and note-taking tool for developers. The core idea: paste anything (code, JSON, YAML, plain text, markdown, URLs) and the app instantly detects what it is, syntax-highlights it, and organizes it.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Editor**: Monaco Editor (`@monaco-editor/react`) — VS Code's editor engine
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State**: Zustand (lightweight, no boilerplate)
- **Storage**: Browser IndexedDB via `idb` library (local-first, no backend)
- **Language detection**: Use file signatures + heuristics (JSON starts with `{`/`[`, YAML has `key:` patterns, Python has `def`/`import`, etc.)

## Core Features

### 1. Content types supported

- Plain text
- Markdown (render preview)
- Code blocks with syntax highlighting: Python, C, C++, Java, JavaScript, TypeScript, SQL, Bash, Go, Rust
- JSON — prettify, validate, show errors inline
- YAML — validate, show errors inline
- TOML
- Raw paste dump (fallback)
- URLs — detect and display as clickable links

### 2. Editor UX

- Monaco editor as the primary editing surface
- **Auto-detect language on paste**: when user pastes content, detect the language/format automatically and apply syntax highlighting. No manual mode switching needed. Show detected language as a pill/badge above the editor.
- **Format on paste**: JSON gets auto-prettified, YAML gets validated, code gets properly indented
- **Split pane view for structured data**: for JSON/YAML, offer a toggle to show raw text on the left and a collapsible tree view on the right
- Manual language override dropdown if auto-detect is wrong
- Line numbers, word wrap toggle, minimap toggle
- Multiple font size options

### 3. Organization

- **Sidebar with note list** — each note shows: auto-generated title (first meaningful line of content), detected language badge, timestamp, pin icon
- **Tags**: users can add color-coded tags to notes
- **Folders**: flat folder structure, drag notes into folders
- **Full-text search**: search across all note content, highlight matches
- **Pin/star notes**: pinned notes float to top of the list
- **Auto-title**: generate title from first non-empty line of content, truncated to 60 chars
- **Sort**: by date created, date modified, or alphabetical

### 4. Code & structured data tools

- Syntax highlighting for: Python, C, C++, Java, JavaScript, TypeScript, SQL, Bash, Go, Rust
- **JSON tools**: prettify (2-space indent), minify, validate with error messages, copy formatted, copy minified
- **YAML tools**: validate, convert YAML → JSON, convert JSON → YAML
- **Schema detection**: for JSON, show inferred types of top-level keys
- **Copy buttons**: copy raw, copy formatted, copy minified — all with visual feedback (checkmark animation)
- **Diff view**: compare two notes side-by-side with Monaco's built-in diff editor

### 5. Power features

- **Quick-capture**: `Cmd+N` / `Ctrl+N` creates new note and focuses editor immediately
- **Quick paste**: `Cmd+Shift+V` / `Ctrl+Shift+V` creates new note from clipboard content
- **Version history**: keep last 10 edits per note, allow reverting
- **Export**: export individual notes as `.md`, `.json`, `.py`, `.txt` etc. based on detected language. Bulk export all notes as a `.zip`
- **Import**: drag-and-drop files onto the app to create notes from them
- **Keyboard-first**: `Cmd+K` command palette for searching notes, switching, creating, changing language

## UI/UX Design

### Layout

```
┌──────────────────────────────────────────────────────┐
│  [logo] Paste Hub          [search] [+New] [Cmd+K]  │
├────────────┬─────────────────────────────────────────┤
│            │  [Python ▾] [Format] [Copy] [Split]     │
│  Folders   │─────────────────────────────────────────│
│  > All     │                                         │
│  > Pinned  │                                         │
│  > Code    │         Monaco Editor Area              │
│  > Data    │                                         │
│            │                                         │
│  ────────  │                                         │
│  Notes     │                                         │
│  📌 Note 1 │                                         │
│  Note 2   │                                         │
│  Note 3   │                                         │
│            │                                         │
│            │─────────────────────────────────────────│
│            │  chars: 1,234  lines: 45  JSON valid ✓  │
└────────────┴─────────────────────────────────────────┘
```

### Design direction

- **Dark theme by default** (devs live in dark mode), with light theme toggle
- Clean, minimal, IDE-like aesthetic — think VS Code meets Apple Notes
- Monospace for code areas, sans-serif for UI chrome
- Accent color: a single vibrant tone (electric blue or emerald green) against neutral dark grays
- Subtle animations: note creation slides in, copy button shows checkmark, language detection badge fades in
- Status bar at bottom: character count, line count, language, validation status
- Sidebar is collapsible (toggle or `Cmd+B`)
- Responsive: sidebar collapses to hamburger on narrow screens

### Typography

- UI: system font stack or a clean sans-serif (e.g., Geist Sans)
- Editor/Code: JetBrains Mono or Fira Code (with ligatures)
- Note titles in sidebar: 14px medium weight, secondary text 12px muted

## File structure

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    Sidebar/
      Sidebar.tsx
      NoteList.tsx
      FolderTree.tsx
      SearchBar.tsx
    Editor/
      EditorPane.tsx
      LanguageBadge.tsx
      Toolbar.tsx
      JsonTreeView.tsx
      DiffView.tsx
    StatusBar.tsx
    CommandPalette.tsx
    TagManager.tsx
  hooks/
    useNotes.ts         # Zustand store
    useLanguageDetect.ts
    useKeyboardShortcuts.ts
  lib/
    detect.ts           # Language/format auto-detection
    formatters.ts       # JSON prettify, YAML convert, etc.
    db.ts               # IndexedDB via idb
    export.ts           # Export/import utilities
  types/
    index.ts            # Note, Folder, Tag types
```

## Data model

```typescript
interface Note {
  id: string;           // nanoid
  title: string;        // auto-generated or manual
  content: string;
  language: string;     // detected or manual override
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  versions: { content: string; timestamp: number }[];  // last 10
}

interface Folder {
  id: string;
  name: string;
  order: number;
}

interface Tag {
  id: string;
  name: string;
  color: string;        // hex
}
```

## Implementation priority

Build in this order:

1. **Basic shell**: layout with sidebar + editor pane, dark theme, create/delete/switch notes
2. **Monaco integration**: syntax highlighting for all languages, line numbers, word wrap
3. **Auto-detect on paste**: language detection → apply highlighting → show badge
4. **JSON/YAML tools**: prettify, validate, convert, tree view
5. **Organization**: search, tags, folders, pinning, sorting
6. **Keyboard shortcuts**: Cmd+K palette, quick-create, quick-paste
7. **Power features**: version history, export/import, diff view
8. **Polish**: animations, responsive layout, light theme toggle

## Key principles

- **Zero friction**: paste something → it just works. No config, no mode selection, no sign-up.
- **Fast**: everything happens client-side. No network requests for core functionality.
- **Keyboard-first**: every action reachable via keyboard.
- **Don't lose data**: auto-save to IndexedDB on every keystroke (debounced 500ms).