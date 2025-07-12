import type { I18nMessages } from "../types";
import { en } from "./en.ts";

export const locales = {
  en,
} as const satisfies Record<string, I18nMessages>;

export type Locale = keyof typeof locales;

/**
 * Retrieves a translated error message based on the provided locale and keyword.
 *
 * @param locale - The locale to use for translation.
 * @param keyword - The keyword that identifies the specific error message.
 * @param params - An object containing parameters to replace in the message.
 * @returns The translated error message with placeholders replaced by actual values.
 */
export const getTranslatedErrorMessage = (
  locale: Locale,
  keyword: string,
  params: Record<string, any>,
): string => {
  const messages = locales[locale] || locales.en;
  const messageFactory = messages[keyword] || messages.default;
  return messageFactory({ ...params, keyword });
};
