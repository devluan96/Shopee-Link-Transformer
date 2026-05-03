import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/src/hooks/useTheme.tsx";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-slate-800">
      <button
        onClick={() => setTheme("light")}
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
          theme === "light"
            ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700"
            : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
        }`}
        title="Light mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
          theme === "dark"
            ? "bg-slate-700 text-orange-400 shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
        }`}
        title="Dark mode"
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
          theme === "system"
            ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700"
            : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
        }`}
        title="System preference"
      >
        <Monitor size={16} />
      </button>
    </div>
  );
}
