import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play } from "lucide-react";

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
            maxHeight: "200px",
          },
          ".cm-scroller": {
            overflow: "auto",
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
        <Play size={16} />
        {loading ? "Running..." : "Run"}
      </button>
    </div>
  );
}
