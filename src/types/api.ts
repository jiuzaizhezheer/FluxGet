export type Health = {
  status: string;
  python: string;
  fastapi: string;
  pydantic: string;
  yt_dlp: string;
  ffmpeg: string | null;
};

export type ContainerChoice = "auto" | "mp4" | "mkv" | "webm" | "mov";
export type OutputContainer = Exclude<ContainerChoice, "auto">;

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
  container: OutputContainer;
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
    | "incompatible_container"
    | "unknown"
    | null;
  message: string;
  detail: string | null;
  dry_run_id: string | null;
  filename: string | null;
  media: MediaInfo | null;
  container: OutputContainer | null;
};
