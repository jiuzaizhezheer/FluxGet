from fastapi import APIRouter

from backend.app.schemas import HealthResponse
from backend.app.services.environment import get_environment_health

router = APIRouter(tags=["environment"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse.model_validate(get_environment_health())
