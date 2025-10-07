/**
 * Translations index
 * Export all available translations
 */

import { en } from "./en";
import { ar } from "./ar";

/**
 * All available translations
 */
export const translations = {
  en,
  ar,
} as const;

/**
 * Supported locales
 */
export const supportedLocales = Object.keys(translations) as Array<keyof typeof translations>;

/**
 * Default locale
 */
export const defaultLocale = "en";

/**
 * Get translation for a locale
 */
export function getTranslation(locale: string): Record<string, string> | undefined {
  const normalizedLocale = locale.toLowerCase();
  return translations[normalizedLocale as keyof typeof translations];
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): boolean {
  return supportedLocales.includes(locale.toLowerCase() as any);
}

export type SupportedLocale = keyof typeof translations;
export type TranslationKey = keyof typeof en;

