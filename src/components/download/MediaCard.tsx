import type { MediaInfo } from "../../types/api";

type MediaCardProps = {
  media: MediaInfo;
  dryRunId: string | null;
  dryRunMessage: string | null;
  downloadHandedOff: boolean;
  isBusy: boolean;
  isChecking: boolean;
  isStarting: boolean;
  onDryRun: () => void;
  onStartDownload: () => void;
};

function formatDuration(duration?: number): string {
  if (duration === undefined) return "未知";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatFileSize(size?: number): string {
  if (size === undefined) return "未知";
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(2)} GB`;
}

export default function MediaCard({
  media,
  dryRunId,
  dryRunMessage,
  downloadHandedOff,
  isBusy,
  isChecking,
  isStarting,
  onDryRun,
  onStartDownload,
}: MediaCardProps) {
  return (
    <article className="grid gap-5 border-4 border-[var(--line)] bg-[var(--surface)] p-5 shadow-[7px_7px_0_var(--green-dark)] sm:grid-cols-[11rem_1fr]">
      {media.thumbnail ? (
        <img
          src={media.thumbnail}
          alt=""
          referrerPolicy="no-referrer"
          className="aspect-video w-full border-3 border-[var(--line)] object-cover sm:aspect-square"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid aspect-video place-items-center border-3 border-[var(--line)] bg-[var(--green-dark)] font-[var(--display)] text-3xl text-[var(--cream)] sm:aspect-square"
        >
          FG
        </div>
      )}

      <div className="min-w-0">
        <p className="font-[var(--mono)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          媒体信息
        </p>
        <h2 className="mt-2 break-words font-[var(--display)] text-2xl leading-tight">
          {media.title ?? media.id ?? "未命名媒体"}
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
          <div>
            <dt className="font-[var(--mono)] uppercase tracking-wider text-[var(--text-muted)]">
              时长
            </dt>
            <dd className="mt-1 font-semibold">
              {formatDuration(media.duration)}
            </dd>
          </div>
          <div>
            <dt className="font-[var(--mono)] uppercase tracking-wider text-[var(--text-muted)]">
              大小
            </dt>
            <dd className="mt-1 font-semibold">
              {formatFileSize(media.filesize ?? media.filesize_approx)}
            </dd>
          </div>
          <div>
            <dt className="font-[var(--mono)] uppercase tracking-wider text-[var(--text-muted)]">
              格式
            </dt>
            <dd className="mt-1 font-semibold uppercase">
              {media.ext ?? "未知"}
            </dd>
          </div>
          <div>
            <dt className="font-[var(--mono)] uppercase tracking-wider text-[var(--text-muted)]">
              来源
            </dt>
            <dd className="mt-1 font-semibold">{media.extractor ?? "未知"}</dd>
          </div>
        </dl>

        <div className="mt-5 border-t-3 border-[var(--line)] pt-5">
          {downloadHandedOff ? (
            <div className="border-3 border-[var(--line)] bg-[var(--green-dark)] p-4 text-[var(--cream)]">
              <p className="font-[var(--mono)] text-sm font-semibold uppercase tracking-wide">
                下载已交给浏览器
              </p>
              <p className="mt-2 text-sm">
                请在浏览器下载列表中查看进度与结果。
              </p>
            </div>
          ) : !dryRunId ? (
            <button
              type="button"
              onClick={onDryRun}
              disabled={isBusy}
              className="border-2 border-[var(--line)] bg-[var(--canvas)] px-5 py-3 font-[var(--mono)] text-sm font-semibold uppercase tracking-wide text-[var(--text)] transition enabled:hover:bg-[var(--yellow)] enabled:hover:text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--pink)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isChecking ? "预检中…" : "2 · 执行下载预检"}
            </button>
          ) : (
            <div className="border-3 border-[var(--line)] bg-[var(--green-dark)] p-4 text-[var(--cream)]">
              <p className="font-[var(--mono)] text-sm font-semibold uppercase tracking-wide">
                {dryRunMessage ?? "预检通过，可以开始下载。"}
              </p>
              <button
                type="button"
                onClick={onStartDownload}
                disabled={isBusy}
                className="mt-4 border-2 border-[var(--line)] bg-[var(--canvas)] px-5 py-3 font-[var(--mono)] text-sm font-semibold uppercase tracking-wide text-[var(--ink)] transition enabled:hover:bg-[var(--pink)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--pink)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isStarting ? "正在交给浏览器…" : "3 · 开始下载"}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
