const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { EventEmitter } = require("events");

const DEFAULT_DIRS = ["notes", "attachments", "snippets", "themes", "plugins"];
const NOTE_EXT = ".md";

class VaultManager extends EventEmitter {
  constructor() {
    super();
    this.vaultPath = null;
    this.configPath = path.join(app.getPath("userData"), "config.json");
    this.metadata = { notes: {}, tags: {}, links: {} };
    this.watcher = null;
    this.poller = null;
  }

  initialize() {
    const config = this.#readConfig();
    this.vaultPath = config.vaultPath || this.#defaultVaultPath();
    this.#ensureStructure();
    this.refreshMetadata();
    this.#watch();
  }

  #readConfig() {
    try {
      const raw = fs.readFileSync(this.configPath, "utf8");
      return JSON.parse(raw);
    } catch (err) {
      return {};
    }
  }

  #writeConfig(config) {
    try {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(config, null, 2),
        "utf8",
      );
    } catch (err) {
      console.error("Failed to persist config", err);
    }
  }

  #defaultVaultPath() {
    const base = path.join(app.getPath("documents"), "ObsidianFlintVault");
    this.#writeConfig({ vaultPath: base });
    return base;
  }

  #ensureStructure() {
    fs.mkdirSync(this.vaultPath, { recursive: true });
    for (const dir of DEFAULT_DIRS) {
      fs.mkdirSync(path.join(this.vaultPath, dir), { recursive: true });
    }
  }

  setVaultLocation(newPath) {
    this.vaultPath = newPath;
    this.#writeConfig({ vaultPath: newPath });
    this.#ensureStructure();
    this.refreshMetadata();
    this.#watch();
  }

  getVaultPath() {
    return this.vaultPath;
  }

  #watch() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.poller) {
      clearInterval(this.poller);
      this.poller = null;
    }

    const notesDir = path.join(this.vaultPath, "notes");
    try {
      this.watcher = fs.watch(notesDir, { recursive: true }, () => {
        this.refreshMetadata();
        this.emit("change");
      });
    } catch (err) {
      console.warn(
        "File watcher unavailable, falling back to manual refresh.",
        err,
      );
      this.poller = setInterval(() => {
        this.refreshMetadata();
        this.emit("change");
      }, 5000);
    }
  }

  listNotes() {
    const notes = [];
    const base = path.join(this.vaultPath, "notes");

    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith(NOTE_EXT)) {
          const relative = path.relative(base, full).replace(/\\/g, "/");
          notes.push({
            path: relative,
            title: this.#deriveTitle(relative),
            modified: fs.statSync(full).mtimeMs,
          });
        }
      }
    };

    if (fs.existsSync(base)) {
      walk(base);
    }

    notes.sort((a, b) => a.title.localeCompare(b.title));
    return notes;
  }

  #deriveTitle(relativePath) {
    const name = path.basename(relativePath, NOTE_EXT);
    return name.replace(/[-_]/g, " ");
  }

  readNote(relativePath) {
    const full = path.join(this.vaultPath, "notes", relativePath);
    try {
      return fs.readFileSync(full, "utf8");
    } catch (err) {
      if (err.code === "ENOENT") {
        return "";
      }
      throw err;
    }
  }

  writeNote(relativePath, content) {
    const full = path.join(this.vaultPath, "notes", relativePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
    this.refreshMetadata();
    this.emit("change");
  }

  deleteNote(relativePath) {
    const full = path.join(this.vaultPath, "notes", relativePath);
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
      this.refreshMetadata();
      this.emit("change");
    }
  }

  renameNote(oldPath, newPath) {
    const fullOld = path.join(this.vaultPath, "notes", oldPath);
    const fullNew = path.join(this.vaultPath, "notes", newPath);
    fs.mkdirSync(path.dirname(fullNew), { recursive: true });
    fs.renameSync(fullOld, fullNew);
    this.refreshMetadata();
    this.emit("change");
  }

  search(query) {
    const lower = query.toLowerCase();
    const notes = this.listNotes();
    const results = [];
    for (const note of notes) {
      const content = this.readNote(note.path);
      const index = content.toLowerCase().indexOf(lower);
      if (index !== -1) {
        const start = Math.max(index - 40, 0);
        const end = Math.min(index + 40, content.length);
        const snippet = content.substring(start, end).replace(/\n/g, " ");
        results.push({
          path: note.path,
          title: note.title,
          snippet,
        });
      }
    }
    return results;
  }

  refreshMetadata() {
    const notes = this.listNotes();
    const metadata = { notes: {}, tags: {}, links: {} };

    for (const note of notes) {
      const content = this.readNote(note.path);
      const tags = new Set();
      const links = new Set();

      const tagRegex = /(^|\s)#([\p{L}0-9_\-\/]+)/gu;
      let tagMatch;
      while ((tagMatch = tagRegex.exec(content))) {
        const tag = tagMatch[2];
        tags.add(tag);
        metadata.tags[tag] = metadata.tags[tag] || [];
        if (!metadata.tags[tag].includes(note.path)) {
          metadata.tags[tag].push(note.path);
        }
      }

      const linkRegex = /\[\[([^\]]+)\]\]/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(content))) {
        const target = linkMatch[1].trim();
        if (target) {
          links.add(target);
          const key = note.path;
          metadata.links[key] = metadata.links[key] || [];
          if (!metadata.links[key].includes(target)) {
            metadata.links[key].push(target);
          }
        }
      }

      metadata.notes[note.path] = {
        ...note,
        tags: Array.from(tags),
        links: Array.from(links),
      };
    }

    this.metadata = metadata;
  }

  getMetadata() {
    return this.metadata;
  }

  getGraph() {
    const nodes = [];
    const edges = [];
    const noteEntries = Object.entries(this.metadata.notes);

    for (const [pathKey, note] of noteEntries) {
      nodes.push({ id: pathKey, title: note.title });
      const outbound = this.metadata.links[pathKey] || [];
      for (const target of outbound) {
        const resolved = this.#resolveLink(target);
        if (resolved) {
          edges.push({ source: pathKey, target: resolved });
        }
      }
    }

    return { nodes, edges };
  }

  #resolveLink(target) {
    if (this.metadata.notes[target]) {
      return target;
    }

    const matches = Object.keys(this.metadata.notes).filter((key) => {
      const base = path.basename(key, NOTE_EXT);
      return base.toLowerCase() === target.toLowerCase();
    });
    return matches[0] || null;
  }
}

module.exports = VaultManager;
