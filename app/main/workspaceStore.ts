import fs from "fs/promises";
import path from "path";
import { DEFAULT_WORKSPACE_STATE, WorkspaceState } from "../shared/workspace";

export class WorkspaceStore {
  private filePath: string | null = null;
  private cache: WorkspaceState = DEFAULT_WORKSPACE_STATE;

  async initialize(userDataPath: string): Promise<void> {
    this.filePath = path.join(userDataPath, "workspace-state.json");
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    this.cache = await this.load();
  }

  async load(): Promise<WorkspaceState> {
    if (!this.filePath) {
      throw new Error("WorkspaceStore must be initialized before use");
    }

    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(content) as Partial<WorkspaceState>;
      this.cache = this.normalizeState(parsed);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn("Failed to load workspace state", error);
      }
      this.cache = DEFAULT_WORKSPACE_STATE;
    }

    return this.cache;
  }

  async save(state: WorkspaceState): Promise<WorkspaceState> {
    if (!this.filePath) {
      throw new Error("WorkspaceStore must be initialized before use");
    }

    this.cache = this.normalizeState(state);
    await fs.writeFile(this.filePath, JSON.stringify(this.cache, null, 2), "utf-8");
    return this.cache;
  }

  private normalizeState(state: Partial<WorkspaceState> | undefined): WorkspaceState {
    const normalized: WorkspaceState = {
      ...DEFAULT_WORKSPACE_STATE,
      ...state,
      openPanes: state?.openPanes?.length
        ? state.openPanes.map((pane, index) => ({
            id: pane.id ?? `pane-${index}`,
            type: pane.type ?? "editor",
            file: pane.file ?? state?.activeFile ?? DEFAULT_WORKSPACE_STATE.activeFile
          }))
        : DEFAULT_WORKSPACE_STATE.openPanes,
      collapsedFolders: state?.collapsedFolders ?? []
    };

    if (!normalized.activeFile && normalized.openFiles.length > 0) {
      normalized.activeFile = normalized.openFiles[0];
    }

    const active = normalized.activeFile;
    if (active && !normalized.openFiles.includes(active)) {
      normalized.openFiles = [...normalized.openFiles, active];
    }

    return normalized;
  }
}
