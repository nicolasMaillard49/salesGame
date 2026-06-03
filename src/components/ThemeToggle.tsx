"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // sync depuis l'attribut posé par le script anti-flash (système externe au mount)
    const cur = (document.documentElement.dataset.theme as Theme) || "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(cur);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("sg-theme", next);
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en clair" : "Passer en sombre"}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
      className="w-9 h-9 rounded-full grid place-items-center text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--glass-line)] bg-[var(--glass)] transition"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
    </button>
  );
}
