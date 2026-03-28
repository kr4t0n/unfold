# unfold Helm Chart

Helm chart for deploying unfold (Neo4j graph visualizer) on Kubernetes.

## Prerequisites

- Kubernetes 1.24+
- Helm 3+
- A running Neo4j instance accessible from the cluster

## Install

```bash
helm install unfold ./helm/unfold
```

## Configuration

### Values

| Parameter | Description | Default |
|---|---|---|
| `frontend.replicaCount` | Frontend replicas | `1` |
| `frontend.image.repository` | Frontend image | `kr4t0n/unfold-frontend` |
| `frontend.image.tag` | Frontend image tag | `latest` |
| `frontend.resources` | Frontend resource overrides | `{}` (defaults in template) |
| `backend.replicaCount` | Backend replicas | `1` |
| `backend.image.repository` | Backend image | `kr4t0n/unfold-backend` |
| `backend.image.tag` | Backend image tag | `latest` |
| `backend.resources` | Backend resource overrides | `{}` (defaults in template) |
| `backend.neo4j.uri` | Neo4j Bolt URI | `bolt://neo4j:7687` |
| `backend.neo4j.username` | Neo4j username | `neo4j` |
| `backend.neo4j.password` | Neo4j password | `changeme` |
| `backend.neo4j.existingSecret` | Use a Kubernetes Secret for Neo4j credentials | `` |
| `ingress.enabled` | Enable ingress | `false` |
| `ingress.className` | Ingress class name | `` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `ingress.host` | Ingress hostname | `unfold.local` |
| `ingress.tls` | Ingress TLS config | `[]` |

### Neo4j Credentials

**Option 1: Inline values**

```yaml
backend:
  neo4j:
    uri: bolt://my-neo4j:7687
    username: neo4j
    password: my-password
```

**Option 2: Existing Kubernetes Secret**

Create a secret with keys `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD`:

```bash
kubectl create secret generic neo4j-credentials \
  --from-literal=NEO4J_URI=bolt://my-neo4j:7687 \
  --from-literal=NEO4J_USER=neo4j \
  --from-literal=NEO4J_PASSWORD=my-password
```

Then reference it:

```yaml
backend:
  neo4j:
    existingSecret: neo4j-credentials
```

### Ingress

Enable ingress and set your hostname. The chart routes `/api/*` to the backend and `/*` to the frontend.

```yaml
ingress:
  enabled: true
  className: nginx
  host: unfold.example.com
  tls:
    - secretName: unfold-tls
      hosts:
        - unfold.example.com
```

## Uninstall

```bash
helm uninstall unfold
```
