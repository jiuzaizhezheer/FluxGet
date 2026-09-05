import type {
  DownloadTask,
  DryRunResult,
  Health,
  MediaInfo,
} from "../types/api";

type ApiErrorBody = {
  detail?: unknown;
};

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message = `请求失败（${response.status}）`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function getHealth(): Promise<Health> {
  return requestJson<Health>("/api/health");
}

export function extractInfo(url: string): Promise<MediaInfo> {
  return requestJson<MediaInfo>("/api/extract-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export function dryRun(url: string): Promise<DryRunResult> {
  return requestJson<DryRunResult>("/api/dry-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export function createDownload(dryRunId: string): Promise<DownloadTask> {
  return requestJson<DownloadTask>("/api/downloads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dry_run_id: dryRunId }),
  });
}
