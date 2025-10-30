import type { FileNode } from "../state/fileSystem";

interface FileExplorerProps {
  nodes: FileNode[];
  collapsed: Set<string>;
  activeFile: string | null | undefined;
  onToggleFolder: (folderId: string) => void;
  onSelect: (node: FileNode) => void;
}

export default function FileExplorer({
  nodes,
  collapsed,
  activeFile,
  onToggleFolder,
  onSelect
}: FileExplorerProps): JSX.Element {
  return (
    <nav className="explorer" aria-label="File explorer">
      <div className="explorer__header">Vault</div>
      <div className="explorer__tree">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            collapsed={collapsed}
            activeFile={activeFile ?? null}
            onToggleFolder={onToggleFolder}
            onSelect={onSelect}
          />
        ))}
      </div>
    </nav>
  );
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  collapsed: Set<string>;
  activeFile: string | null;
  onToggleFolder: (folderId: string) => void;
  onSelect: (node: FileNode) => void;
}

function TreeNode({ node, depth, collapsed, activeFile, onToggleFolder, onSelect }: TreeNodeProps): JSX.Element {
  const isFolder = node.type === "folder";
  const isCollapsed = isFolder && collapsed.has(node.id);
  const isActive = node.type === "file" && node.id === activeFile;

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(node.id);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <button
        type="button"
        className={`tree-item${isFolder ? " tree-item--folder" : ""}${isActive ? " tree-item--active" : ""}`}
        style={{ marginLeft: depth * 12 }}
        aria-expanded={isFolder ? !isCollapsed : undefined}
        onClick={handleClick}
      >
        {isFolder ? (
          <span className="tree-item__toggle" aria-hidden="true">
            {isCollapsed ? "▸" : "▾"}
          </span>
        ) : (
          <span className="tree-item__toggle" aria-hidden="true">
            {isActive ? "●" : "○"}
          </span>
        )}
        <span>{node.name}</span>
      </button>
      {isFolder && !isCollapsed && node.children && node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              activeFile={activeFile}
              onToggleFolder={onToggleFolder}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
