interface StatusBarInfo {
  characters: number;
  openCount: number;
  activeFileName: string;
}

interface StatusBarProps {
  theme: "light" | "dark";
  info: StatusBarInfo;
  onToggleTheme: () => void;
}

export default function StatusBar({ theme, info, onToggleTheme }: StatusBarProps): JSX.Element {
  return (
    <footer className="status-bar">
      <div className="status-bar__section">
        <span>{info.activeFileName || "No file selected"}</span>
        <span>{info.characters} chars</span>
        <span className="badge">{info.openCount} panes</span>
      </div>
      <div className="status-bar__section">
        <button type="button" className="theme-toggle" onClick={onToggleTheme}>
          <span className="theme-toggle__thumb" aria-hidden="true" />
          <span>{theme === "dark" ? "Dark" : "Light"} mode</span>
        </button>
      </div>
    </footer>
  );
}
