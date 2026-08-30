"""FastAPI entry point matching the endpoint contracts in the build spec."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers.mines import router as mines_router
from api.routers.production import router as production_router
from api.routers.recommendations import router as recommendations_router
from api.routers.reserves import router as reserves_router

app = FastAPI(title="MOIL Manganese Reserve Intelligence Platform", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(mines_router)
app.include_router(reserves_router)
app.include_router(production_router)
app.include_router(recommendations_router)


@app.get("/healthz")
def health():
    return {"status": "ok"}