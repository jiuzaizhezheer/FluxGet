import platform
import re
import shutil
import subprocess
from typing import Any

import fastapi
import pydantic
from yt_dlp import version


def get_ffmpeg_version() -> str | None:
    executable = shutil.which("ffmpeg")
    if executable is None:
        return None

    result = subprocess.run(
        [executable, "-version"],
        capture_output=True,
        check=False,
        text=True,
        timeout=5,
    )
    match = re.search(r"ffmpeg version\s+([^\s]+)", result.stdout)
    return match.group(1) if match else None


def get_environment_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "python": platform.python_version(),
        "fastapi": fastapi.__version__,
        "pydantic": pydantic.__version__,
        "yt_dlp": version.__version__,
        "ffmpeg": get_ffmpeg_version(),
    }
