export interface NodeData {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface QueryRequest {
  query: string;
  params?: Record<string, unknown>;
}

export interface SchemaLabel {
  label: string;
  count: number;
  properties: string[];
}

export interface SchemaRelType {
  type: string;
  count: number;
  properties: string[];
}

export interface SchemaResponse {
  labels: SchemaLabel[];
  relationship_types: SchemaRelType[];
}

export const DEFAULT_LABEL_COLORS = [
  "#818cf8", "#fb7185", "#34d399", "#fbbf24", "#60a5fa",
  "#a78bfa", "#f472b6", "#2dd4bf", "#fb923c", "#22d3ee",
];

export interface NodeStyle {
  color: string;
  size: number;
}

export interface EdgeStyle {
  color: string;
  width: number;
}

export type StyleMap = {
  nodes: Record<string, NodeStyle>;
  edges: Record<string, EdgeStyle>;
};
