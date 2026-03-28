import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play, Loader2, Clock } from "lucide-react";

interface CypherEditorProps {
  onRun: (query: string) => void;
  loading: boolean;
  queryHistory: string[];
}

export function CypherEditor({ onRun, loading, queryHistory }: CypherEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleRun = () => {
    if (!viewRef.current) return;
    const query = viewRef.current.state.doc.toString().trim();
    if (query) onRunRef.current(query);
  };

  const setEditorContent = (text: string) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
    });
  };

  const handleHistorySelect = (query: string) => {
    setEditorContent(query);
    setHistoryOpen(false);
    onRunRef.current(query);
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const runKeymap = keymap.of([
      {
        key: "Ctrl-Enter",
        mac: "Cmd-Enter",
        run: () => {
          const query = viewRef.current?.state.doc.toString().trim();
          if (query) onRunRef.current(query);
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
            fontSize: "16px",
            maxHeight: "160px",
            background: "transparent",
          },
          "&.cm-focused": { outline: "none" },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".query-history-dropdown") && !target.closest(".history-toggle-btn")) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [historyOpen]);

  return (
    <div className="cypher-editor-wrap">
      <div className="cypher-editor">
        <div className="cypher-editor-container" ref={editorRef} />
        {queryHistory.length > 0 && (
          <button
            className="history-toggle-btn"
            onClick={() => setHistoryOpen(!historyOpen)}
            title="Query history"
          >
            <Clock size={14} />
          </button>
        )}
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

      {historyOpen && queryHistory.length > 0 && (
        <div className="query-history-dropdown">
          {queryHistory.map((q, i) => (
            <button
              key={i}
              className="query-history-item"
              onClick={() => handleHistorySelect(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
