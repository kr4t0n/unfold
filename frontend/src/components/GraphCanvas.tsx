import { useEffect, useRef, useCallback } from "react";
import cytoscape, { type Core, type EventObject } from "cytoscape";
import type { NodeData, EdgeData, StyleMap } from "../types/graph";

const DEFAULT_NODE_COLORS = [
  "#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
];

interface GraphCanvasProps {
  nodes: NodeData[];
  edges: EdgeData[];
  styleMap: StyleMap;
  onNodeDoubleClick: (nodeId: string) => void;
  onNodeSelect: (node: NodeData | null) => void;
}

export function GraphCanvas({
  nodes,
  edges,
  styleMap,
  onNodeDoubleClick,
  onNodeSelect,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const labelColorCache = useRef<Map<string, string>>(new Map());

  const getNodeColor = useCallback(
    (labels: string[]) => {
      const primary = labels[0] || "default";
      if (styleMap.nodes[primary]) return styleMap.nodes[primary].color;
      if (labelColorCache.current.has(primary))
        return labelColorCache.current.get(primary)!;
      const idx = labelColorCache.current.size % DEFAULT_NODE_COLORS.length;
      const color = DEFAULT_NODE_COLORS[idx];
      labelColorCache.current.set(primary, color);
      return color;
    },
    [styleMap.nodes]
  );

  const getNodeSize = useCallback(
    (labels: string[]) => {
      const primary = labels[0] || "default";
      return styleMap.nodes[primary]?.size || 36;
    },
    [styleMap.nodes]
  );

  const getEdgeColor = useCallback(
    (type: string) => styleMap.edges[type]?.color || "#94a3b8",
    [styleMap.edges]
  );

  const getEdgeWidth = useCallback(
    (type: string) => styleMap.edges[type]?.width || 2,
    [styleMap.edges]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: "node",
          style: {
            label: "data(displayLabel)",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "11px",
            color: "#fff",
            "text-outline-width": 2,
            "text-outline-color": "data(bgColor)",
            "background-color": "data(bgColor)",
            width: "data(nodeSize)",
            height: "data(nodeSize)",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#fff",
            "overlay-opacity": 0.1,
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(relType)",
            "font-size": "9px",
            color: "#cbd5e1",
            "text-rotation": "autorotate",
            "text-outline-width": 1.5,
            "text-outline-color": "#1e293b",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "line-color": "data(edgeColor)",
            "target-arrow-color": "data(edgeColor)",
            width: "data(edgeWidth)",
            opacity: 0.15,
            "transition-property": "opacity",
            "transition-duration": "200ms",
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            opacity: 1,
            "z-index": 10,
          },
        },
      ],
      layout: { name: "preset" },
      wheelSensitivity: 0.3,
    });

    cyRef.current = cy;

    cy.on("tap", "node", (evt: EventObject) => {
      cy.edges().removeClass("highlighted");
      evt.target.connectedEdges().addClass("highlighted");

      const nodeData = evt.target.data();
      onNodeSelect({
        id: nodeData.id,
        labels: nodeData.labels,
        properties: nodeData.properties,
      });
    });

    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        cy.edges().removeClass("highlighted");
        onNodeSelect(null);
      }
    });

    cy.on("dbltap", "node", (evt: EventObject) => {
      onNodeDoubleClick(evt.target.id());
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const existingNodeIds = new Set(cy.nodes().map((n) => n.id()));
    const existingEdgeIds = new Set(cy.edges().map((e) => e.id()));

    const newNodeIds = new Set(nodes.map((n) => n.id));
    const newEdgeIds = new Set(edges.map((e) => e.id));

    cy.nodes().forEach((n) => {
      if (!newNodeIds.has(n.id())) cy.remove(n);
    });
    cy.edges().forEach((e) => {
      if (!newEdgeIds.has(e.id())) cy.remove(e);
    });

    const displayLabel = (n: NodeData) => {
      const name =
        n.properties.name || n.properties.title || n.properties.id || "";
      return String(name).slice(0, 20) || n.labels[0] || "?";
    };

    const nodesToAdd = nodes
      .filter((n) => !existingNodeIds.has(n.id))
      .map((n) => ({
        group: "nodes" as const,
        data: {
          id: n.id,
          displayLabel: displayLabel(n),
          labels: n.labels,
          properties: n.properties,
          bgColor: getNodeColor(n.labels),
          nodeSize: getNodeSize(n.labels),
        },
      }));

    const edgesToAdd = edges
      .filter((e) => !existingEdgeIds.has(e.id))
      .filter(
        (e) => newNodeIds.has(e.source) && newNodeIds.has(e.target)
      )
      .map((e) => ({
        group: "edges" as const,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          relType: e.type,
          properties: e.properties,
          edgeColor: getEdgeColor(e.type),
          edgeWidth: getEdgeWidth(e.type),
        },
      }));

    if (nodesToAdd.length || edgesToAdd.length) {
      cy.add([...nodesToAdd, ...edgesToAdd]);

      cy.layout({
        name: "cose",
        animate: true,
        animationDuration: 400,
        randomize: nodesToAdd.length > 5,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 100,
        // @ts-expect-error cose layout supports this
        numIter: 200,
      }).run();
    }

    cy.nodes().forEach((n) => {
      const labels = n.data("labels") as string[];
      n.data("bgColor", getNodeColor(labels));
      n.data("nodeSize", getNodeSize(labels));
    });
    cy.edges().forEach((e) => {
      const type = e.data("relType") as string;
      e.data("edgeColor", getEdgeColor(type));
      e.data("edgeWidth", getEdgeWidth(type));
    });
  }, [nodes, edges, getNodeColor, getNodeSize, getEdgeColor, getEdgeWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#0f172a",
        borderRadius: "8px",
      }}
    />
  );
}
