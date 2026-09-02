import { useEffect, useState } from "react";
import { getHealth } from "../api/client";
import type { Health } from "../types/api";

export default function SettingsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  return (
    <section>
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="shrink-0 bg-[var(--ink)] px-3 py-2 font-[var(--mono)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cream)]">01 / System</span>
        <h1 className="font-[var(--display)] text-3xl uppercase leading-[0.92] tracking-tight sm:text-5xl">运行环境</h1>
        <span aria-hidden="true" className="hidden h-1 flex-1 bg-[var(--line)] sm:block" />
      </div>
      <p className="mt-3 text-[var(--text-muted)]">检查核心组件与媒体工具的运行状态。</p>
      {error && <p className="mt-8 border-4 border-[var(--line)] bg-[var(--orange)] p-4 font-semibold text-[var(--ink)] shadow-[7px_7px_0_var(--line)]">后端未启动，请运行 npm run backend。</p>}
      {health && (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(health).map(([name, value]) => (
            <div key={name} className="environment-card border-4 border-[var(--line)] p-5 shadow-[7px_7px_0_var(--line)]">
              <dt className="font-[var(--mono)] text-sm uppercase tracking-wider">{name.replace("_", "-")}</dt>
              <dd className="mt-3 break-all font-[var(--mono)] font-semibold">{value ?? "未找到"}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
