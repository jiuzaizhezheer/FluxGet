from typing import Any, Literal

from pydantic import BaseModel, HttpUrl, RootModel


class HealthResponse(BaseModel):
    status: str
    python: str
    fastapi: str
    pydantic: str
    yt_dlp: str
    ffmpeg: str | None


class ExtractInfoRequest(BaseModel):
    url: HttpUrl


class ExtractInfoResponse(RootModel[dict[str, Any]]):
    pass


class DryRunRequest(BaseModel):
    url: HttpUrl
    container: Literal["auto", "mp4", "mkv", "webm", "mov"] = "auto"


class DryRunResponse(BaseModel):
    passed: bool
    reason_code: (
        Literal[
            "blocked",
            "authentication_required",
            "premium_required",
            "geo_restricted",
            "unsupported_url",
            "unavailable",
            "no_formats",
            "network_error",
            "incompatible_container",
            "unknown",
        ]
        | None
    ) = None
    message: str
    detail: str | None = None
    dry_run_id: str | None = None
    filename: str | None = None
    media: dict[str, Any] | None = None
    container: Literal["mp4", "mkv", "webm", "mov"] | None = None


class CreateDownloadRequest(BaseModel):
    dry_run_id: str


class DownloadTaskResponse(BaseModel):
    id: str
    filename: str
    media: dict[str, Any]
    container: Literal["mp4", "mkv", "webm", "mov"]
    file_url: str
