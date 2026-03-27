from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import graph, query, schema
from app.services.neo4j_service import init_neo4j

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_neo4j()
    yield


app = FastAPI(title="Unfold", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router, prefix="/api")
app.include_router(schema.router, prefix="/api")
app.include_router(graph.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
