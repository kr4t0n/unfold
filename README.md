<p align="center">
  <img src="icon.png" alt="unfold" width="120" />
</p>

<h1 align="center">unfold</h1>

<p align="center">A self-hosted Neo4j graph visualizer with an interactive canvas, schema browser, and query history.</p>

## Quick Start (Docker Compose)

```bash
cp .env.example .env
# Edit .env to set your Neo4j password

docker compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Neo4j Browser:** http://localhost:7474

## Features

- **Cypher Editor** — Write and execute Cypher queries with syntax highlighting (Ctrl+Enter to run)
- **Query History** — Recent queries saved and accessible via dropdown for quick re-execution
- **Graph Canvas** — Interactive Cytoscape.js visualization with force-directed layout, zoom, and pan
- **Schema Browser** — Browse all node labels, relationship types, and their properties; click to filter the graph
- **Label Filtering** — Click a label in the sidebar to isolate those nodes; click again to restore the full graph with preserved positions
- **Click-to-Expand** — Double-click any node to fetch and display its neighbors
- **Node/Edge Styling** — Customize colors and sizes per label/relationship type (persisted in localStorage)
- **Minimap** — Real-time bird's-eye overview of the graph with viewport indicator
- **Node Detail Panel** — Click a node to inspect all its properties
- **Export** — Save the current graph view as PNG or export data as JSON

## Architecture

```
frontend/    React + TypeScript + Vite (served by lightweight static server)
backend/     Python FastAPI + neomodel (uv-managed)
neo4j        Neo4j 5 database
```

## Local Development

### Backend

```bash
cd backend
uv sync
cp ../.env.example ../.env
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000/api npm run dev
```

## Kubernetes Deployment

Each service (frontend, backend) builds into its own Docker image. Use your ingress controller to route:
- `/api/*` → backend service (port 8000)
- `/*` → frontend service (port 3000)

Set the `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` environment variables on the backend deployment to point to your Neo4j instance.
