import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { DEFAULT_WORKSPACE_STATE, WorkspaceState, PaneState } from "@shared/workspace";

type UseWorkspaceStateResult = [WorkspaceState, Dispatch<SetStateAction<WorkspaceState>>, boolean];

const SAVE_DEBOUNCE_MS = 300;

function normalize(state: WorkspaceState | Partial<WorkspaceState> | undefined): WorkspaceState {
  const candidate = state ?? {};
  const merged: WorkspaceState = {
    ...DEFAULT_WORKSPACE_STATE,
    ...candidate,
    openFiles: candidate.openFiles?.length ? [...new Set(candidate.openFiles)] : [...DEFAULT_WORKSPACE_STATE.openFiles],
    collapsedFolders: candidate.collapsedFolders ? [...new Set(candidate.collapsedFolders)] : [],
    openPanes: candidate.openPanes?.length
      ? candidate.openPanes.map((pane, index) => normalizePane(pane, index, candidate.activeFile ?? null))
      : [...DEFAULT_WORKSPACE_STATE.openPanes]
  };

  if (!merged.activeFile && merged.openFiles.length) {
    merged.activeFile = merged.openFiles[0];
  }

  return merged;
}

function normalizePane(pane: PaneState | undefined, index: number, fallbackFile: string | null): PaneState {
  return {
    id: pane?.id ?? `pane-${index}`,
    type: pane?.type ?? "editor",
    file: pane?.file ?? fallbackFile
  };
}

export function useWorkspaceState(): UseWorkspaceStateResult {
  const [workspace, setWorkspace] = useState<WorkspaceState>(DEFAULT_WORKSPACE_STATE);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const api = window.workspaceAPI;
        if (!api?.loadState) {
          setWorkspace(DEFAULT_WORKSPACE_STATE);
          setHydrated(true);
          return;
        }
        const stored = await api.loadState();
        if (!cancelled) {
          setWorkspace(normalize(stored));
          setHydrated(true);
        }
      } catch (error) {
        console.warn("Failed to load workspace state", error);
        if (!cancelled) {
          setWorkspace(DEFAULT_WORKSPACE_STATE);
          setHydrated(true);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const api = window.workspaceAPI;
    if (!api?.onStateUpdated) {
      return;
    }

    return api.onStateUpdated((state) => {
      setWorkspace((current) => normalize({ ...current, ...state }));
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const api = window.workspaceAPI;
    if (!api?.saveState) {
      return;
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      api.saveState(workspace).catch((error) => {
        console.warn("Failed to persist workspace state", error);
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [workspace, hydrated]);

  return useMemo(() => [workspace, setWorkspace, hydrated] as UseWorkspaceStateResult, [workspace, hydrated]);
}
