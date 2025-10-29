export type PaneType = "editor" | "preview";

export interface PaneState {
  id: string;
  type: PaneType;
  file: string | null;
}

export interface WorkspaceState {
  openFiles: string[];
  activeFile: string | null;
  openPanes: PaneState[];
  collapsedFolders: string[];
}

export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  openFiles: ["Welcome.md"],
  activeFile: "Welcome.md",
  openPanes: [
    { id: "editor", type: "editor", file: "Welcome.md" },
    { id: "preview", type: "preview", file: "Welcome.md" }
  ],
  collapsedFolders: []
};
