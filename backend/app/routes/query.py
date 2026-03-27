from fastapi import APIRouter, HTTPException

from app.models.graph import GraphData, QueryRequest
from app.services.neo4j_service import execute_cypher

router = APIRouter()


@router.post("/query", response_model=GraphData)
def run_query(req: QueryRequest):
    try:
        return execute_cypher(req.query, req.params)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
