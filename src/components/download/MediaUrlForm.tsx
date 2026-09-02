import type { SubmitEvent } from "react";

type MediaUrlFormProps = {
  url: string;
  isBusy: boolean;
  isExtracting: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export default function MediaUrlForm({
  url,
  isBusy,
  isExtracting,
  onUrlChange,
  onSubmit,
}: MediaUrlFormProps) {
  return (
    <form
      aria-busy={isExtracting}
      onSubmit={onSubmit}
      className="mt-10 flex max-w-4xl flex-col gap-3 border-4 border-[var(--line)] bg-[var(--canvas)] p-3 shadow-[10px_10px_0_var(--orange)] sm:flex-row"
    >
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
    </form>
  );
}
