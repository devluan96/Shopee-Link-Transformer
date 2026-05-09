import { Languages } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useLocale } from "@/src/hooks/useLocale";

export function LanguageToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useLocale();

  const options = [
    {
      value: "vi" as const,
      shortLabel: "VI",
      fullLabel: t("common.language.vietnamese"),
    },
    {
      value: "en" as const,
      shortLabel: "EN",
      fullLabel: t("common.language.english"),
    },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-slate-800",
        className,
      )}
      aria-label={t("common.language.switch")}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl text-gray-500 dark:text-slate-400",
          compact ? "h-7 w-7" : "h-8 w-8",
        )}
      >
        <Languages size={16} />
      </div>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLocale(option.value)}
          aria-label={option.fullLabel}
          aria-pressed={locale === option.value}
          className={cn(
            "rounded-xl font-black uppercase tracking-[0.16em] transition-all",
            compact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-[11px]",
            locale === option.value
              ? "bg-white text-orange-600 shadow-sm dark:bg-slate-700"
              : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300",
          )}
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  );
}
