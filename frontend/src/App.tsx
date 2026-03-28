import { useState, useCallback, useMemo, useRef } from "react";
import { Database, Palette, Share2 } from "lucide-react";
import { CypherEditor } from "./components/CypherEditor";
import { GraphCanvas } from "./components/GraphCanvas";
import { SchemaBrowser } from "./components/SchemaBrowser";
import { StylePanel } from "./components/StylePanel";
import { Toolbar } from "./components/Toolbar";
import { NodeDetail } from "./components/NodeDetail";
import { useApi } from "./hooks/useApi";
import { useGraph } from "./hooks/useGraph";
import type { NodeData, StyleMap } from "./types/graph";
import { DEFAULT_LABEL_COLORS } from "./types/graph";

const STYLE_STORAGE_KEY = "unfold-styles";
const HISTORY_STORAGE_KEY = "unfold-query-history";
const MAX_HISTORY = 20;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(history: string[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

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

type SidebarTab = "schema" | "styles";

export default function App() {
  const { runQuery, fetchNeighbors } = useApi();
  const { nodes, edges, replaceGraph, mergeGraph, clearGraph } = useGraph();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [styleMap, setStyleMap] = useState<StyleMap>(loadStyles);
  const [activeTab, setActiveTab] = useState<SidebarTab>("schema");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>(loadHistory);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const addToHistory = useCallback((query: string) => {
    setQueryHistory((prev) => {
      const deduped = prev.filter((q) => q !== query);
      const next = [query, ...deduped].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }, []);

  const handleRunQuery = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      setActiveFilter(null);
      try {
        const data = await runQuery({ query });
        replaceGraph(data);
        setSelectedNode(null);
        addToHistory(query);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Query failed");
      } finally {
        setLoading(false);
      }
    },
    [runQuery, replaceGraph, addToHistory]
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
      setActiveFilter((prev) => (prev === `label:${label}` ? null : `label:${label}`));
    },
    []
  );

  const handleRelTypeClick = useCallback(
    (type: string) => {
      setActiveFilter((prev) => (prev === `rel:${type}` ? null : `rel:${type}`));
    },
    []
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

  const filteredNodes = useMemo(() => {
    if (!activeFilter) return nodes;
    if (activeFilter.startsWith("label:")) {
      const label = activeFilter.slice(6);
      return nodes.filter((n) => n.labels.includes(label));
    }
    return nodes;
  }, [nodes, activeFilter]);

  const filteredEdges = useMemo(() => {
    if (!activeFilter) return edges;
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    if (activeFilter.startsWith("rel:")) {
      const type = activeFilter.slice(4);
      return edges.filter(
        (e) => e.type === type && visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
      );
    }
    return edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [edges, activeFilter, filteredNodes]);

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

  const labelColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const label of nodeLabels) {
      map[label] = styleMap.nodes[label]?.color
        || DEFAULT_LABEL_COLORS[Object.keys(map).length % DEFAULT_LABEL_COLORS.length];
    }
    return map;
  }, [nodeLabels, styleMap.nodes]);

  const hasGraph = nodes.length > 0;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <span>U</span>nfold
          </span>
        </div>

        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === "schema" ? "active" : ""}`}
            onClick={() => setActiveTab("schema")}
          >
            <Database size={13} />
            Schema
          </button>
          <button
            className={`sidebar-tab ${activeTab === "styles" ? "active" : ""}`}
            onClick={() => setActiveTab("styles")}
          >
            <Palette size={13} />
            Styles
          </button>
        </div>

        <div className="sidebar-content">
          {activeTab === "schema" && (
            <SchemaBrowser
              onLabelClick={handleLabelClick}
              onRelTypeClick={handleRelTypeClick}
              activeFilter={activeFilter}
              labelColorMap={labelColorMap}
            />
          )}
          {activeTab === "styles" && (
            <StylePanel
              nodeLabels={nodeLabels}
              edgeTypes={edgeTypes}
              styleMap={styleMap}
              onStyleChange={handleStyleChange}
            />
          )}
        </div>
      </aside>

      <main className="main-content">
        <div className="graph-area" ref={graphContainerRef}>
          <GraphCanvas
            nodes={filteredNodes}
            edges={filteredEdges}
            styleMap={styleMap}
            labelColorMap={labelColorMap}
            onNodeDoubleClick={handleExpand}
            onNodeSelect={setSelectedNode}
          />

          {!hasGraph && (
            <div className="empty-state">
              <Share2 size={48} className="empty-state-icon" />
              <div className="empty-state-text">
                Run a Cypher query or click a label<br />in the sidebar to visualize your graph
              </div>
              <div className="empty-state-hint">
                <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to execute
              </div>
            </div>
          )}

          <div className="editor-float">
            <CypherEditor
              onRun={handleRunQuery}
              loading={loading}
              queryHistory={queryHistory}
            />

            {error && <div className="error-banner">{error}</div>}

            {hasGraph && (
              <Toolbar
                nodes={filteredNodes}
                edges={filteredEdges}
                onClear={clearGraph}
                onExportPng={handleExportPng}
                onExportJson={handleExportJson}
              />
            )}
          </div>

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
  );
}
