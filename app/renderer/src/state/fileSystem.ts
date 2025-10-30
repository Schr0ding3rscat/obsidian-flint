export type FileNodeType = "file" | "folder";

export interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  children?: FileNode[];
}

export const SAMPLE_FILE_TREE: FileNode[] = [
  {
    id: "Daily Notes",
    name: "Daily Notes",
    type: "folder",
    children: [
      { id: "Daily Notes/2025-01-01.md", name: "2025-01-01.md", type: "file" },
      { id: "Daily Notes/2025-01-02.md", name: "2025-01-02.md", type: "file" }
    ]
  },
  {
    id: "Projects",
    name: "Projects",
    type: "folder",
    children: [
      {
        id: "Projects/Second Brain",
        name: "Second Brain",
        type: "folder",
        children: [
          { id: "Projects/Second Brain/Overview.md", name: "Overview.md", type: "file" },
          { id: "Projects/Second Brain/Roadmap.md", name: "Roadmap.md", type: "file" }
        ]
      },
      {
        id: "Projects/Writing",
        name: "Writing",
        type: "folder",
        children: [
          { id: "Projects/Writing/Book.md", name: "Book.md", type: "file" },
          { id: "Projects/Writing/Notes.md", name: "Notes.md", type: "file" }
        ]
      }
    ]
  },
  {
    id: "Resources",
    name: "Resources",
    type: "folder",
    children: [
      { id: "Resources/Reading List.md", name: "Reading List.md", type: "file" },
      { id: "Resources/Templates.md", name: "Templates.md", type: "file" }
    ]
  },
  { id: "Welcome.md", name: "Welcome.md", type: "file" },
  { id: "Quick Capture.md", name: "Quick Capture.md", type: "file" }
];

export const DEFAULT_FILE_CONTENT: Record<string, string> = {
  "Welcome.md": `# Welcome to Obsidian Flint\n\nThis demo mirrors the core layout of Obsidian with a ribbon, explorer, editor, and preview.\n\n- Use the file explorer to switch notes.\n- Type in the editor to see the preview update.\n- Toggle the theme from the status bar to preview light and dark palettes.`,
  "Quick Capture.md": `# Quick Capture\n\nUse this space to capture lightweight notes without switching panes.`,
  "Daily Notes/2025-01-01.md": `# Daily Note — 2025-01-01\n\n- [ ] Review previous tasks\n- [ ] Plan focus for the day`,
  "Daily Notes/2025-01-02.md": `# Daily Note — 2025-01-02\n\n## Highlights\n- Research new plugins\n- Draft blog outline`,
  "Projects/Second Brain/Overview.md": `# Second Brain\n\nA curated repository of insights and knowledge.`,
  "Projects/Second Brain/Roadmap.md": `# Second Brain Roadmap\n\n1. Map knowledge areas\n2. Document capture workflows\n3. Automate review cycles`,
  "Projects/Writing/Book.md": `# Novel Manuscript\n\n> Working title TBD.\n\n## Todo\n- Flesh out protagonist arc\n- Outline act two`,
  "Projects/Writing/Notes.md": `# Writing Notes\n\n- Story structures\n- Character studies\n- Dialogue snippets`,
  "Resources/Reading List.md": `# Reading List\n\n- *Make Time*\n- *Building a Second Brain*\n- *Deep Work*`,
  "Resources/Templates.md": `# Templates\n\n## Meeting Notes\n- Summary\n- Key points\n- Action items`
};

export function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.type === "folder" && node.children) {
      const match = findNodeById(node.children, id);
      if (match) {
        return match;
      }
    }
  }
  return null;
}
