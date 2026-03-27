import type { GraphData, QueryRequest, SchemaResponse } from "../types/graph";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useApi() {
  const runQuery = (req: QueryRequest) =>
    request<GraphData>("/query", {
      method: "POST",
      body: JSON.stringify(req),
    });

  const fetchSchema = () => request<SchemaResponse>("/schema");

  const fetchNeighbors = (nodeId: string) =>
    request<GraphData>(`/graph/neighbors/${encodeURIComponent(nodeId)}`);

  const healthCheck = () => request<{ status: string }>("/health");

  return { runQuery, fetchSchema, fetchNeighbors, healthCheck };
}
