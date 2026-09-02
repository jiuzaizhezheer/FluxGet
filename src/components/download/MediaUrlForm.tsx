import type { SubmitEvent } from "react";
import type { ContainerChoice } from "../../types/api";

type MediaUrlFormProps = {
  url: string;
  container: ContainerChoice;
  isBusy: boolean;
  isExtracting: boolean;
  onUrlChange: (url: string) => void;
  onContainerChange: (container: ContainerChoice) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export default function MediaUrlForm({
  url,
  container,
  isBusy,
  isExtracting,
  onUrlChange,
  onContainerChange,
  onSubmit,
}: MediaUrlFormProps) {
  return (
    <form
      aria-busy={isExtracting}
      onSubmit={onSubmit}
      className="mt-10 max-w-4xl border-4 border-[var(--line)] bg-[var(--canvas)] p-3 shadow-[10px_10px_0_var(--orange)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="media-url" className="sr-only">媒体链接</label>
        <input
          id="media-url"
          type="url"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          disabled={isBusy}
          required
          placeholder="https://example.com/video"
          className="min-w-0 flex-1 border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:shadow-[inset_0_0_0_2px_var(--pink)] disabled:cursor-not-allowed disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!url.trim() || isBusy}
          className="border-2 border-[var(--line)] bg-[var(--green-dark)] px-6 py-3 font-[var(--mono)] font-semibold uppercase tracking-wide text-[var(--cream)] transition enabled:hover:bg-[var(--pink)] enabled:hover:text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--pink)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isExtracting ? "提取中…" : "1 · 提取信息"}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t-2 border-[var(--line)] pt-3 sm:flex-row sm:items-center">
        <label htmlFor="output-container" className="font-[var(--mono)] text-xs font-semibold uppercase tracking-[0.14em]">
          输出容器
        </label>
        <select
          id="output-container"
          value={container}
          onChange={(event) => onContainerChange(event.target.value as ContainerChoice)}
          disabled={isBusy}
          className="border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-[var(--mono)] text-sm font-semibold uppercase text-[var(--text)] outline-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--pink)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <option value="auto">自动（推荐）</option>
          <option value="mp4">MP4</option>
          <option value="mkv">MKV</option>
          <option value="webm">WebM</option>
          <option value="mov">MOV</option>
        </select>
        <p className="text-xs text-[var(--text-muted)] sm:ml-auto">保留最高质量编码，不兼容时预检会直接提示。</p>
      </div>
    </form>
  );
}
