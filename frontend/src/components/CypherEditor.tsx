import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play, Loader2 } from "lucide-react";

interface CypherEditorProps {
  onRun: (query: string) => void;
  loading: boolean;
}

export function CypherEditor({ onRun, loading }: CypherEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const handleRun = useCallback(() => {
    if (!viewRef.current) return;
    const query = viewRef.current.state.doc.toString().trim();
    if (query) onRun(query);
  }, [onRun]);

  useEffect(() => {
    if (!editorRef.current) return;

    const runKeymap = keymap.of([
      {
        key: "Ctrl-Enter",
        mac: "Cmd-Enter",
        run: () => {
          handleRun();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 50",
      extensions: [
        runKeymap,
        javascript(),
        oneDark,
        placeholder("Enter Cypher query..."),
        EditorView.theme({
          "&": {
            fontSize: "13px",
            maxHeight: "160px",
            background: "transparent",
          },
          "&.cm-focused": { outline: "none" },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "'JetBrains Mono', monospace",
          },
          ".cm-gutters": {
            background: "transparent",
            border: "none",
            color: "rgba(148, 163, 184, 0.3)",
          },
          ".cm-activeLineGutter": {
            background: "transparent",
            color: "rgba(129, 140, 248, 0.6)",
          },
          ".cm-activeLine": {
            background: "rgba(99, 102, 241, 0.04)",
          },
          ".cm-cursor": {
            borderLeftColor: "var(--accent)",
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [handleRun]);

  return (
    <div className="cypher-editor">
      <div className="cypher-editor-container" ref={editorRef} />
      <button
        className="cypher-run-btn"
        onClick={handleRun}
        disabled={loading}
        title="Run query (Ctrl+Enter)"
      >
        {loading ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
        {loading ? "Running" : "Run"}
      </button>
    </div>
  );
}
