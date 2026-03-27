from pydantic import BaseModel


class NodeData(BaseModel):
    id: str
    labels: list[str]
    properties: dict


class EdgeData(BaseModel):
    id: str
    source: str
    target: str
    type: str
    properties: dict


class GraphData(BaseModel):
    nodes: list[NodeData]
    edges: list[EdgeData]


class QueryRequest(BaseModel):
    query: str
    params: dict | None = None


class SchemaLabel(BaseModel):
    label: str
    count: int
    properties: list[str]


class SchemaRelType(BaseModel):
    type: str
    count: int
    properties: list[str]


class SchemaResponse(BaseModel):
    labels: list[SchemaLabel]
    relationship_types: list[SchemaRelType]
