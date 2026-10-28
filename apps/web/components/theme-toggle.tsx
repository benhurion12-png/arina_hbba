"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("hbba-theme", next ? "dark" : "light");
  }

  return (
    <button className="icon-button" onClick={toggleTheme} aria-label={dark ? "Включить светлую тему" : "Включить темную тему"} type="button">
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
