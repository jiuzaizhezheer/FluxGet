import { Navigate, NavLink, Route, Routes } from "react-router";
import ThemeToggle from "./components/ThemeToggle";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--canvas)] text-[var(--text)] antialiased transition-colors">
      <header className="border-b-4 border-[var(--line)] bg-[var(--canvas)] transition-colors">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="font-[var(--display)] text-xl uppercase tracking-tight text-[var(--text)]">
            Flux<span className="text-[var(--pink)]">Get</span>
          </NavLink>
          <div className="flex items-center gap-2">
            <nav className="flex gap-2 font-[var(--mono)] text-xs font-semibold uppercase tracking-wider text-[var(--text)] sm:text-sm">
              <NavLink to="/" className="border-2 border-[var(--line)] px-3 py-2 transition hover:bg-[var(--yellow)] hover:text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--pink)]">
                下载
              </NavLink>
              <NavLink to="/settings" className="border-2 border-[var(--line)] px-3 py-2 transition hover:bg-[var(--pink)] hover:text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--pink)]">
                环境
              </NavLink>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
