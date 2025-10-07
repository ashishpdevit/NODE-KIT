/**
 * i18n Helper for Notifications
 * 
 * This module provides utilities for translating notification messages.
 * Translations are loaded from separate locale files for better maintainability.
 */

import { translations, defaultLocale, isLocaleSupported } from "./locales";

/**
 * Translation function type
 */
type TranslationFunction = (key: string, variables?: Record<string, unknown>) => string;

/**
 * Custom translations registry
 * Map locale to custom translation function
 */
const translationRegistry: Map<string, TranslationFunction> = new Map();

/**
 * Runtime translations (can be loaded dynamically)
 */
const runtimeTranslations: Record<string, Record<string, string>> = {};

/**
 * Simple variable interpolation
 */
function interpolate(template: string, variables?: Record<string, unknown>): string {
  if (!variables) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

/**
 * Register a custom translation function for a locale
 */
export function registerTranslationFunction(locale: string, translateFn: TranslationFunction) {
  translationRegistry.set(locale.toLowerCase(), translateFn);
}

/**
 * Get translations for a locale
 */
function getTranslationsForLocale(locale: string): Record<string, string> {
  const normalizedLocale = locale.toLowerCase();
  
  // Check runtime translations first
  if (runtimeTranslations[normalizedLocale]) {
    return runtimeTranslations[normalizedLocale];
  }
  
  // Check built-in translations
  if (isLocaleSupported(normalizedLocale)) {
    return translations[normalizedLocale as keyof typeof translations];
  }
  
  // Try base locale (e.g., "en" from "en-US")
  const baseLocale = normalizedLocale.split("-")[0];
  if (isLocaleSupported(baseLocale)) {
    return translations[baseLocale as keyof typeof translations];
  }
  
  // Fallback to default locale
  return translations[defaultLocale];
}

/**
 * Translate a message using the key and locale
 * 
 * @param key - The i18n key (e.g., "messages.push_notification.shipment.new_request.title")
 * @param locale - The target locale (e.g., "en", "ar", "fr", "es")
 * @param variables - Variables to interpolate in the message
 * @returns Translated and interpolated message
 */
export function translate(
  key: string,
  locale: string,
  variables?: Record<string, unknown>
): string {
  const normalizedLocale = locale.toLowerCase();
  
  // Check if custom translation function is registered
  const customTranslate = translationRegistry.get(normalizedLocale);
  if (customTranslate) {
    return customTranslate(key, variables);
  }

  // Get translations for locale
  const localeTranslations = getTranslationsForLocale(normalizedLocale);
  const template = localeTranslations[key] || key;
  
  return interpolate(template, variables);
}

/**
 * Batch translate multiple keys
 */
export function translateBatch(
  keys: string[],
  locale: string,
  variables?: Record<string, unknown>
): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key of keys) {
    result[key] = translate(key, locale, variables);
  }
  
  return result;
}

/**
 * Check if a translation exists for a given key and locale
 */
export function hasTranslation(key: string, locale: string): boolean {
  const localeTranslations = getTranslationsForLocale(locale);
  return key in localeTranslations;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): string[] {
  return [...Object.keys(translations), ...Object.keys(runtimeTranslations)];
}

/**
 * Add translations for a locale
 * This can be used to dynamically load translations at runtime
 */
export function addTranslations(locale: string, newTranslations: Record<string, string>) {
  const normalizedLocale = locale.toLowerCase();
  
  if (!runtimeTranslations[normalizedLocale]) {
    runtimeTranslations[normalizedLocale] = {};
  }
  
  Object.assign(runtimeTranslations[normalizedLocale], newTranslations);
}

/**
 * Load translations from a custom source
 * Example: Load from database, API, or other sources
 */
export async function loadTranslationsForLocale(
  locale: string,
  loader: () => Promise<Record<string, string>>
): Promise<void> {
  try {
    const loadedTranslations = await loader();
    addTranslations(locale, loadedTranslations);
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    throw error;
  }
}

/**
 * Export supported locales
 */
export { supportedLocales, defaultLocale } from "./locales";

