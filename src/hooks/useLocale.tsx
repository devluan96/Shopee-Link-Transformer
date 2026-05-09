import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getTranslation, messages } from "@/src/i18n";

export type Locale = "vi" | "en";
type TranslationParams = Record<string, string | number>;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isVietnamese: boolean;
  t: (path: string, params?: TranslationParams) => string;
  messages: (typeof messages)[Locale];
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = "hotsnew.locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "vi";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" ? "en" : "vi";
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<LocaleContextType>(
    () => ({
      locale,
      setLocale: setLocaleState,
      toggleLocale: () =>
        setLocaleState((current) => (current === "vi" ? "en" : "vi")),
      isVietnamese: locale === "vi",
      t: (path: string, params?: TranslationParams) =>
        getTranslation(locale, path, params),
      messages: messages[locale],
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
