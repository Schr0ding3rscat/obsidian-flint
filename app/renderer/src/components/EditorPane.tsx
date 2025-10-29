import { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

interface EditorPaneProps {
  value: string;
  fileName: string;
  theme: "light" | "dark";
  onChange: (value: string) => void;
}

function buildLightTheme() {
  return EditorView.theme({
    "&": {
      backgroundColor: "transparent",
      color: "var(--text-normal)"
    },
    ".cm-content": {
      caretColor: "var(--accent)",
      fontSize: "14px"
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "var(--text-muted)",
      borderRight: `1px solid var(--border-subtle)`
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--accent-glow)"
    },
    ".cm-activeLine": {
      backgroundColor: "var(--background-hover)"
    }
  });
}

export default function EditorPane({ value, fileName, theme, onChange }: EditorPaneProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const changeHandler = useRef(onChange);

  useEffect(() => {
    changeHandler.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const state = EditorState.create({
      doc: value,
      extensions: [
        markdown(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        themeCompartment.current.of(theme === "dark" ? oneDark : buildLightTheme()),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            changeHandler.current(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping
      ]
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value }
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    view.dispatch({
      effects: themeCompartment.current.reconfigure(theme === "dark" ? oneDark : buildLightTheme())
    });
  }, [theme]);

  return (
    <section className="editor-pane">
      <header className="pane-header">
        <span className="pane-header__title">Editor</span>
        <div className="pane-header__actions">
          <span>{fileName}</span>
        </div>
      </header>
      <div ref={containerRef} style={{ flex: 1 }} />
    </section>
  );
}
