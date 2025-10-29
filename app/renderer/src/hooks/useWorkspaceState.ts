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

function isWorkspaceEqual(a: WorkspaceState, b: WorkspaceState): boolean {
  if (a === b) {
    return true;
  }

  if (a.activeFile !== b.activeFile) {
    return false;
  }

  if (!areArraysEqual(a.openFiles, b.openFiles)) {
    return false;
  }

  if (!areArraysEqual(a.collapsedFolders, b.collapsedFolders)) {
    return false;
  }

  if (a.openPanes.length !== b.openPanes.length) {
    return false;
  }

  for (let index = 0; index < a.openPanes.length; index++) {
    const paneA = a.openPanes[index];
    const paneB = b.openPanes[index];
    if (paneA.id !== paneB.id || paneA.type !== paneB.type || paneA.file !== paneB.file) {
      return false;
    }
  }

  return true;
}

function areArraysEqual(arrA: string[], arrB: string[]): boolean {
  if (arrA.length !== arrB.length) {
    return false;
  }

  return arrA.every((value, index) => value === arrB[index]);
}

export function useWorkspaceState(): UseWorkspaceStateResult {
  const [workspace, setWorkspace] = useState<WorkspaceState>(DEFAULT_WORKSPACE_STATE);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersisted = useRef<WorkspaceState | null>(null);

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
          const normalized = normalize(stored);
          setWorkspace(normalized);
          lastPersisted.current = normalized;
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
      setWorkspace((current) => {
        const next = normalize(state);
        if (isWorkspaceEqual(current, next)) {
          lastPersisted.current = current;
          return current;
        }

        lastPersisted.current = next;
        return next;
      });
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
      saveTimer.current = null;
    }

    if (lastPersisted.current && isWorkspaceEqual(workspace, lastPersisted.current)) {
      return;
    }

    saveTimer.current = setTimeout(() => {
      api
        .saveState(workspace)
        .then(() => {
          lastPersisted.current = workspace;
        })
        .catch((error) => {
          console.warn("Failed to persist workspace state", error);
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [workspace, hydrated]);

  return useMemo(() => [workspace, setWorkspace, hydrated] as UseWorkspaceStateResult, [workspace, hydrated]);
}
