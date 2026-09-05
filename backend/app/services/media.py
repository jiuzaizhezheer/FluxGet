import subprocess
import sys
import threading
import time
from collections import deque
from collections.abc import Iterator
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

DownloadStatus = Literal["ready", "downloading", "completed", "failed", "cancelled"]
DryRunReason = Literal[
    "blocked",
    "authentication_required",
    "premium_required",
    "geo_restricted",
    "unsupported_url",
    "unavailable",
    "no_formats",
    "network_error",
    "unknown",
]

# Select the best source video and audio streams. FFmpeg only remuxes them to MP4.
DOWNLOAD_FORMAT = "bv*+ba/b"
FFMPEG_MP4_OUTPUT_ARGS = "ffmpeg_o:-c copy -f mp4 -movflags frag_keyframe+empty_moov"


class MediaExtractionError(Exception):
    """Raised when yt-dlp cannot extract a media URL."""

    def __init__(
        self,
        message: str,
        reason_code: DryRunReason = "unknown",
        detail: str | None = None,
    ) -> None:
        super().__init__(message)
        self.reason_code = reason_code
        self.detail = detail


class DownloadTaskError(Exception):
    """Raised when a streaming download task cannot be used."""


@dataclass
class DownloadTask:
    id: str
    url: str
    filename: str
    media: dict[str, Any]
    status: DownloadStatus | Literal["checked"] = "checked"
    progress: float | None = 0
    downloaded_bytes: int = 0
    total_bytes: int | None = None
    speed: float | None = None
    eta: float | None = None
    error: str | None = None


_tasks: dict[str, DownloadTask] = {}
_tasks_lock = threading.RLock()


def _estimated_size(info: dict[str, Any]) -> int | None:
    size = info.get("filesize") or info.get("filesize_approx")
    if isinstance(size, (int, float)):
        return int(size)

    formats = info.get("requested_formats")
    if not isinstance(formats, list):
        return None
    sizes = [
        item.get("filesize") or item.get("filesize_approx")
        for item in formats
        if isinstance(item, dict)
    ]
    if sizes and all(isinstance(item, (int, float)) for item in sizes):
        return int(sum(sizes))
    return None


def _classify_extraction_error(message: str) -> tuple[DryRunReason, str]:
    normalized = message.lower()
    if "412" in normalized or "blocked by server" in normalized:
        return "blocked", "站点触发了访问风控，请停止重复请求并稍后再试"
    if "premium member" in normalized or "大会员" in normalized or "付费" in normalized:
        return "premium_required", "该内容需要具备对应权益的登录账号"
    if any(
        word in normalized for word in ("login", "cookies", "sign in", "authentication")
    ):
        return "authentication_required", "该内容要求登录，请配置有效的账号 Cookie"
    if any(word in normalized for word in ("geo", "region", "country", "地区")):
        return "geo_restricted", "该内容存在地区访问限制"
    if "unsupported url" in normalized:
        return "unsupported_url", "yt-dlp 不支持这个链接"
    if "no video formats" in normalized or "no formats" in normalized:
        return "no_formats", "没有找到可下载的媒体格式"
    if any(
        word in normalized
        for word in ("unavailable", "private", "deleted", "not available")
    ):
        return "unavailable", "该内容不可用、已删除或无权访问"
    if any(
        word in normalized
        for word in ("http error", "timeout", "connection", "network")
    ):
        return "network_error", "连接来源站点失败，请检查网络后再试"
    return "unknown", "yt-dlp 无法完成下载预检"


def extract_media_info(
    url: str, *, check_formats: bool = False
) -> tuple[dict[str, Any], str]:
    options = {
        "format": DOWNLOAD_FORMAT,
        "noplaylist": True,
        "quiet": True,
        "simulate": True,
    }
    if check_formats:
        options.update(
            {
                "check_formats": "selected",
                "extractor_retries": 0,
                "fragment_retries": 0,
                "retries": 0,
            }
        )
    try:
        with YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=False)
            filename = Path(ydl.prepare_filename(info)).name
            sanitized_info = ydl.sanitize_info(info)
    except DownloadError as exc:
        reason_code, friendly_message = _classify_extraction_error(str(exc))
        raise MediaExtractionError(
            f"{friendly_message}。",
            reason_code=reason_code,
            detail=str(exc),
        ) from exc

    if not isinstance(sanitized_info, dict):
        raise MediaExtractionError("yt-dlp 未返回有效的媒体信息")
    sanitized_info["ext"] = "mp4"
    filename = Path(filename).with_suffix(".mp4").name
    return sanitized_info, filename


def run_dry_run(url: str) -> DownloadTask:
    media, filename = extract_media_info(url, check_formats=True)
    task = DownloadTask(
        id=uuid4().hex,
        url=url,
        filename=filename,
        media=media,
        total_bytes=_estimated_size(media),
    )
    with _tasks_lock:
        _tasks[task.id] = task
    return task


def create_download_task(dry_run_id: str) -> DownloadTask:
    with _tasks_lock:
        task = get_download_task(dry_run_id)
        if task.status != "checked":
            raise DownloadTaskError("dry-run 已经使用或任务状态无效")
        task.status = "ready"
        return task


def get_download_task(task_id: str) -> DownloadTask:
    with _tasks_lock:
        task = _tasks.get(task_id)
        if task is None:
            raise DownloadTaskError("下载任务不存在或已失效")
        return task


def download_progress(task_id: str) -> dict[str, Any]:
    with _tasks_lock:
        task = get_download_task(task_id)
        snapshot = asdict(task)
    return {
        key: snapshot[key]
        for key in (
            "status",
            "progress",
            "downloaded_bytes",
            "total_bytes",
            "speed",
            "eta",
            "error",
        )
    }


def _update_task(task_id: str, **changes: Any) -> None:
    with _tasks_lock:
        task = get_download_task(task_id)
        for name, value in changes.items():
            setattr(task, name, value)


def _read_errors(stream: Any, lines: deque[str]) -> None:
    for raw_line in iter(stream.readline, b""):
        line = raw_line.decode("utf-8", errors="replace").strip()
        if line:
            lines.append(line)


def _last_error(lines: deque[str]) -> str:
    for line in reversed(lines):
        if "ERROR:" in line:
            return line
    return lines[-1] if lines else "yt-dlp 下载失败"


def stream_download(task_id: str) -> Iterator[bytes]:
    task = get_download_task(task_id)
    with _tasks_lock:
        if task.status != "ready":
            raise DownloadTaskError("下载任务已经开始或已经结束")
        task.status = "downloading"

    command = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--quiet",
        "--no-warnings",
        "--no-playlist",
        "--format",
        DOWNLOAD_FORMAT,
        "--merge-output-format",
        "mp4",
        "--downloader-args",
        FFMPEG_MP4_OUTPUT_ARGS,
        "--output",
        "-",
        "--",
        task.url,
    ]
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if process.stdout is None or process.stderr is None:
        process.kill()
        _update_task(task_id, status="failed", error="无法启动 yt-dlp 输出流")
        return

    errors: deque[str] = deque(maxlen=20)
    error_reader = threading.Thread(
        target=_read_errors,
        args=(process.stderr, errors),
        daemon=True,
    )
    error_reader.start()
    started_at = time.monotonic()

    try:
        while chunk := process.stdout.read(64 * 1024):
            elapsed = max(time.monotonic() - started_at, 0.001)
            downloaded_bytes = task.downloaded_bytes + len(chunk)
            speed = downloaded_bytes / elapsed
            progress = None
            eta = None
            if task.total_bytes:
                progress = min(downloaded_bytes / task.total_bytes * 100, 99.9)
                eta = max((task.total_bytes - downloaded_bytes) / speed, 0)
            _update_task(
                task_id,
                downloaded_bytes=downloaded_bytes,
                progress=progress,
                speed=speed,
                eta=eta,
            )
            yield chunk

        return_code = process.wait()
        error_reader.join(timeout=1)
        if return_code == 0:
            _update_task(task_id, status="completed", progress=100, eta=0)
        else:
            _update_task(task_id, status="failed", error=_last_error(errors))
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            _update_task(task_id, status="cancelled", error="浏览器已取消下载")
        process.stdout.close()
        process.stderr.close()
