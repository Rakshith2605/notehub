# Implementation Plan: Note Hub

## Overview

Build a single-page web app called "Note Hub" — a smart clipboard and note-taking tool for developers. Paste anything (code, JSON, YAML, plain text, markdown, URLs) and the app instantly detects the type, syntax-highlights it, and organizes it. Entirely client-side with IndexedDB storage.

## Architecture Decisions

- **Next.js 14 App Router** — single-page layout, no multi-route complexity needed; `'use client'` on the page since everything is browser-side
- **Zustand** — flat store for notes, folders, tags, UI state; auto-persist debounced writes to IndexedDB via `idb`
- **Monaco Editor** — loaded via `@monaco-editor/react`; configured with all language grammars for Python, C, C++, Java, JS, TS, SQL, Bash, Go, Rust, JSON, YAML, TOML, Markdown
- **Language detection** — heuristic-based in `lib/detect.ts`; no network calls. JSON detection: starts with `{` or `[`. YAML: contains `key:` patterns. Code: keyword scoring per language
- **IndexedDB via `idb`** — single database `notehub` with object stores: `notes`, `folders`, `tags`
- **No backend** — everything runs client-side. Export uses `jszip` + `file-saver` for bulk zip download

## Dependency Graph

```
Types (types/index.ts)
    │
    ├── DB Layer (lib/db.ts) ─── Export/Import (lib/export.ts)
    │       │
    │       ├── Zustand Store (hooks/useNotes.ts)
    │       │       │
    │       │       ├── Sidebar Components (NoteList, FolderTree, SearchBar)
    │       │       ├── Editor Components (EditorPane, Toolbar, LanguageBadge)
    │       │       ├── StatusBar
    │       │       ├── CommandPalette
    │       │       └── TagManager
    │       │
    │       └── Keyboard Shortcuts (hooks/useKeyboardShortcuts.ts)
    │
    └── Language Detection (lib/detect.ts)
            │
            └── Formatters (lib/formatters.ts)
                    │
                    └── Editor Toolbar, JsonTreeView, DiffView
```

## Task List

### Phase 1: Foundation

#### Task 1: Project scaffold and configuration

**Description:** Bootstrap Next.js 14 with App Router, install all dependencies, configure Tailwind with dark theme defaults, set up global CSS with custom properties.

**Acceptance criteria:**
- [ ] `npx create-next-app@14` with TypeScript, Tailwind, App Router, src/ directory
- [ ] Dependencies installed: `@monaco-editor/react`, `zustand`, `idb`, `nanoid`, `lucide-react`, `jszip`, `file-saver`
- [ ] Dev dependencies: `@types/file-saver`
- [ ] `tailwind.config.ts` configured with dark mode `class`, custom colors (accent blue/emerald, neutral grays)
- [ ] `globals.css` with dark theme CSS variables, JetBrains Mono font import, base resets
- [ ] `layout.tsx` with dark class by default, Geist Sans font

**Verification:**
- [ ] `npm run dev` starts without errors
- [ ] Page renders with dark background

**Dependencies:** None

**Files:**
- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

**Estimated scope:** S

---

#### Task 2: Types, DB layer, and Zustand store

**Description:** Define TypeScript interfaces, implement IndexedDB CRUD operations via `idb`, and create the Zustand store with actions for notes, folders, and tags. The store loads from DB on init and auto-persists changes (debounced 500ms).

**Acceptance criteria:**
- [ ] `types/index.ts` exports `Note`, `Folder`, `Tag` interfaces matching spec data model
- [ ] `lib/db.ts` exports: `getAllNotes()`, `saveNote()`, `deleteNote()`, `getAllFolders()`, `saveFolder()`, `deleteFolder()`, `getAllTags()`, `saveTag()`, `deleteTag()`
- [ ] `hooks/useNotes.ts` (Zustand store) exports store with:
  - State: `notes[]`, `folders[]`, `tags[]`, `selectedNoteId`, `isLoading`
  - Actions: `createNote`, `updateNote`, `deleteNote`, `selectNote`, `createFolder`, `deleteFolder`, `addTag`, `removeTag`, `setNoteFolder`, `togglePin`
  - Auto-load from DB on store creation (hydration)
  - Auto-save to DB on state changes (debounced 500ms, using `zustand/middleware` subscribe)

**Verification:**
- [ ] `npm run build` succeeds
- [ ] Types compile without errors

**Dependencies:** None (parallel with Task 1)

**Files:**
- `src/types/index.ts`
- `src/lib/db.ts`
- `src/hooks/useNotes.ts`

**Estimated scope:** M

---

#### Task 3: Basic shell layout

**Description:** Build the app layout: collapsible sidebar (with placeholder folder tree and note list), main editor area (placeholder div), status bar, and top header bar. Apply dark theme styling throughout. Sidebar toggle via button and `Cmd+B`.

**Acceptance criteria:**
- [ ] `page.tsx` renders three-column layout: sidebar | editor | (no right panel yet)
- [ ] `Sidebar.tsx` — collapsible sidebar with toggle button, contains placeholder `FolderTree` and `NoteList`
- [ ] `FolderTree.tsx` — shows "All Notes", "Pinned" (static sections)
- [ ] `NoteList.tsx` — renders list of notes from store with title, language badge, timestamp, pin icon
- [ ] `StatusBar.tsx` — shows character count, line count, language label, validation status
- [ ] Header bar with app title "Note Hub", search input placeholder, "+ New" button
- [ ] Dark theme applied globally (dark grays, accent highlights)
- [ ] Collapse sidebar via button or `Cmd+B` (just the UI toggle, shortcut binding comes later)
- [ ] Create new note on "+" click → note appears in sidebar, selected in editor
- [ ] Select note in sidebar → content loads in editor area
- [ ] Delete note (context menu or button)
- [ ] Clicking empty area creates a new note

**Verification:**
- [ ] `npm run build` succeeds without errors
- [ ] Manual: can create, select, delete notes; sidebar shows note list; status bar shows counts

**Dependencies:** Task 2

**Files:**
- `src/app/page.tsx`
- `src/components/Sidebar/Sidebar.tsx`
- `src/components/Sidebar/NoteList.tsx`
- `src/components/Sidebar/FolderTree.tsx`
- `src/components/StatusBar.tsx`

**Estimated scope:** M

---

### Checkpoint: Foundation
- [ ] `npm run build` passes
- [ ] App launches with dark layout
- [ ] Can create, select, and delete notes
- [ ] Data persists across page reloads (IndexedDB)

---

### Phase 2: Core Editor

#### Task 4: Monaco editor integration

**Description:** Replace the placeholder editor div with Monaco Editor. Configure syntax highlighting for all supported languages, enable line numbers, word wrap toggle, minimap toggle, and font size options.

**Acceptance criteria:**
- [ ] `EditorPane.tsx` wraps `@monaco-editor/react` Editor component
- [ ] Editor loads with content of selected note from store
- [ ] On content change → updates store (auto-saves to DB via debounce)
- [ ] Language is set on the Monaco model based on note's detected/manual language
- [ ] Supported languages mapped to Monaco language IDs (python, c, cpp, java, javascript, typescript, sql, shell, go, rust, json, yaml, markdown, plaintext)
- [ ] Line numbers always visible
- [ ] Word wrap toggle button in toolbar area
- [ ] Minimap toggle button
- [ ] Font size selector (12, 14, 16, 18, 20px)
- [ ] Editor fills available space, resizes with window

**Verification:**
- [ ] Editor renders with syntax highlighting for JS/Python/JSON
- [ ] Typing updates the note content in store

**Dependencies:** Task 3

**Files:**
- `src/components/Editor/EditorPane.tsx`
- `src/components/Editor/Toolbar.tsx`

**Estimated scope:** M

---

#### Task 5: Language detection engine and auto-detect on paste

**Description:** Implement heuristic-based language detection in `lib/detect.ts`. Detect JSON, YAML, TOML, Markdown, code languages (Python, C, C++, Java, JS, TS, SQL, Bash, Go, Rust), URLs, and plain text. Wire up auto-detection on paste. Show detected language as a badge above the editor.

**Acceptance criteria:**
- [ ] `lib/detect.ts` exports `detectLanguage(content: string): string`
- [ ] JSON detection: content trims to `{` or `[` at start → validate JSON parse, return `json`
- [ ] YAML detection: contains `key:` pattern lines, no braces/brackets at start → `yaml`
- [ ] TOML detection: contains `[section]` or `key = "value"` patterns → `toml`
- [ ] Markdown detection: contains `#`, `##`, `- `, `* `, `**` patterns → `markdown`
- [ ] URL detection: content is a single URL string → `url`
- [ ] Code detection: keyword-based scoring per language (Python: `def`, `import`, `class`; JS/TS: `const`, `let`, `function`; Go: `func`, `package`; Rust: `fn`, `let mut`, `impl`; etc.)
- [ ] Falls back to `plaintext`
- [ ] `LanguageBadge.tsx` component — shows detected language as a colored pill badge
- [ ] Editor pane listens for paste events → runs detection → updates note language + applies Monaco highlighting
- [ ] Language badge fades in with animation on detection
- [ ] Manual language override dropdown in toolbar (overrides auto-detect, persists as manual choice)

**Verification:**
- [ ] Paste `{"key": "value"}` → auto-detects JSON, highlights, shows "JSON" badge
- [ ] Paste Python code with `def foo():` → auto-detects Python
- [ ] Paste `https://example.com` → detected as URL, renders as clickable link
- [ ] Manual override works and persists

**Dependencies:** Task 4

**Files:**
- `src/lib/detect.ts`
- `src/components/Editor/LanguageBadge.tsx`
- `src/components/Editor/EditorPane.tsx` (modify)
- `src/components/Editor/Toolbar.tsx` (modify)

**Estimated scope:** M

---

#### Task 6: Sidebar note list polish

**Description:** Flesh out the sidebar note list with auto-titles (first meaningful line, truncated), relative timestamps, pin toggling, context menu actions, and a polished dark-themed appearance.

**Acceptance criteria:**
- [ ] Auto-title: extract first non-empty line, truncate to 60 chars, update on content change
- [ ] Relative timestamps: "2 min ago", "Yesterday", "May 3"
- [ ] Pin toggle: click pin icon → toggles `note.pinned`, pinned notes float to top
- [ ] Context menu (right-click): Rename, Duplicate, Delete, Export
- [ ] Active note highlighted in sidebar
- [ ] Smooth scroll to active note
- [ ] Empty state: "No notes yet. Create one or paste something." with Cmd+N shortcut hint
- [ ] Delete confirmation for non-empty notes

**Verification:**
- [ ] Create note with multi-line content → title is first line truncated
- [ ] Pin note → moves to top of list
- [ ] Right-click → context menu appears with actions

**Dependencies:** Task 3

**Files:**
- `src/components/Sidebar/NoteList.tsx`
- `src/components/Sidebar/Sidebar.tsx`

**Estimated scope:** S

---

### Checkpoint: Core Editor
- [ ] Monaco editor works with all languages
- [ ] Paste auto-detects and highlights
- [ ] Sidebar shows notes with titles, timestamps, pins
- [ ] Create, select, edit, delete flow works end-to-end

---

### Phase 3: Data Tools

#### Task 7: JSON tools

**Description:** Implement JSON formatting, validation, and copy utilities. Add toolbar buttons for prettify, minify, validate, copy raw, copy formatted, copy minified — all with checkmark animation feedback.

**Acceptance criteria:**
- [ ] `lib/formatters.ts` exports:
  - `prettifyJson(content: string): string` — 2-space indent
  - `minifyJson(content: string): string`
  - `validateJson(content: string): { valid: boolean; error?: string }`
  - `inferJsonSchema(content: string): { key: string; type: string }[]` — shows inferred types of top-level keys
- [ ] Toolbar shows JSON-specific buttons when language is `json`: Prettify, Minify, Validate, Copy buttons
- [ ] Validate button → shows inline error message in status bar or editor overlay
- [ ] Copy buttons show checkmark animation for 1.5s, then revert
- [ ] Schema detection panel: shows key → inferred type (string, number, object, array, boolean, null)
- [ ] Prettify runs automatically on JSON paste (configurable toggle)

**Verification:**
- [ ] Paste minified JSON → auto-prettifies → editor shows formatted JSON
- [ ] Paste invalid JSON → shows validation error in status bar
- [ ] Copy buttons work with animation

**Dependencies:** Task 5 (needs language detection), Task 4

**Files:**
- `src/lib/formatters.ts`
- `src/components/Editor/Toolbar.tsx` (modify)
- `src/components/StatusBar.tsx` (modify)

**Estimated scope:** M

---

#### Task 8: YAML tools and tree view

**Description:** Implement YAML validation, YAML↔JSON conversion. Build a collapsible tree view for JSON/YAML structured data. Add split-pane toggle to show raw text + tree view side by side.

**Acceptance criteria:**
- [ ] `lib/formatters.ts` exports:
  - `validateYaml(content: string): { valid: boolean; error?: string }`
  - `yamlToJson(content: string): string`
  - `jsonToYaml(content: string): string`
- [ ] Toolbar shows YAML-specific buttons: Validate, Convert to JSON
- [ ] `JsonTreeView.tsx` — recursive collapsible tree component
  - Renders JSON/YAML as nested key-value tree
  - Collapse/expand nodes with chevrons
  - Shows types (string, number, boolean, null, array, object)
  - Click to copy value
- [ ] Split pane toggle: button in toolbar toggles right panel with tree view
- [ ] Tree view auto-updates when editor content changes (debounced)

**Verification:**
- [ ] Paste YAML → tree view renders collapsible structure
- [ ] Convert YAML to JSON → editor updates with JSON
- [ ] Split pane toggle shows/hides tree view

**Dependencies:** Task 7

**Files:**
- `src/lib/formatters.ts` (modify)
- `src/components/Editor/JsonTreeView.tsx`
- `src/components/Editor/Toolbar.tsx` (modify)
- `src/app/page.tsx` (modify for split pane layout)

**Estimated scope:** M

---

#### Task 9: Markdown preview

**Description:** When language is detected as `markdown`, offer a preview toggle that renders the markdown as HTML in a side panel using a simple markdown parser (no heavy library needed — use a small parser or regex-based renderer).

**Acceptance criteria:**
- [ ] Markdown rendered as styled HTML preview
- [ ] Toggle button: "Preview" / "Edit" switches between raw editor and rendered view
- [ ] Handles: headings, bold, italic, code blocks, inline code, links, lists, blockquotes
- [ ] Preview styled to match dark theme
- [ ] Links open in new tab

**Verification:**
- [ ] Type markdown → toggle preview → rendered HTML shows correctly
- [ ] Code blocks in markdown have syntax highlighting

**Dependencies:** Task 5

**Files:**
- `src/components/Editor/EditorPane.tsx` (modify)
- `src/lib/formatters.ts` (modify — add `renderMarkdown`)

**Estimated scope:** S

---

### Checkpoint: Data Tools
- [ ] JSON prettify/validate/minify all work
- [ ] YAML validate/convert work
- [ ] Tree view renders JSON/YAML
- [ ] Markdown preview renders correctly

---

### Phase 4: Organization

#### Task 10: Full-text search

**Description:** Implement full-text search across all note content. Search filters the sidebar note list in real-time. Highlight matching text in results.

**Acceptance criteria:**
- [ ] `SearchBar.tsx` — search input in header or sidebar top
- [ ] Real-time filtering: sidebar note list shows only matching notes
- [ ] Search across note title AND content
- [ ] Highlight matching text in note list titles and excerpts
- [ ] Empty search state: shows all notes
- [ ] `Cmd+F` or `Cmd+K` focuses search (Cmd+K opens command palette, but search is one tab of it)
- [ ] Debounced search (300ms) to avoid jank

**Verification:**
- [ ] Type search term → sidebar filters instantly
- [ ] Matching text highlighted in results
- [ ] Clear search → all notes shown

**Dependencies:** Task 6

**Files:**
- `src/components/Sidebar/SearchBar.tsx`
- `src/components/Sidebar/Sidebar.tsx` (modify)
- `src/hooks/useNotes.ts` (modify — add search selector)

**Estimated scope:** S

---

#### Task 11: Tags

**Description:** Users can add color-coded tags to notes. Tag management UI: create tags with a color picker, assign tags to notes via dropdown/popover, filter notes by tag.

**Acceptance criteria:**
- [ ] `TagManager.tsx` — popover/modal to create/manage tags
- [ ] Create tag: name + color (predefined palette: red, orange, yellow, green, blue, purple, pink)
- [ ] Tag note: dropdown or inline tag bar below editor toolbar to assign/remove tags
- [ ] Tags shown as colored pills on note list items
- [ ] Click tag in sidebar → filters notes by that tag
- [ ] Tags persist in IndexedDB

**Verification:**
- [ ] Create tag "bug" with red color → assign to note → red pill shows in sidebar
- [ ] Click tag pill → only notes with that tag shown

**Dependencies:** Task 6

**Files:**
- `src/components/TagManager.tsx`
- `src/components/Sidebar/NoteList.tsx` (modify)
- `src/components/Editor/Toolbar.tsx` (modify)
- `src/hooks/useNotes.ts` (modify)

**Estimated scope:** S

---

#### Task 12: Folders

**Description:** Implement folder creation and note organization. Users can create folders, drag notes into them, and filter the note list by folder. Sidebar shows folder tree with note counts.

**Acceptance criteria:**
- [ ] Create folder: "+" button in folders section opens inline input
- [ ] Drag note to folder in sidebar (HTML5 drag and drop)
- [ ] Folder tree shows folders with note count badges
- [ ] Click folder → filters note list to notes in that folder
- [ ] "All Notes" shows everything, "Unfiled" shows notes without folder
- [ ] Delete folder → notes become unfiled (not deleted)
- [ ] Rename folder via context menu or double-click

**Verification:**
- [ ] Create folder "Projects" → drag note into it → note list filters correctly
- [ ] Delete folder → notes remain, now unfiled

**Dependencies:** Task 6

**Files:**
- `src/components/Sidebar/FolderTree.tsx`
- `src/components/Sidebar/NoteList.tsx` (modify)
- `src/hooks/useNotes.ts` (modify)

**Estimated scope:** M

---

#### Task 13: Pin and sort

**Description:** Pinned notes float to top. Sort options: by date created, date modified, or alphabetical. Sort selector in sidebar header.

**Acceptance criteria:**
- [ ] Pinned notes always appear at top of note list (within current folder filter)
- [ ] Sort dropdown: "Newest", "Oldest", "Recently modified", "A-Z"
- [ ] Sort preference persisted in store (not in DB, just local state)
- [ ] Visual divider between pinned and unpinned notes

**Verification:**
- [ ] Pin 2 notes → they appear at top with a subtle divider
- [ ] Change sort → list reorders immediately

**Dependencies:** Task 6

**Files:**
- `src/components/Sidebar/NoteList.tsx` (modify)
- `src/components/Sidebar/Sidebar.tsx` (modify)
- `src/hooks/useNotes.ts` (modify)

**Estimated scope:** S

---

### Checkpoint: Organization
- [ ] Search filters notes in real-time
- [ ] Tags work end-to-end (create, assign, filter)
- [ ] Folders work end-to-end (create, drag, filter)
- [ ] Pin and sort work correctly

---

### Phase 5: Power Features

#### Task 14: Keyboard shortcuts

**Description:** Implement all keyboard shortcuts using a custom hook. Register global keybindings with proper meta/ctrl key handling for Mac and Windows.

**Acceptance criteria:**
- [ ] `hooks/useKeyboardShortcuts.ts` — registers event listeners, maps shortcuts to store actions
- [ ] `Cmd+N` / `Ctrl+N` — creates new note, focuses editor
- [ ] `Cmd+Shift+V` / `Ctrl+Shift+V` — creates new note from clipboard content
- [ ] `Cmd+B` / `Ctrl+B` — toggles sidebar
- [ ] `Cmd+Shift+F` / `Ctrl+Shift+F` — focuses search
- [ ] `Cmd+K` / `Ctrl+K` — opens command palette
- [ ] `Cmd+S` / `Ctrl+S` — forces save (though auto-save handles this, show confirmation)
- [ ] Shortcut hints shown in tooltips and command palette
- [ ] Shortcuts disabled when typing in inputs outside editor (e.g., search bar, tag input)

**Verification:**
- [ ] Press Cmd+N → new note created, editor focused
- [ ] Press Cmd+Shift+V with clipboard content → new note with pasted content
- [ ] Press Cmd+K → command palette opens

**Dependencies:** Task 5, Task 10

**Files:**
- `src/hooks/useKeyboardShortcuts.ts`
- `src/app/page.tsx` (modify — call the hook)

**Estimated scope:** S

---

#### Task 15: Command palette

**Description:** Build a Spotlight/VS Code-style command palette (`Cmd+K`). Search notes, create new, change language, switch folders, access all commands.

**Acceptance criteria:**
- [ ] `CommandPalette.tsx` — modal overlay with search input and results list
- [ ] Opens on `Cmd+K`, closes on `Escape` or click outside
- [ ] Search notes by title (instant fuzzy-ish matching)
- [ ] Commands available: "New Note", "New from Clipboard", "Toggle Sidebar", "Toggle Dark Mode", "Export All Notes", "Delete Current Note"
- [ ] Each result shows: icon (note/command), title, subtitle (language badge for notes)
- [ ] Arrow keys to navigate, Enter to select
- [ ] Keyboard shortcut hints shown on right side of command items
- [ ] Styled to match VS Code command palette dark theme (semi-transparent backdrop, rounded borders)

**Verification:**
- [ ] Press Cmd+K → palette opens, shows note list + commands
- [ ] Type "new" → shows "New Note", "New from Clipboard"
- [ ] Arrow up/down → selects item, Enter → executes

**Dependencies:** Task 14

**Files:**
- `src/components/CommandPalette.tsx`
- `src/app/page.tsx` (modify)

**Estimated scope:** M

---

#### Task 16: Export and import

**Description:** Export individual notes as files (`.json`, `.md`, `.py`, `.txt`, etc. based on language). Bulk export all notes as `.zip`. Import notes by drag-and-drop files onto the app.

**Acceptance criteria:**
- [ ] `lib/export.ts` exports:
  - `exportNote(note: Note)` — downloads single note as appropriate file type
  - `exportAllNotes(notes: Note[])` — downloads zip of all notes
  - `importFile(file: File): Promise<Note>` — reads file, detects language, returns note object
- [ ] Individual export: button in toolbar or note context menu
- [ ] Bulk export: button in header or command palette
- [ ] File extension mapping: json→.json, yaml→.yaml, python→.py, javascript→.js, typescript→.ts, markdown→.md, plaintext→.txt, etc.
- [ ] Drag-and-drop: drop files anywhere on the app → create notes from them
- [ ] Support dropping multiple files at once
- [ ] Show toast/notification on import success

**Verification:**
- [ ] Click "Export" on a JSON note → downloads `note-title.json`
- [ ] Bulk export → downloads `notehub-export.zip` with all notes
- [ ] Drag a `.py` file onto the app → new note created with Python syntax highlighting

**Dependencies:** Task 5

**Files:**
- `src/lib/export.ts`
- `src/components/Editor/Toolbar.tsx` (modify)
- `src/app/page.tsx` (modify — drag-and-drop zone)

**Estimated scope:** M

---

### Checkpoint: Power Features
- [ ] All keyboard shortcuts work
- [ ] Command palette opens, searches, executes
- [ ] Export single + bulk works
- [ ] Drag-and-drop import works

---

### Phase 6: Advanced

#### Task 17: Version history with revert

**Description:** Keep last 10 versions of each note's content. Show version timeline in a side panel. Allow reverting to any previous version.

**Acceptance criteria:**
- [ ] Store saves version on each content change (deduplicated — only if content actually changed)
- [ ] Max 10 versions per note (FIFO eviction)
- [ ] Version panel: toggle in toolbar or status bar opens timeline
- [ ] Timeline shows: version number, timestamp, content preview (first 100 chars)
- [ ] Click version → preview in a diff or inline view
- [ ] "Restore" button → copies version content to current note (creating a new version for the current content first)
- [ ] Version count shown in status bar

**Verification:**
- [ ] Edit a note 5 times → 5 versions saved
- [ ] Open version panel → see timeline
- [ ] Restore version 3 → note content reverts, current content saved as new version

**Dependencies:** Task 2 (store already has `versions` field)

**Files:**
- `src/components/Editor/EditorPane.tsx` (modify — version capture on change)
- `src/components/Editor/Toolbar.tsx` (modify — version panel toggle)
- `src/hooks/useNotes.ts` (modify)

**Estimated scope:** M

---

#### Task 18: Diff view

**Description:** Compare two notes side-by-side using Monaco's built-in diff editor. Select second note from a dropdown or from the sidebar.

**Acceptance criteria:**
- [ ] `DiffView.tsx` — wraps Monaco `DiffEditor` component
- [ ] "Compare" button in toolbar opens diff mode
- [ ] Select comparison note from dropdown showing all notes
- [ ] Shows original note (left, read-only) and comparison note (right)
- [ ] Diff highlighting (added lines in green, removed in red)
- [ ] Close diff view → return to normal editor
- [ ] Also works for version history: compare current version with a previous version

**Verification:**
- [ ] Click "Compare" → select another note → side-by-side diff shown
- [ ] Changed lines highlighted green/red
- [ ] Close diff → back to editor

**Dependencies:** Task 17

**Files:**
- `src/components/Editor/DiffView.tsx`
- `src/components/Editor/EditorPane.tsx` (modify)
- `src/components/Editor/Toolbar.tsx` (modify)

**Estimated scope:** M

---

### Checkpoint: Advanced
- [ ] Version history captures and restores correctly
- [ ] Diff view compares two notes side-by-side

---

### Phase 7: Polish

#### Task 19: Animations, responsive layout, and light theme

**Description:** Add CSS transitions/animations for UI interactions. Make layout responsive (sidebar collapses on narrow screens). Implement light theme toggle that switches CSS variables.

**Acceptance criteria:**
- [ ] Note creation: slide-in animation in sidebar
- [ ] Language badge: fade-in on detection
- [ ] Copy button: checkmark transition (scale + opacity)
- [ ] Sidebar collapse: smooth width transition (300ms ease)
- [ ] Command palette: fade-in backdrop + slide-down modal
- [ ] Responsive breakpoint at 768px:
  - Sidebar becomes full-width overlay triggered by hamburger menu
  - Editor takes full width when sidebar closed
- [ ] Light theme toggle: sun/moon icon in header
- [ ] Light theme colors defined in `globals.css` via CSS custom properties
- [ ] Theme preference persisted in `localStorage`
- [ ] Respect system preference on first load (`prefers-color-scheme`)

**Verification:**
- [ ] Create note → slides into sidebar
- [ ] Paste content → badge fades in
- [ ] Click copy → checkmark animates
- [ ] Resize to mobile width → hamburger menu, sidebar overlay
- [ ] Toggle light theme → all colors switch, persists on reload

**Dependencies:** All prior tasks

**Files:**
- `src/app/globals.css` (modify)
- `src/app/layout.tsx` (modify — theme provider)
- `src/components/Sidebar/Sidebar.tsx` (modify)
- `src/components/StatusBar.tsx` (modify)
- `src/hooks/useNotes.ts` (modify — theme state)
- Various components (add transition classes)

**Estimated scope:** M

---

#### Task 20: Final integration testing and bug fixes

**Description:** Run through all user flows, fix edge cases, ensure everything works together. Handle empty states, error boundaries, loading states for Monaco.

**Acceptance criteria:**
- [ ] Full flow: create note → paste content → auto-detect → edit → format → tag → folder → search → export → delete
- [ ] Empty state: no notes → shows helpful CTA
- [ ] Error boundary: Monaco fails to load → fallback textarea
- [ ] No console errors or warnings
- [ ] Performance: IndexedDB operations don't block UI
- [ ] Deletion undo? (at minimum, confirmation dialog)
- [ ] Handle very large pastes (>100K chars) gracefully
- [ ] `npm run build` succeeds with no warnings

**Verification:**
- [ ] `npm run build` passes cleanly
- [ ] Manual smoke test of all features
- [ ] Test on Chrome and Firefox

**Dependencies:** Task 19

**Files:** Various (bug fix locations)

**Estimated scope:** M

---

### Checkpoint: Complete
- [ ] All features work end-to-end
- [ ] Responsive on mobile and desktop
- [ ] Dark and light themes work
- [ ] Animations are smooth
- [ ] Build passes cleanly

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Monaco Editor bundle size (~3-5MB) impacts initial load | Med | Use Next.js dynamic import with `ssr: false` and loading fallback |
| IndexedDB quota limits in private browsing | Low | Show storage usage in status bar; warn when approaching limits |
| Language detection false positives (e.g., TOML confused with INI) | Low | Allow manual override; detection is a best-effort convenience |
| Monaco web workers not loading correctly in dev | Med | Configure Monaco loader with CDN workers via `@monaco-editor/react` loader config |
| `jszip` + `file-saver` for export — large bundle add | Low | Dynamic import only when export is triggered |
| Drag-and-drop conflicts with Monaco's own drag behavior | Low | Use a drop zone wrapper outside the editor area |

## Open Questions

- Should the app support multiple tabs/panes (open multiple notes simultaneously)? (Spec: no, single editor — keep it simple for v1)
- Should there be a trash/deleted notes recovery? (Spec: no, but add delete confirmation — keep it simple for v1)
- Should markdown preview support Mermaid diagrams or syntax-highlighted code blocks? (Revisit after v1)
- What happens when IndexedDB is not available (private Safari)? Show a warning banner and fall back to in-memory state with localStorage backup.
