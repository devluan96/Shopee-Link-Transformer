import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/src/hooks/useTheme.tsx";
import { cn } from "@/src/lib/utils";
import { useLocale } from "@/src/hooks/useLocale";

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-slate-800",
        className,
      )}
    >
      <button
        onClick={() => setTheme("light")}
        className={`flex items-center justify-center rounded-xl transition-all ${
          compact ? "h-7 w-7" : "h-8 w-8"
        } ${
          theme === "light"
            ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700"
            : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
        }`}
        title={t("common.theme.light")}
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex items-center justify-center rounded-xl transition-all ${
          compact ? "h-7 w-7" : "h-8 w-8"
        } ${
          theme === "dark"
            ? "bg-slate-700 text-orange-400 shadow-sm"
            : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
        }`}
        title={t("common.theme.dark")}
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`flex items-center justify-center rounded-xl transition-all ${
          compact ? "h-7 w-7" : "h-8 w-8"
        } ${
          theme === "system"
            ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700"
            : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
        }`}
        title={t("common.theme.system")}
      >
        <Monitor size={16} />
      </button>
    </div>
  );
}
