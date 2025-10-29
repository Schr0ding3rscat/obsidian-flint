const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("obsidian", {
  loadState: () => ipcRenderer.invoke("load-state"),
  readNote: (path) => ipcRenderer.invoke("read-note", path),
  writeNote: (path, content) => ipcRenderer.invoke("write-note", path, content),
  createNote: (folder, title) =>
    ipcRenderer.invoke("create-note", folder, title),
  deleteNote: (path) => ipcRenderer.invoke("delete-note", path),
  renameNote: (oldPath, newPath) =>
    ipcRenderer.invoke("rename-note", oldPath, newPath),
  searchNotes: (query) => ipcRenderer.invoke("search-notes", query),
  selectVault: () => ipcRenderer.invoke("select-vault"),
  reloadPlugins: () => ipcRenderer.invoke("reload-plugins"),
  executeCommand: (commandId) =>
    ipcRenderer.invoke("execute-command", commandId),
  onVaultUpdated: (callback) =>
    ipcRenderer.on("vault-updated", (_event, payload) => callback(payload)),
  onPluginNotice: (callback) =>
    ipcRenderer.on("plugin-notice", (_event, payload) => callback(payload)),
  onThemeUpdated: (callback) =>
    ipcRenderer.on("theme-updated", (_event, theme) => callback(theme)),
});
