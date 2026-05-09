import { en } from "./en";
import { vi } from "./vi";
import type { Locale } from "@/src/hooks/useLocale";

export const messages = {
  vi,
  en,
} as const;

type TranslationParams = Record<string, string | number>;

export function getTranslation(
  locale: Locale,
  path: string,
  params?: TranslationParams,
): string {
  const source = messages[locale] as Record<string, unknown>;
  const value = path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);

  if (typeof value !== "string") return path;

  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (_, key: string) => {
    const replacement = params[key];
    return replacement === undefined ? `{${key}}` : String(replacement);
  });
}
