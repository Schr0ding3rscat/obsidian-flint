import { contextBridge, ipcRenderer } from "electron";
import { WorkspaceState } from "../shared/workspace";
import { McpConnectOptions, McpMessage, McpStatus, McpSendPayload } from "../shared/mcp";

type WorkspaceListener = (state: WorkspaceState) => void;
type McpStatusListener = (status: McpStatus) => void;
type McpMessageListener = (message: McpMessage) => void;

function subscribe<T>(channel: string, listener: (value: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld("workspaceAPI", {
  loadState: async (): Promise<WorkspaceState> => {
    return ipcRenderer.invoke("workspace:load");
  },
  saveState: async (state: WorkspaceState): Promise<void> => {
    await ipcRenderer.invoke("workspace:save", state);
  },
  onStateUpdated: (listener: WorkspaceListener): (() => void) => {
    const channel = "workspace:updated";
    const handler = (_event: Electron.IpcRendererEvent, payload: WorkspaceState) => listener(payload);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  }
});

contextBridge.exposeInMainWorld("mcpAPI", {
  connect: async (options: McpConnectOptions): Promise<{ status: McpStatus; messages: McpMessage[] }> => {
    return ipcRenderer.invoke("mcp:connect", options);
  },
  disconnect: async (): Promise<{ status: McpStatus; messages: McpMessage[] }> => {
    return ipcRenderer.invoke("mcp:disconnect");
  },
  getStatus: async (): Promise<{ status: McpStatus; messages: McpMessage[] }> => {
    return ipcRenderer.invoke("mcp:status");
  },
  send: async (payload: McpSendPayload): Promise<McpMessage> => {
    return ipcRenderer.invoke("mcp:send", payload);
  },
  onStatus: (listener: McpStatusListener): (() => void) => {
    return subscribe("mcp:status", listener);
  },
  onMessage: (listener: McpMessageListener): (() => void) => {
    return subscribe("mcp:message", listener);
  },
  onHistory: (listener: (messages: McpMessage[]) => void): (() => void) => {
    return subscribe("mcp:history", listener);
  }
});
