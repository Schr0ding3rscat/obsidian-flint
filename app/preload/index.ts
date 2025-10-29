import { contextBridge, ipcRenderer } from "electron";
import { WorkspaceState } from "../shared/workspace";

type WorkspaceListener = (state: WorkspaceState) => void;

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
