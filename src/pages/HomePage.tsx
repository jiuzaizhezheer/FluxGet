import { useState, type SubmitEvent } from "react";
import { createDownload, dryRun, extractInfo } from "../api/client";
import MediaCard from "../components/download/MediaCard";
import MediaUrlForm from "../components/download/MediaUrlForm";
import type { MediaInfo } from "../types/api";

type PendingAction = "extracting" | "checking" | "starting" | null;

function triggerBrowserDownload(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [dryRunId, setDryRunId] = useState<string | null>(null);
  const [dryRunMessage, setDryRunMessage] = useState<string | null>(null);
  const [downloadHandedOff, setDownloadHandedOff] = useState(false);

  const isBusy = pendingAction !== null;

  function resetResult() {
    setMedia(null);
    setDryRunId(null);
    setDryRunMessage(null);
    setDownloadHandedOff(false);
    setError(null);
  }

  function handleUrlChange(nextUrl: string) {
    setUrl(nextUrl);
    resetResult();
  }

  async function handleExtractInfo(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = url.trim();
    if (!normalizedUrl || isBusy) return;

    resetResult();
    setPendingAction("extracting");
    try {
      setMedia(await extractInfo(normalizedUrl));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "媒体信息提取失败",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDryRun() {
    const normalizedUrl = url.trim();
    if (!normalizedUrl || !media || isBusy) return;

    setError(null);
    setDryRunId(null);
    setDryRunMessage(null);
    setPendingAction("checking");
    try {
      const preflight = await dryRun(normalizedUrl);
      if (!preflight.passed || !preflight.dry_run_id || !preflight.media) {
        const technicalDetail = preflight.detail ? `\n${preflight.detail}` : "";
        setError(`${preflight.message}${technicalDetail}`);
        return;
      }

      setMedia(preflight.media);
      setDryRunId(preflight.dry_run_id);
      setDryRunMessage(preflight.message);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "下载预检失败",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleStartDownload() {
    if (!dryRunId || isBusy) return;

    setError(null);
    setPendingAction("starting");
    try {
      const task = await createDownload(dryRunId);
      setMedia(task.media);
      triggerBrowserDownload(task.file_url);
      setDownloadHandedOff(true);
      setDryRunId(null);
      setDryRunMessage(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "下载启动失败，请稍后重试",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="download-hero relative isolate max-w-5xl text-left">
      <p className="mb-6 inline-block bg-[var(--ink)] px-4 py-2 font-[var(--mono)] text-sm font-semibold uppercase tracking-[0.2em] text-[var(--cream)]">
        yt-dlp GUI
      </p>
      <h1 className="max-w-4xl font-[var(--display)] text-[clamp(3rem,8vw,6.5rem)] leading-[0.92] tracking-[-0.02em]">
        把媒体下载变得<span className="text-[var(--pink)]">简单</span>
      </h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
        粘贴媒体链接，媒体会经过后端流式中转并由浏览器直接保存，后端不保留视频文件。
      </p>

      <MediaUrlForm
        url={url}
        isBusy={isBusy}
        isExtracting={pendingAction === "extracting"}
        onUrlChange={handleUrlChange}
        onSubmit={handleExtractInfo}
      />

      <div className="mt-8 max-w-4xl" aria-live="polite">
        {error && (
          <p
            role="alert"
            className="mb-6 whitespace-pre-wrap border-4 border-[var(--line)] bg-[var(--orange)] p-4 font-semibold text-[var(--ink)] shadow-[7px_7px_0_var(--line)]"
          >
            {error}
          </p>
        )}

        {media && (
          <MediaCard
            media={media}
            dryRunId={dryRunId}
            dryRunMessage={dryRunMessage}
            downloadHandedOff={downloadHandedOff}
            isBusy={isBusy}
            isChecking={pendingAction === "checking"}
            isStarting={pendingAction === "starting"}
            onDryRun={handleDryRun}
            onStartDownload={handleStartDownload}
          />
        )}
      </div>
    </section>
  );
}
