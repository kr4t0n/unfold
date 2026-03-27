import { useEffect, useRef, useCallback } from "react";
import cytoscape, { type Core, type EventObject } from "cytoscape";
import type { NodeData, EdgeData, StyleMap } from "../types/graph";

const DEFAULT_NODE_COLORS = [
  "#818cf8", "#fb7185", "#34d399", "#fbbf24", "#60a5fa",
  "#a78bfa", "#f472b6", "#2dd4bf", "#fb923c", "#22d3ee",
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
  const positionCache = useRef<Map<string, { x: number; y: number }>>(new Map());

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
      return styleMap.nodes[primary]?.size || 10;
    },
    [styleMap.nodes]
  );

  const getEdgeColor = useCallback(
    (type: string) => styleMap.edges[type]?.color || "#475569",
    [styleMap.edges]
  );

  const getEdgeWidth = useCallback(
    (type: string) => styleMap.edges[type]?.width || 0.75,
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
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 4,
            "font-size": "6px",
            "font-weight": "500",
            "font-family": "Inter, sans-serif",
            color: "rgba(226, 232, 240, 0.7)",
            "text-outline-width": 0,
            "background-color": "data(bgColor)",
            width: "data(nodeSize)",
            height: "data(nodeSize)",
            "border-width": 1,
            "border-color": "data(bgColor)",
            "border-opacity": 0.3,
            "overlay-opacity": 0,
            "transition-property":
              "border-width, border-color, border-opacity, width, height",
            "transition-duration": "150ms",
          },
        },
        {
          selector: "node:active",
          style: {
            "overlay-opacity": 0,
          },
        },
        {
          selector: "node.hovered",
          style: {
            "border-width": 1.5,
            "border-opacity": 0.6,
            color: "rgba(226, 232, 240, 1)",
          },
        },
        {
          selector: "node.selected-node",
          style: {
            "border-width": 1.5,
            "border-color": "#fff",
            "border-opacity": 0.9,
            color: "#fff",
          },
        },
        {
          selector: "edge",
          style: {
            label: "",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.4,
            "line-color": "data(edgeColor)",
            "target-arrow-color": "data(edgeColor)",
            width: "data(edgeWidth)",
            opacity: 0.12,
            "transition-property": "opacity, width, line-color",
            "transition-duration": "200ms",
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            label: "data(relType)",
            "font-size": "4px",
            "font-family": "JetBrains Mono, monospace",
            color: "rgba(148, 163, 184, 0.8)",
            "text-rotation": "autorotate",
            "text-outline-width": 1,
            "text-outline-color": "rgba(10, 14, 26, 0.9)",
            opacity: 0.8,
            width: 1,
            "z-index": 10,
          },
        },
      ],
      layout: { name: "preset" },
      minZoom: 0.3,
      maxZoom: 3,
      pixelRatio: 2,
    });

    cyRef.current = cy;

    cy.on("mouseover", "node", (evt: EventObject) => {
      evt.target.addClass("hovered");
      containerRef.current!.style.cursor = "pointer";
    });

    cy.on("mouseout", "node", (evt: EventObject) => {
      evt.target.removeClass("hovered");
      containerRef.current!.style.cursor = "default";
    });

    cy.on("tap", "node", (evt: EventObject) => {
      cy.nodes().removeClass("selected-node");
      cy.edges().removeClass("highlighted");

      evt.target.addClass("selected-node");
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
        cy.nodes().removeClass("selected-node");
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
      const pos = n.position();
      positionCache.current.set(n.id(), { x: pos.x, y: pos.y });
      if (!newNodeIds.has(n.id())) cy.remove(n);
    });
    cy.edges().forEach((e) => {
      if (!newEdgeIds.has(e.id())) cy.remove(e);
    });

    const displayLabel = (n: NodeData) => {
      const name = n.properties.name || n.properties.title || n.properties.id || "";
      return String(name).slice(0, 18) || n.labels[0] || "?";
    };

    let hasNewNodes = false;

    const nodesToAdd = nodes
      .filter((n) => !existingNodeIds.has(n.id))
      .map((n) => {
        const cached = positionCache.current.get(n.id);
        if (!cached) hasNewNodes = true;
        return {
          group: "nodes" as const,
          data: {
            id: n.id,
            displayLabel: displayLabel(n),
            labels: n.labels,
            properties: n.properties,
            bgColor: getNodeColor(n.labels),
            nodeSize: getNodeSize(n.labels),
          },
          position: cached || undefined,
        };
      });

    const edgesToAdd = edges
      .filter((e) => !existingEdgeIds.has(e.id))
      .filter((e) => newNodeIds.has(e.source) && newNodeIds.has(e.target))
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

      if (hasNewNodes) {
        cy.layout({
          name: "cose",
          animate: true,
          animationDuration: 500,
          animationEasing: "ease-out",
          randomize: nodesToAdd.length > 5,
          nodeRepulsion: () => 12000,
          idealEdgeLength: () => 120,
          gravity: 0.3,
          // @ts-expect-error cose layout supports this
          numIter: 300,
          padding: 80,
        }).run();
      }
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

  return <div ref={containerRef} className="graph-container" />;
}
