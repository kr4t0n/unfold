import os

from neomodel import config, db

from app.models.graph import (
    EdgeData,
    GraphData,
    NodeData,
    SchemaLabel,
    SchemaRelType,
    SchemaResponse,
)


def init_neo4j():
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "neo4j")
    config.DATABASE_URL = f"bolt://{user}:{password}@{uri.replace('bolt://', '')}"


def _parse_node(node) -> NodeData:
    return NodeData(
        id=str(node.element_id),
        labels=list(node.labels),
        properties=dict(node._properties),
    )


def _parse_relationship(rel) -> EdgeData:
    return EdgeData(
        id=str(rel.element_id),
        source=str(rel.start_node.element_id),
        target=str(rel.end_node.element_id),
        type=rel.type,
        properties=dict(rel._properties),
    )


def execute_cypher(query: str, params: dict | None = None) -> GraphData:
    results, meta = db.cypher_query(query, params or {}, resolve_objects=False)

    nodes: dict[str, NodeData] = {}
    edges: dict[str, EdgeData] = {}

    for row in results:
        for item in row:
            _collect_graph_elements(item, nodes, edges)

    return GraphData(nodes=list(nodes.values()), edges=list(edges.values()))


def _collect_graph_elements(
    item, nodes: dict[str, NodeData], edges: dict[str, EdgeData]
):
    """Recursively extract nodes and relationships from query result items."""
    from neo4j.graph import Node, Path, Relationship

    if isinstance(item, Node):
        node = _parse_node(item)
        nodes[node.id] = node
    elif isinstance(item, Relationship):
        rel = _parse_relationship(item)
        edges[rel.id] = rel
        src = _parse_node(item.start_node)
        tgt = _parse_node(item.end_node)
        nodes[src.id] = src
        nodes[tgt.id] = tgt
    elif isinstance(item, Path):
        for node in item.nodes:
            parsed = _parse_node(node)
            nodes[parsed.id] = parsed
        for rel in item.relationships:
            parsed_rel = _parse_relationship(rel)
            edges[parsed_rel.id] = parsed_rel
    elif isinstance(item, list):
        for sub in item:
            _collect_graph_elements(sub, nodes, edges)


def get_neighbors(node_id: str) -> GraphData:
    query = """
    MATCH (n)-[r]-(m)
    WHERE elementId(n) = $node_id
    RETURN n, r, m
    """
    return execute_cypher(query, {"node_id": node_id})


def _get_estimated_counts() -> tuple[dict[str, int], dict[str, int]]:
    """Use db.store info or token lookup for fast estimated counts."""
    label_counts: dict[str, int] = {}
    rel_counts: dict[str, int] = {}
    try:
        results, _ = db.cypher_query(
            "CALL apoc.meta.stats() YIELD labels, relTypesCount "
            "RETURN labels, relTypesCount",
            {},
        )
        if results:
            label_counts = results[0][0] or {}
            rel_counts = results[0][1] or {}
    except Exception:
        pass
    return label_counts, rel_counts


def get_schema() -> SchemaResponse:
    label_counts, rel_counts = _get_estimated_counts()

    labels: list[SchemaLabel] = []
    labels_result, _ = db.cypher_query(
        """
        CALL db.labels() YIELD label
        CALL {
            WITH label
            MATCH (n) WHERE label IN labels(n)
            WITH keys(n) AS props
            RETURN props LIMIT 1
        }
        RETURN label, props
        """,
        {},
    )
    for row in labels_result:
        label = row[0]
        labels.append(
            SchemaLabel(
                label=label,
                count=label_counts.get(label, 0),
                properties=row[1] or [],
            )
        )

    rel_types: list[SchemaRelType] = []
    rels_result, _ = db.cypher_query(
        """
        CALL db.relationshipTypes() YIELD relationshipType AS type
        CALL {
            WITH type
            MATCH ()-[r]->() WHERE type(r) = type
            WITH keys(r) AS props
            RETURN props LIMIT 1
        }
        RETURN type, props
        """,
        {},
    )
    for row in rels_result:
        rtype = row[0]
        rel_types.append(
            SchemaRelType(
                type=rtype,
                count=rel_counts.get(rtype, 0),
                properties=row[1] or [],
            )
        )

    return SchemaResponse(labels=labels, relationship_types=rel_types)
