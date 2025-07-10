import type { I18nMessages } from "../types/i18n.ts";
import { en } from "./en.ts";
import { get } from "../utils/get.ts";

export const locales = {
  en,
} as const satisfies Record<string, I18nMessages>;

export type Locale = keyof typeof locales;

/**
 * Retrieves a translated error message based on the provided locale and keyword.
 *
 * @param locale - The locale to use for translation.
 * @param path - The path to the error message in the locale file.
 * @param keyword - The keyword that identifies the specific error message.
 * @param params - An object containing parameters to replace in the message.
 * @returns The translated error message with placeholders replaced by actual values.
 */
export const getTranslatedErrorMessage = (
  locale: Locale,
  path: string,
  keyword: string,
  params: Record<string, any>,
): string => {
  const messages = locales[locale] || locales.en;
  let message = get<I18nMessages, string>(messages, path) || messages.default;

  for (const [key, value] of Object.entries(
    Object.assign(params, { keyword }),
  )) {
    message = message.replaceAll(`{{${key}}}`, String(value));
  }

  return message;
};
