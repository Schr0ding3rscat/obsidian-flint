import type { WorkspaceState } from "@shared/workspace";

declare global {
  interface Window {
    workspaceAPI?: {
      loadState?: () => Promise<WorkspaceState>;
      saveState?: (state: WorkspaceState) => Promise<WorkspaceState | void>;
      onStateUpdated?: (listener: (state: WorkspaceState) => void) => () => void;
    };
  }
}

export {};
