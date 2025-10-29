const TOOLS = [
  { id: "files", icon: "📁", label: "Files" },
  { id: "search", icon: "🔍", label: "Search" },
  { id: "graph", icon: "🕸️", label: "Graph" },
  { id: "calendar", icon: "📆", label: "Daily notes" }
] as const;

interface LeftRibbonProps {
  activeTool: string;
  onSelect: (toolId: string) => void;
}

export default function LeftRibbon({ activeTool, onSelect }: LeftRibbonProps): JSX.Element {
  return (
    <aside className="ribbon" aria-label="Primary navigation">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`ribbon__button${tool.id === activeTool ? " ribbon__button--active" : ""}`}
          aria-pressed={tool.id === activeTool}
          title={tool.label}
          onClick={() => onSelect(tool.id)}
        >
          <span role="img" aria-hidden="true">
            {tool.icon}
          </span>
        </button>
      ))}
    </aside>
  );
}
