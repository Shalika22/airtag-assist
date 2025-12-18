"use client";

import { useEffect, useMemo, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
    return;
  }
  root.setAttribute("data-theme", mode);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeMode | null) ?? "system";
    setMode(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    // Persist + apply
    localStorage.setItem("theme", mode);
    applyTheme(mode);
  }, [mode]);

  const options = useMemo(
    () =>
      [
        { id: "system", label: "System" },
        { id: "light", label: "Light" },
        { id: "dark", label: "Dark" }
      ] as const,
    []
  );

  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--border)", background: "var(--panel)", borderRadius: 999, padding: 4 }}>
      {options.map((o) => {
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setMode(o.id)}
            style={{
              border: "1px solid transparent",
              background: active ? "var(--panel-strong)" : "transparent",
              color: "var(--text)",
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer"
            }}
            aria-pressed={active}
            title={`Switch theme to ${o.label}`}
            type="button"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}


