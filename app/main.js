const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeTheme,
} = require("electron");
const path = require("path");
const VaultManager = require("./vault");
const PluginHost = require("./plugin-host");

let mainWindow;
const vault = new VaultManager();
const pluginHost = new PluginHost(vault);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#1e1e1e",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Obsidian Flint",
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function getStatePayload() {
  return {
    vaultPath: vault.getVaultPath(),
    notes: vault.listNotes(),
    metadata: vault.getMetadata(),
    graph: vault.getGraph(),
    commands: pluginHost.getCommands(),
    theme: nativeTheme.shouldUseDarkColors ? "dark" : "light",
  };
}

app.whenReady().then(() => {
  vault.initialize();
  pluginHost.loadAll();
  createWindow();

  vault.on("change", () => {
    mainWindow?.webContents.send("vault-updated", getStatePayload());
  });

  pluginHost.on("notice", (payload) => {
    mainWindow?.webContents.send("plugin-notice", payload);
  });

  nativeTheme.on("updated", () => {
    mainWindow?.webContents.send(
      "theme-updated",
      nativeTheme.shouldUseDarkColors ? "dark" : "light",
    );
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("load-state", () => {
  return getStatePayload();
});

ipcMain.handle("read-note", (event, relativePath) => {
  return vault.readNote(relativePath);
});

ipcMain.handle("write-note", (event, relativePath, content) => {
  vault.writeNote(relativePath, content);
  return getStatePayload();
});

ipcMain.handle("create-note", (event, folder, title) => {
  const fileName = `${title || "Untitled"}.md`;
  const relative = folder ? path.join(folder, fileName) : fileName;
  vault.writeNote(relative, `# ${title || "Untitled"}\n\n`);
  return { relative };
});

ipcMain.handle("delete-note", (event, relativePath) => {
  vault.deleteNote(relativePath);
  return getStatePayload();
});

ipcMain.handle("rename-note", (event, oldPath, newPath) => {
  vault.renameNote(oldPath, newPath);
  return getStatePayload();
});

ipcMain.handle("search-notes", (event, query) => {
  if (!query) return [];
  return vault.search(query);
});

ipcMain.handle("select-vault", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    vault.setVaultLocation(result.filePaths[0]);
    pluginHost.loadAll();
    return getStatePayload();
  }
  return null;
});

ipcMain.handle("reload-plugins", () => {
  pluginHost.loadAll();
  return pluginHost.getCommands();
});

ipcMain.handle("execute-command", (event, commandId) => {
  pluginHost.executeCommand(commandId);
});
