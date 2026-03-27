import { useCallback, useState } from "react";
import type { EdgeData, GraphData, NodeData } from "../types/graph";

export function useGraph() {
  const [nodes, setNodes] = useState<Map<string, NodeData>>(new Map());
  const [edges, setEdges] = useState<Map<string, EdgeData>>(new Map());

  const mergeGraph = useCallback((data: GraphData) => {
    setNodes((prev) => {
      const next = new Map(prev);
      for (const n of data.nodes) next.set(n.id, n);
      return next;
    });
    setEdges((prev) => {
      const next = new Map(prev);
      for (const e of data.edges) next.set(e.id, e);
      return next;
    });
  }, []);

  const replaceGraph = useCallback((data: GraphData) => {
    const nodeMap = new Map<string, NodeData>();
    for (const n of data.nodes) nodeMap.set(n.id, n);
    setNodes(nodeMap);

    const edgeMap = new Map<string, EdgeData>();
    for (const e of data.edges) edgeMap.set(e.id, e);
    setEdges(edgeMap);
  }, []);

  const clearGraph = useCallback(() => {
    setNodes(new Map());
    setEdges(new Map());
  }, []);

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    mergeGraph,
    replaceGraph,
    clearGraph,
  };
}
