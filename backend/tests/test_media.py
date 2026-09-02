import io
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from yt_dlp.utils import DownloadError

from backend.app.routers.media import dry_run, extract_info
from backend.app.schemas import DryRunRequest, ExtractInfoRequest
from backend.app.services import media as media_service
from backend.app.services.media import MediaExtractionError


class MediaServiceTest(unittest.TestCase):
    @patch("backend.app.services.media.YoutubeDL")
    def test_extracts_without_downloading_and_sanitizes_info(
        self, youtube_dl: MagicMock
    ) -> None:
        downloader = youtube_dl.return_value.__enter__.return_value
        raw_info = {"id": "video-id", "title": "Title", "ext": "webm"}
        downloader.extract_info.return_value = raw_info
        downloader.prepare_filename.return_value = "Title [video-id].webm"
        downloader.sanitize_info.return_value = raw_info

        result, filename = media_service.extract_media_info("https://example.com/video")

        downloader.extract_info.assert_called_once_with(
            "https://example.com/video", download=False
        )
        downloader.sanitize_info.assert_called_once_with(raw_info)
        self.assertEqual(result, raw_info)
        self.assertEqual(filename, "Title [video-id].webm")
        self.assertEqual(result["ext"], "webm")

    @patch("backend.app.services.media.YoutubeDL")
    def test_wraps_extraction_error(self, youtube_dl: MagicMock) -> None:
        downloader = youtube_dl.return_value.__enter__.return_value
        downloader.extract_info.side_effect = DownloadError("unsupported URL")

        with self.assertRaises(MediaExtractionError) as raised:
            media_service.extract_media_info("https://example.com/video")

        self.assertEqual(raised.exception.reason_code, "unsupported_url")
        self.assertIn("不支持", str(raised.exception))

    @patch("backend.app.services.media.YoutubeDL")
    def test_dry_run_checks_selected_formats_without_full_download(
        self, youtube_dl: MagicMock
    ) -> None:
        downloader = youtube_dl.return_value.__enter__.return_value
        raw_info = {
            "id": "video-id",
            "title": "Title",
            "requested_formats": [
                {"vcodec": "avc1.640028", "acodec": "none"},
                {"vcodec": "none", "acodec": "mp4a.40.2"},
            ],
        }
        downloader.extract_info.return_value = raw_info
        downloader.prepare_filename.return_value = "video.mp4"
        downloader.sanitize_info.return_value = raw_info

        task = media_service.run_dry_run("https://example.com/video")

        options = youtube_dl.call_args.args[0]
        self.assertEqual(options["check_formats"], "selected")
        self.assertEqual(options["format"], media_service.DOWNLOAD_FORMAT)
        self.assertTrue(options["simulate"])
        downloader.extract_info.assert_called_once_with(
            "https://example.com/video", download=False
        )
        self.assertEqual(task.status, "checked")
        self.assertEqual(task.container, "mp4")

    @patch("backend.app.services.media.extract_media_info")
    def test_rejects_container_incompatible_with_best_codecs(
        self, extract_media_info: MagicMock
    ) -> None:
        extract_media_info.return_value = (
            {
                "id": "video-id",
                "requested_formats": [
                    {"vcodec": "av01.0.08M.08", "acodec": "none"},
                    {"vcodec": "none", "acodec": "mp4a.40.2"},
                ],
            },
            "video.mp4",
        )

        with self.assertRaises(MediaExtractionError) as raised:
            media_service.run_dry_run("https://example.com/video", "webm")

        self.assertEqual(raised.exception.reason_code, "incompatible_container")
        self.assertIn("WebM", str(raised.exception))
        self.assertIn("mp4a.40.2", raised.exception.detail or "")

    @patch("backend.app.services.media.extract_media_info")
    def test_auto_selects_webm_for_vp9_and_opus(
        self, extract_media_info: MagicMock
    ) -> None:
        extract_media_info.return_value = (
            {
                "id": "video-id",
                "requested_formats": [
                    {"vcodec": "vp9", "acodec": "none"},
                    {"vcodec": "none", "acodec": "opus"},
                ],
            },
            "video.webm",
        )

        task = media_service.run_dry_run("https://example.com/video", "auto")

        self.assertEqual(task.container, "webm")
        self.assertTrue(task.filename.endswith(".webm"))

    @patch("backend.app.services.media.subprocess.Popen")
    @patch("backend.app.services.media.extract_media_info")
    def test_streams_bytes_without_creating_an_output_file(
        self, extract_media_info: MagicMock, popen: MagicMock
    ) -> None:
        extract_media_info.return_value = (
            {
                "id": "video-id",
                "filesize": 6,
                "requested_formats": [
                    {"vcodec": "avc1.640028", "acodec": "none"},
                    {"vcodec": "none", "acodec": "mp4a.40.2"},
                ],
            },
            "video.mp4",
        )
        checked_task = media_service.run_dry_run("https://example.com/video")
        task = media_service.create_download_task(checked_task.id)
        process = popen.return_value
        process.stdout = io.BytesIO(b"abcdef")
        process.stderr = io.BytesIO()
        process.wait.return_value = 0
        process.poll.return_value = 0

        chunks = list(media_service.stream_download(task.id))

        self.assertEqual(chunks, [b"abcdef"])
        progress = media_service.download_progress(task.id)
        self.assertEqual(progress["status"], "completed")
        self.assertEqual(progress["progress"], 100)
        command = popen.call_args.args[0]
        self.assertIn("-", command)
        self.assertIn(media_service.DOWNLOAD_FORMAT, command)
        self.assertIn(media_service.CONTAINER_OUTPUT_ARGS[task.container], command)
        self.assertNotIn(str(Path.cwd() / "downloads"), command)


class MediaRouterTest(unittest.TestCase):
    @patch("backend.app.routers.media.extract_media_info")
    def test_maps_service_error_to_http_422(self, extract: MagicMock) -> None:
        extract.side_effect = MediaExtractionError("unsupported URL")

        with self.assertRaises(HTTPException) as raised:
            extract_info(ExtractInfoRequest(url="https://example.com/video"))

        self.assertEqual(raised.exception.status_code, 422)
        self.assertIn("unsupported URL", raised.exception.detail)

    @patch("backend.app.routers.media.run_dry_run")
    def test_dry_run_returns_a_specific_block_reason(self, run: MagicMock) -> None:
        run.side_effect = MediaExtractionError(
            "站点触发了访问风控。",
            reason_code="blocked",
            detail="HTTP Error 412: Precondition Failed",
        )

        result = dry_run(DryRunRequest(url="https://example.com/video"))

        run.assert_called_once_with("https://example.com/video", "auto")
        self.assertFalse(result.passed)
        self.assertEqual(result.reason_code, "blocked")
        self.assertIn("412", result.detail or "")

    def test_download_cannot_be_created_without_a_passed_dry_run(self) -> None:
        with self.assertRaises(media_service.DownloadTaskError):
            media_service.create_download_task("missing-dry-run-id")


if __name__ == "__main__":
    unittest.main()
