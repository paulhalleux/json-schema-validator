import type { I18nMessages } from "../types";

export const en: I18nMessages = {
  default: ({ keyword }) => `must pass '${keyword}' validation`,
  true: () => "must match any schema",
  false: () => "must not match any schema",
};
