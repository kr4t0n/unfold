# Unfold — Neo4j Visualizer

A self-hosted Neo4j graph visualizer with a Cypher query editor, interactive graph canvas, schema browser, and node/edge styling.

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
- **Graph Canvas** — Interactive Cytoscape.js visualization with zoom, pan, and force-directed layout
- **Schema Browser** — Browse all node labels, relationship types, and their properties
- **Click-to-Expand** — Double-click any node to fetch and display its neighbors
- **Node/Edge Styling** — Customize colors and sizes per label/relationship type (persisted in localStorage)
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
