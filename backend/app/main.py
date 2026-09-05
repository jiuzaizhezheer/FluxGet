from fastapi import FastAPI

from backend.app.routers.health import router as health_router
from backend.app.routers.media import router as media_router

app = FastAPI(title="FluxGet API", version="0.1.0")
app.include_router(health_router, prefix="/api")
app.include_router(media_router, prefix="/api")
