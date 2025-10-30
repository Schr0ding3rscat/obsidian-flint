import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceState } from "./hooks/useWorkspaceState";
import { useMcpConnection } from "./hooks/useMcpConnection";
import { DEFAULT_WORKSPACE_STATE } from "@shared/workspace";
import LeftRibbon from "./components/LeftRibbon";
import FileExplorer from "./components/FileExplorer";
import EditorPane from "./components/EditorPane";
import PreviewPane from "./components/PreviewPane";
import StatusBar from "./components/StatusBar";
import McpConsole from "./components/McpConsole";
import {
  SAMPLE_FILE_TREE,
  DEFAULT_FILE_CONTENT,
  findNodeById,
  type FileNode
} from "./state/fileSystem";

const DEFAULT_THEME: "light" | "dark" = (() => {
  if (typeof window === "undefined") {
    return "dark";
  }
  const stored = window.localStorage?.getItem("obsidian-flint-theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
})();

export default function App(): JSX.Element {
  const [workspace, setWorkspace, hydrated] = useWorkspaceState();
  const [files, setFiles] = useState<Record<string, string>>(() => ({ ...DEFAULT_FILE_CONTENT }));
  const [activeTool, setActiveTool] = useState("files");
  const [theme, setTheme] = useState<"light" | "dark">(DEFAULT_THEME);
  const {
    status: mcpStatus,
    messages: mcpMessages,
    pending: mcpPending,
    connect: connectMcp,
    disconnect: disconnectMcp,
    send: sendMcp
  } = useMcpConnection();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage?.setItem("obsidian-flint-theme", theme);
  }, [theme]);

  const activeFile = workspace.activeFile ?? DEFAULT_WORKSPACE_STATE.activeFile;
  const activeContent = activeFile ? files[activeFile] ?? "" : "";

  const openPanes = workspace.openPanes;

  useEffect(() => {
    if (hydrated && activeFile && !files[activeFile]) {
      setFiles((prev) => ({ ...prev, [activeFile]: "" }));
    }
  }, [hydrated, activeFile, files]);

  const handleSelectFile = (node: FileNode) => {
    if (node.type !== "file") {
      return;
    }

    setWorkspace((prev) => {
      const openFiles = prev.openFiles.includes(node.id) ? prev.openFiles : [...prev.openFiles, node.id];
      const updatedPanes = prev.openPanes.map((pane) =>
        pane.type === "editor" || pane.type === "preview" ? { ...pane, file: node.id } : pane
      );

      return {
        ...prev,
        activeFile: node.id,
        openFiles,
        openPanes: updatedPanes
      };
    });
  };

  const handleToggleFolder = (folderId: string) => {
    setWorkspace((prev) => {
      const collapsed = new Set(prev.collapsedFolders);
      if (collapsed.has(folderId)) {
        collapsed.delete(folderId);
      } else {
        collapsed.add(folderId);
      }
      return { ...prev, collapsedFolders: Array.from(collapsed) };
    });
  };

  const handleContentChange = (value: string) => {
    if (!activeFile) {
      return;
    }
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
  };

  const activeNode = useMemo(() => (activeFile ? findNodeById(SAMPLE_FILE_TREE, activeFile) : null), [activeFile]);

  const status = useMemo(
    () => ({
      characters: activeContent.length,
      openCount: openPanes.length,
      activeFileName: activeNode?.name ?? ""
    }),
    [activeContent.length, openPanes.length, activeNode?.name]
  );

  const handleOpenMcp = useCallback(() => {
    setActiveTool((current) => (current === "mcp" ? "files" : "mcp"));
  }, []);

  const handleSendMcp = useCallback(
    async (payload: unknown) => {
      await sendMcp(payload);
    },
    [sendMcp]
  );

  if (!hydrated) {
    return (
      <div className="app-shell">
        <div className="ribbon" />
        <div className="explorer">
          <div className="explorer__header">Loading vault…</div>
        </div>
        <div className="main-pane" />
        <StatusBar
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          info={{ characters: 0, openCount: 0, activeFileName: "" }}
          mcp={{ state: mcpStatus.state, busy: mcpPending, onToggle: handleOpenMcp }}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <LeftRibbon activeTool={activeTool} onSelect={setActiveTool} />
      <FileExplorer
        nodes={SAMPLE_FILE_TREE}
        collapsed={new Set(workspace.collapsedFolders)}
        activeFile={activeFile}
        onSelect={handleSelectFile}
        onToggleFolder={handleToggleFolder}
      />
      <div className={`main-pane${activeTool === "mcp" ? " main-pane--show-console" : ""}`}>
        <div className="main-pane__grid">
          {openPanes.some((pane) => pane.type === "editor") && (
            <EditorPane value={activeContent} fileName={activeNode?.name ?? "Untitled"} onChange={handleContentChange} theme={theme} />
          )}
          {openPanes.some((pane) => pane.type === "preview") && (
            <PreviewPane value={activeContent} fileName={activeNode?.name ?? "Untitled"} />
          )}
        </div>
        {activeTool === "mcp" && (
          <McpConsole
            status={mcpStatus}
            messages={mcpMessages}
            pending={mcpPending}
            onConnect={connectMcp}
            onDisconnect={disconnectMcp}
            onSend={handleSendMcp}
          />
        )}
      </div>
      <StatusBar
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        info={status}
        mcp={{ state: mcpStatus.state, busy: mcpPending, onToggle: handleOpenMcp }}
      />
    </div>
  );
}
