import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { WorkspaceStore } from "./workspaceStore";
import { WorkspaceState } from "../shared/workspace";
import { McpClient } from "./mcpClient";
import { McpConnectOptions, McpSendPayload } from "../shared/mcp";

const workspaceStore = new WorkspaceStore();
const mcpClient = new McpClient();

function broadcastToAll(channel: string, payload: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

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

  const initialStatus = mcpClient.getStatus();
  const initialMessages = mcpClient.getMessages();
  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.webContents.send("mcp:status", initialStatus);
    mainWindow.webContents.send("mcp:history", initialMessages);
  });
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

ipcMain.handle("mcp:connect", async (_event, options: McpConnectOptions) => {
  const status = await mcpClient.connect(options);
  const messages = mcpClient.getMessages();
  broadcastToAll("mcp:history", messages);
  return { status, messages };
});

ipcMain.handle("mcp:disconnect", async () => {
  const status = mcpClient.disconnect();
  const messages = mcpClient.getMessages();
  broadcastToAll("mcp:history", messages);
  return { status, messages };
});

ipcMain.handle("mcp:status", async () => {
  return { status: mcpClient.getStatus(), messages: mcpClient.getMessages() };
});

ipcMain.handle("mcp:send", async (_event, payload: McpSendPayload) => {
  const message = mcpClient.send(payload);
  return message;
});

mcpClient.on("status", (status) => {
  broadcastToAll("mcp:status", status);
});

mcpClient.on("message", (message) => {
  broadcastToAll("mcp:message", message);
});
