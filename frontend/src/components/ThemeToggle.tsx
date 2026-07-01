"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ variant = "default" }: { variant?: "default" | "ghost-white" }) {
  const { resolved, setTheme } = useTheme();

  const toggle = () => setTheme(resolved === "dark" ? "light" : "dark");

  if (variant === "ghost-white") {
    return (
      <button
        onClick={toggle}
        title={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
      >
        {resolved === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      title={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {resolved === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
