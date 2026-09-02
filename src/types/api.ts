export type Health = {
  status: string;
  python: string;
  fastapi: string;
  pydantic: string;
  yt_dlp: string;
  ffmpeg: string | null;
};

export type MediaInfo = {
  id?: string;
  title?: string;
  duration?: number;
  thumbnail?: string;
  extractor?: string;
  ext?: string;
  filesize?: number;
  filesize_approx?: number;
  filepath?: string;
  filename?: string;
  requested_downloads?: Array<{
    filepath?: string;
    filename?: string;
  }>;
};

export type DownloadTask = {
  id: string;
  filename: string;
  media: MediaInfo;
  file_url: string;
};

export type DryRunResult = {
  passed: boolean;
  reason_code:
    | "blocked"
    | "authentication_required"
    | "premium_required"
    | "geo_restricted"
    | "unsupported_url"
    | "unavailable"
    | "no_formats"
    | "network_error"
    | "unknown"
    | null;
  message: string;
  detail: string | null;
  dry_run_id: string | null;
  filename: string | null;
  media: MediaInfo | null;
};
