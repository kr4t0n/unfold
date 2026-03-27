from fastapi import APIRouter, HTTPException

from app.models.graph import GraphData
from app.services.neo4j_service import get_neighbors

router = APIRouter()


@router.get("/graph/neighbors/{node_id:path}", response_model=GraphData)
def fetch_neighbors(node_id: str):
    try:
        return get_neighbors(node_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
