import { useMemo } from "react";
import { marked } from "marked";

interface PreviewPaneProps {
  value: string;
  fileName: string;
}

marked.setOptions({
  breaks: true,
  gfm: true
});

export default function PreviewPane({ value, fileName }: PreviewPaneProps): JSX.Element {
  const html = useMemo(() => {
    return marked.parse(value) as string;
  }, [value]);

  return (
    <section className="preview-pane">
      <header className="pane-header">
        <span className="pane-header__title">Preview</span>
        <div className="pane-header__actions">
          <span>{fileName}</span>
        </div>
      </header>
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
