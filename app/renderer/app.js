const state = {
  notes: [],
  metadata: { notes: {}, tags: {}, links: {} },
  graph: { nodes: [], edges: [] },
  commands: [],
  vaultPath: "",
  activeNote: null,
  preview: false,
};

const elements = {};

function cacheElements() {
  elements.noteList = document.getElementById("note-list");
  elements.tagList = document.getElementById("tag-list");
  elements.commandList = document.getElementById("command-list");
  elements.searchInput = document.getElementById("search");
  elements.searchResults = document.getElementById("search-results");
  elements.editor = document.getElementById("editor");
  elements.preview = document.getElementById("preview");
  elements.graphView = document.getElementById("graph-view");
  elements.graphCanvas = document.getElementById("graph-canvas");
  elements.status = document.getElementById("status-message");
  elements.noteTitle = document.getElementById("note-title");
  elements.saveButton = document.getElementById("save-note");
  elements.deleteButton = document.getElementById("delete-note");
  elements.renameButton = document.getElementById("rename-note");
  elements.previewButton = document.getElementById("toggle-preview");
  elements.graphButton = document.getElementById("open-graph");
  elements.newNoteButton = document.getElementById("new-note");
  elements.selectVaultButton = document.getElementById("select-vault");
  elements.reloadPluginsButton = document.getElementById("reload-plugins");
}

function sanitizeTitle(title) {
  return title.replace(/[\\/:*?"<>|]/g, "").trim();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatPathFromTitle(title) {
  const sanitized = sanitizeTitle(title);
  return sanitized ? `${sanitized}.md` : "Untitled.md";
}

function setStatus(message) {
  elements.status.textContent = message;
}

function updateTheme(theme) {
  document.body.classList.toggle("theme-light", theme === "light");
  document.body.classList.toggle("theme-dark", theme !== "light");
}

function applyState(payload) {
  state.vaultPath = payload.vaultPath;
  state.notes = payload.notes || [];
  state.metadata = payload.metadata || { notes: {}, tags: {}, links: {} };
  state.graph = payload.graph || { nodes: [], edges: [] };
  state.commands = payload.commands || [];
  updateTheme(payload.theme || "dark");
  renderNoteList();
  renderTags();
  renderCommands();
  if (state.activeNote && !state.metadata.notes[state.activeNote]) {
    state.activeNote = null;
    elements.editor.value = "";
    elements.noteTitle.value = "";
  }
  if (state.preview) {
    renderPreview();
  }
  GraphView.render(elements.graphCanvas, state.graph, state.activeNote);
  setStatus(`Vault: ${state.vaultPath}`);
}

function renderNoteList() {
  elements.noteList.innerHTML = "";
  state.notes.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note.title;
    li.dataset.path = note.path;
    if (note.path === state.activeNote) {
      li.classList.add("active");
    }
    li.addEventListener("click", () => openNote(note.path));
    elements.noteList.appendChild(li);
  });
}

function renderTags() {
  elements.tagList.innerHTML = "";
  const entries = Object.entries(state.metadata.tags).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  entries.forEach(([tag, notes]) => {
    const li = document.createElement("li");
    li.textContent = `#${tag} (${notes.length})`;
    li.addEventListener("click", () => {
      filterNotesByTag(tag);
    });
    elements.tagList.appendChild(li);
  });
}

function renderCommands() {
  elements.commandList.innerHTML = "";
  state.commands.forEach((command) => {
    const li = document.createElement("li");
    li.textContent = `${command.name} — ${command.plugin}`;
    li.addEventListener("click", () =>
      window.obsidian.executeCommand(command.id),
    );
    elements.commandList.appendChild(li);
  });
}

async function openNote(path) {
  const content = await window.obsidian.readNote(path);
  state.activeNote = path;
  elements.editor.value = content;
  const meta = state.metadata.notes[path];
  elements.noteTitle.value = meta ? meta.title : path.replace(/\.md$/, "");
  state.preview = false;
  elements.preview.classList.add("hidden");
  elements.graphView.classList.add("hidden");
  elements.editor.classList.remove("hidden");
  elements.previewButton.textContent = "Preview";
  setStatus(`Opened ${path}`);
  renderNoteList();
  GraphView.render(elements.graphCanvas, state.graph, state.activeNote);
}

async function saveActiveNote() {
  if (!state.activeNote) {
    setStatus("No note selected.");
    return;
  }
  const content = elements.editor.value;
  const currentMeta = state.metadata.notes[state.activeNote];
  const currentTitle = currentMeta
    ? currentMeta.title
    : state.activeNote.replace(/\.md$/, "");
  const desiredTitle = sanitizeTitle(elements.noteTitle.value) || "Untitled";
  if (desiredTitle !== currentTitle) {
    const baseDir = state.activeNote.includes("/")
      ? `${state.activeNote.substring(0, state.activeNote.lastIndexOf("/") + 1)}`
      : "";
    const newPath = `${baseDir}${formatPathFromTitle(desiredTitle)}`;
    const renameResponse = await window.obsidian.renameNote(
      state.activeNote,
      newPath,
    );
    state.activeNote = newPath;
    applyState(renameResponse);
  }
  const response = await window.obsidian.writeNote(state.activeNote, content);
  applyState(response);
  if (state.preview) {
    renderPreview();
  }
  setStatus("Note saved.");
}

function filterNotesByTag(tag) {
  const tagged = state.metadata.tags[tag] || [];
  const filtered = state.notes.filter((note) => tagged.includes(note.path));
  elements.noteList.innerHTML = "";
  filtered.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note.title;
    li.dataset.path = note.path;
    li.addEventListener("click", () => openNote(note.path));
    elements.noteList.appendChild(li);
  });
  setStatus(`Filter: #${tag}`);
}

async function createNote() {
  const title = prompt("Note title");
  if (title === null) return;
  const sanitized = sanitizeTitle(title) || "Untitled";
  const { relative } = await window.obsidian.createNote("", sanitized);
  await refreshState();
  openNote(relative);
}

async function deleteNote() {
  if (!state.activeNote) return;
  if (!confirm(`Delete ${state.activeNote}?`)) return;
  const response = await window.obsidian.deleteNote(state.activeNote);
  applyState(response);
  state.activeNote = null;
  elements.editor.value = "";
  elements.noteTitle.value = "";
  setStatus("Note deleted.");
}

async function renameNote() {
  if (!state.activeNote) return;
  const currentMeta = state.metadata.notes[state.activeNote];
  const currentTitle = currentMeta
    ? currentMeta.title
    : state.activeNote.replace(/\.md$/, "");
  const newTitle = prompt("Rename note", currentTitle);
  if (newTitle === null) return;
  const sanitized = sanitizeTitle(newTitle) || "Untitled";
  const baseDir = state.activeNote.includes("/")
    ? `${state.activeNote.substring(0, state.activeNote.lastIndexOf("/") + 1)}`
    : "";
  const newPath = `${baseDir}${formatPathFromTitle(sanitized)}`;
  const response = await window.obsidian.renameNote(state.activeNote, newPath);
  state.activeNote = newPath;
  applyState(response);
  openNote(newPath);
}

function renderPreview() {
  if (!state.activeNote) return;
  const content = elements.editor.value;
  elements.preview.innerHTML = Markdown.render(content);
}

function togglePreview() {
  if (!state.activeNote) return;
  state.preview = !state.preview;
  if (state.preview) {
    renderPreview();
    elements.preview.classList.remove("hidden");
    elements.editor.classList.add("hidden");
    elements.graphView.classList.add("hidden");
    elements.previewButton.textContent = "Edit";
  } else {
    elements.preview.classList.add("hidden");
    elements.editor.classList.remove("hidden");
    elements.previewButton.textContent = "Preview";
  }
}

function toggleGraph() {
  if (!state.activeNote) return;
  const isHidden = elements.graphView.classList.contains("hidden");
  if (isHidden) {
    elements.graphView.classList.remove("hidden");
    elements.preview.classList.add("hidden");
    elements.editor.classList.add("hidden");
    GraphView.render(elements.graphCanvas, state.graph, state.activeNote);
    elements.graphButton.textContent = "Close Graph";
  } else {
    elements.graphView.classList.add("hidden");
    elements.editor.classList.remove("hidden");
    elements.graphButton.textContent = "Graph";
  }
}

let searchTimeout;
function handleSearchInput(event) {
  const query = event.target.value;
  clearTimeout(searchTimeout);
  if (!query) {
    elements.searchResults.innerHTML = "";
    renderNoteList();
    return;
  }
  searchTimeout = setTimeout(async () => {
    const results = await window.obsidian.searchNotes(query);
    elements.searchResults.innerHTML = "";
    results.forEach((result) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escapeHtml(result.title)}</strong><br /><span>${escapeHtml(result.snippet)}</span>`;
      li.addEventListener("click", () => openNote(result.path));
      elements.searchResults.appendChild(li);
    });
    setStatus(`${results.length} result(s) for "${query}"`);
  }, 150);
}

function showNotice(payload) {
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.innerHTML = `<strong>${escapeHtml(payload.plugin)}</strong><br />${escapeHtml(payload.message)}`;
  document.body.appendChild(notice);
  setTimeout(() => {
    notice.remove();
  }, 4000);
}

async function selectVault() {
  const payload = await window.obsidian.selectVault();
  if (payload) {
    applyState(payload);
  }
}

async function reloadPlugins() {
  const commands = await window.obsidian.reloadPlugins();
  state.commands = commands;
  renderCommands();
  setStatus("Plugins reloaded.");
}

async function refreshState() {
  const payload = await window.obsidian.loadState();
  applyState(payload);
}

function attachEvents() {
  elements.saveButton.addEventListener("click", saveActiveNote);
  elements.deleteButton.addEventListener("click", deleteNote);
  elements.renameButton.addEventListener("click", renameNote);
  elements.previewButton.addEventListener("click", togglePreview);
  elements.graphButton.addEventListener("click", toggleGraph);
  elements.newNoteButton.addEventListener("click", createNote);
  elements.searchInput.addEventListener("input", handleSearchInput);
  elements.selectVaultButton.addEventListener("click", selectVault);
  elements.reloadPluginsButton.addEventListener("click", reloadPlugins);
  elements.editor.addEventListener("input", () => {
    if (state.preview) {
      renderPreview();
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  attachEvents();
  const payload = await window.obsidian.loadState();
  applyState(payload);
  window.obsidian.onVaultUpdated(applyState);
  window.obsidian.onPluginNotice(showNotice);
  window.obsidian.onThemeUpdated(updateTheme);
});
