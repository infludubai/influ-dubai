import { Sun, Moon } from "lucide-react"
import { useThemeStore } from "@/store/themeStore"

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === "dark"

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg
        text-muted-foreground hover:text-foreground hover:bg-muted
        transition-colors duration-150 ${className}`}
    >
      {isDark
        ? <Sun className="h-[18px] w-[18px]" />
        : <Moon className="h-[18px] w-[18px]" />
      }
    </button>
  )
}
