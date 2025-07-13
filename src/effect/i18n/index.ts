import { en } from "./en.ts";

export type MessageFactory = (
  params: Record<string, any> & { keyword: string },
) => string;

export type I18nMessages = Record<string, MessageFactory> & {
  default: MessageFactory;
};

export const locales = {
  en,
} as const satisfies Record<string, I18nMessages>;

export type Locale = keyof typeof locales;
