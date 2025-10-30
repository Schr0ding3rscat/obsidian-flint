import type { McpStatus } from "@shared/mcp";

interface StatusBarInfo {
  characters: number;
  openCount: number;
  activeFileName: string;
}

interface StatusBarProps {
  theme: "light" | "dark";
  info: StatusBarInfo;
  onToggleTheme: () => void;
  mcp: {
    state: McpStatus["state"];
    busy: boolean;
    onToggle: () => void;
  };
}

export default function StatusBar({ theme, info, onToggleTheme, mcp }: StatusBarProps): JSX.Element {
  const connectionLabel = (() => {
    switch (mcp.state) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting";
      case "error":
        return "Needs attention";
      default:
        return "Disconnected";
    }
  })();

  return (
    <footer className="status-bar">
      <div className="status-bar__section">
        <span>{info.activeFileName || "No file selected"}</span>
        <span>{info.characters} chars</span>
        <span className="badge">{info.openCount} panes</span>
      </div>
      <div className="status-bar__section">
        <button type="button" className="status-bar__button" onClick={mcp.onToggle}>
          <span className={`status-bar__indicator status-bar__indicator--${mcp.state}`} aria-hidden="true" />
          <span>MCP {connectionLabel + (mcp.busy ? "…" : "")}</span>
        </button>
        <button type="button" className="theme-toggle" onClick={onToggleTheme}>
          <span className="theme-toggle__thumb" aria-hidden="true" />
          <span>{theme === "dark" ? "Dark" : "Light"} mode</span>
        </button>
      </div>
    </footer>
  );
}
