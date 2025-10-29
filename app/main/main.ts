import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { WorkspaceStore } from "./workspaceStore";
import { WorkspaceState } from "../shared/workspace";

const workspaceStore = new WorkspaceStore();

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: "Obsidian Flint"
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../../dist/renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  await workspaceStore.initialize(app.getPath("userData"));
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("workspace:load", async (): Promise<WorkspaceState> => {
  return workspaceStore.load();
});

ipcMain.handle("workspace:save", async (_event, state: WorkspaceState): Promise<WorkspaceState> => {
  const savedState = await workspaceStore.save(state);
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("workspace:updated", savedState);
  }
  return savedState;
});
