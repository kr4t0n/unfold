import { useState, useCallback, useMemo, useRef } from "react";
import { CypherEditor } from "./components/CypherEditor";
import { GraphCanvas } from "./components/GraphCanvas";
import { SchemaBrowser } from "./components/SchemaBrowser";
import { StylePanel } from "./components/StylePanel";
import { Toolbar } from "./components/Toolbar";
import { NodeDetail } from "./components/NodeDetail";
import { useApi } from "./hooks/useApi";
import { useGraph } from "./hooks/useGraph";
import type { NodeData, StyleMap } from "./types/graph";

const STYLE_STORAGE_KEY = "unfold-styles";

function loadStyles(): StyleMap {
  try {
    const raw = localStorage.getItem(STYLE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { nodes: {}, edges: {} };
}

function saveStyles(styles: StyleMap) {
  localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(styles));
}

export default function App() {
  const { runQuery, fetchNeighbors } = useApi();
  const { nodes, edges, replaceGraph, mergeGraph, clearGraph } = useGraph();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [styleMap, setStyleMap] = useState<StyleMap>(loadStyles);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const handleRunQuery = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await runQuery({ query });
        replaceGraph(data);
        setSelectedNode(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Query failed");
      } finally {
        setLoading(false);
      }
    },
    [runQuery, replaceGraph]
  );

  const handleExpand = useCallback(
    async (nodeId: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNeighbors(nodeId);
        mergeGraph(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Expand failed");
      } finally {
        setLoading(false);
      }
    },
    [fetchNeighbors, mergeGraph]
  );

  const handleLabelClick = useCallback(
    (label: string) => {
      handleRunQuery(`MATCH (n:\`${label}\`) RETURN n LIMIT 50`);
    },
    [handleRunQuery]
  );

  const handleRelTypeClick = useCallback(
    (type: string) => {
      handleRunQuery(
        `MATCH (a)-[r:\`${type}\`]->(b) RETURN a, r, b LIMIT 50`
      );
    },
    [handleRunQuery]
  );

  const handleStyleChange = useCallback((newStyles: StyleMap) => {
    setStyleMap(newStyles);
    saveStyles(newStyles);
  }, []);

  const handleExportPng = useCallback(() => {
    const canvas = graphContainerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "unfold-graph.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const handleExportJson = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.download = "unfold-graph.json";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [nodes, edges]);

  const nodeLabels = useMemo(() => {
    const set = new Set<string>();
    for (const n of nodes) for (const l of n.labels) set.add(l);
    return Array.from(set).sort();
  }, [nodes]);

  const edgeTypes = useMemo(() => {
    const set = new Set<string>();
    for (const e of edges) set.add(e.type);
    return Array.from(set).sort();
  }, [edges]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Unfold</h1>
        <span className="app-subtitle">Neo4j Visualizer</span>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <SchemaBrowser
            onLabelClick={handleLabelClick}
            onRelTypeClick={handleRelTypeClick}
          />
          <StylePanel
            nodeLabels={nodeLabels}
            edgeTypes={edgeTypes}
            styleMap={styleMap}
            onStyleChange={handleStyleChange}
          />
        </aside>

        <main className="main-content">
          <CypherEditor onRun={handleRunQuery} loading={loading} />

          {error && <div className="error-banner">{error}</div>}

          <Toolbar
            nodes={nodes}
            edges={edges}
            onClear={clearGraph}
            onExportPng={handleExportPng}
            onExportJson={handleExportJson}
          />

          <div className="graph-area" ref={graphContainerRef}>
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              styleMap={styleMap}
              onNodeDoubleClick={handleExpand}
              onNodeSelect={setSelectedNode}
            />

            {selectedNode && (
              <NodeDetail
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onExpand={handleExpand}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
