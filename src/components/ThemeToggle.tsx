import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = theme;
}

function savedTheme(): string | null {
  try {
    return localStorage.getItem("fluxget-theme");
  } catch {
    return null;
  }
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem("fluxget-theme", theme);
  } catch {
    // The selected theme still applies for the current page session.
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function followSystem(event: MediaQueryListEvent) {
      if (savedTheme() !== null) return;
      const nextTheme = event.matches ? "dark" : "light";
      applyTheme(nextTheme);
      setTheme(nextTheme);
    }

    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    saveTheme(nextTheme);
    setTheme(nextTheme);
  }

  const label = theme === "dark" ? "切换到亮色模式" : "切换到暗色模式";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center border-2 border-[var(--line)] bg-[var(--canvas)] text-lg text-[var(--text)] shadow-[3px_3px_0_var(--line)] transition hover:bg-[var(--yellow)] hover:text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--pink)]"
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
