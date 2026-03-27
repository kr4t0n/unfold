from fastapi import APIRouter, HTTPException

from app.models.graph import SchemaResponse
from app.services.neo4j_service import get_schema

router = APIRouter()


@router.get("/schema", response_model=SchemaResponse)
def fetch_schema():
    try:
        return get_schema()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
