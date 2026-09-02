from typing import Any
from urllib.parse import quote

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.app.schemas import (
    CreateDownloadRequest,
    DownloadTaskResponse,
    DryRunRequest,
    DryRunResponse,
    ExtractInfoRequest,
    ExtractInfoResponse,
)
from backend.app.services.media import (
    DownloadTaskError,
    MediaExtractionError,
    create_download_task,
    extract_media_info,
    get_download_task,
    run_dry_run,
    stream_download,
    CONTAINER_MEDIA_TYPES,
)

router = APIRouter(tags=["media"])


@router.post("/extract-info", response_model=ExtractInfoResponse)
def extract_info(request: ExtractInfoRequest) -> dict[str, Any]:
    try:
        media, _ = extract_media_info(str(request.url))
        return media
    except MediaExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/downloads", response_model=DownloadTaskResponse)
def create_download(request: CreateDownloadRequest) -> DownloadTaskResponse:
    try:
        task = create_download_task(request.dry_run_id)
    except DownloadTaskError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return DownloadTaskResponse(
        id=task.id,
        filename=task.filename,
        media=task.media,
        container=task.container,
        file_url=f"/api/downloads/{task.id}/file",
    )


@router.post("/dry-run", response_model=DryRunResponse)
def dry_run(request: DryRunRequest) -> DryRunResponse:
    try:
        task = run_dry_run(str(request.url), request.container)
    except MediaExtractionError as exc:
        return DryRunResponse(
            passed=False,
            reason_code=exc.reason_code,
            message=str(exc),
            detail=exc.detail,
        )
    return DryRunResponse(
        passed=True,
        message="预检通过，可以开始下载。",
        dry_run_id=task.id,
        filename=task.filename,
        media=task.media,
        container=task.container,
    )


@router.get("/downloads/{task_id}/file", response_class=StreamingResponse)
def download_file(task_id: str) -> StreamingResponse:
    try:
        task = get_download_task(task_id)
        if task.status != "ready":
            raise DownloadTaskError("下载任务已经开始或已经结束")
        stream = stream_download(task_id)
    except DownloadTaskError as exc:
        status_code = 404 if "不存在" in str(exc) else 409
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc

    encoded_filename = quote(task.filename)
    return StreamingResponse(
        stream,
        media_type=CONTAINER_MEDIA_TYPES[task.container],
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
            "Cache-Control": "no-store",
        },
    )
