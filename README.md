# Obsidian Flint

Obsidian Flint is a fully local, Obsidian-inspired knowledge management desktop application. It mirrors the core workflows of Obsidian—vault-based Markdown note taking, backlinks, tags, graph visualization, and a lightweight plugin runtime—while ensuring that every action runs on the user’s machine. No remote services are required.

## Features

- **Vault-based storage** – Notes, attachments, snippets, themes, and plugins live in a user-selectable vault folder on disk.
- **Local Markdown editor** – Rich editor with live preview, tagging, wiki-linking, and syntax-aware rendering implemented without remote assets.
- **Backlinks and tags** – Automatic metadata extraction for tags (`#tag`) and wiki links (`[[Note]]`) keeps contextual navigation local.
- **Graph view** – Canvas-based visualization of note relationships derived from the vault metadata.
- **Command palette and plugins** – Deterministic plugin sandbox that loads JavaScript plugins from the vault and exposes command registration APIs.
- **Theme awareness** – Follows the OS dark/light preference and updates the renderer without remote assets.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm 9 or newer (bundled with Node.js)

### Install dependencies

```bash
npm install
```

### Run the desktop app

```bash
npm start
```

The first launch creates a default vault at `~/Documents/ObsidianFlintVault`. You can switch to an existing folder at any time using **Switch Vault** in the sidebar.

### Package a Windows installer

```bash
npm run package:win
```

The installer will be generated in the `dist/` directory. Packaging runs fully offline and bundles all local assets.

## Project structure

```
app/
  main.js          # Electron main process and IPC handlers
  preload.js       # Secure bridge exposing allowed APIs to the renderer
  plugin-host.js   # Local plugin sandbox and command registry
  renderer/
    index.html     # Renderer shell with sidebar, editor, preview, and graph view
    app.js         # UI logic for notes, tags, search, and plugin execution
    markdown.js    # Offline Markdown renderer with wiki link + tag styling
    graph.js       # Canvas-based knowledge graph renderer
    styles.css     # Obsidian-inspired theming with dark/light support
```

All persistent data resides inside the selected vault directory. The default layout is:

```
<vault>/
  notes/          # Markdown notes (.md)
  attachments/    # Binary assets linked from notes
  snippets/       # CSS snippets applied locally (future use)
  themes/         # Custom theme overrides (future use)
  plugins/        # JavaScript plugins with manifest.json + main.js
```

## Plugin development

Plugins are plain JavaScript modules placed under `<vault>/plugins/<plugin-id>/`. Each plugin must provide a `manifest.json` and a `main.js` file.

`manifest.json` example:

```json
{
  "id": "daily-note",
  "name": "Daily Note Commands",
  "version": "1.0.0"
}
```

`main.js` example:

```js
exports.onload = function () {
  app.registerCommand({
    id: 'create-daily',
    name: 'Create Daily Note',
    callback() {
      const today = new Date().toISOString().slice(0, 10);
      const file = `Daily/${today}.md`;
      if (!vault.listNotes().some((note) => note.path === file)) {
        vault.write(file, `# ${today}\n\n`);
      }
      app.showNotice(`Daily note ready: ${file}`);
    },
  });
};
```

Available sandbox APIs:

- `app.getVaultPath()` – absolute path to the active vault
- `app.registerCommand({ id, name, callback })` – register a command shown in the sidebar
- `app.showNotice(message)` – push a toast notification to the renderer
- `vault.listNotes()` – array of `{ path, title, modified }`
- `vault.read(relativePath)` / `vault.write(relativePath, content)`
- `vault.rename(oldPath, newPath)` / `vault.delete(relativePath)`

Reload plugins via **Reload plugins** in the sidebar. All plugin execution happens locally and shares the renderer’s event bus only through the exposed APIs.

## Local-first guarantees

- Vault content is read and written using Node.js file system APIs. No network calls are made.
- Markdown rendering, search, tag extraction, and graph generation are implemented with local algorithms.
- Plugins are executed via Node.js `vm` contexts and have no implicit network access beyond what the plugin author writes.
- The renderer loads only bundled JavaScript and CSS assets; there are no CDN or remote font dependencies.

## Contributing

1. Fork and clone the repository.
2. Create a feature branch.
3. Run `npm run format` before committing.
4. Ensure `npm start` launches successfully.
5. Submit a pull request describing the change.

All contributions should preserve the local-first behavior and avoid introducing network requirements.
