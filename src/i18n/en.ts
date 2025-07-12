import type { I18nMessages } from "../types";

export const en: I18nMessages = {
  default: ({ keyword }) => `must pass '${keyword}' validation`,
  true: () => "must match any schema",
  false: () => "must not match any schema",
  not: () => "must not match the schema",
  type: ({ type }) =>
    `must be of type ${
      Array.isArray(type)
        ? type
            .map((t) => `'${t}'`)
            .join(", ")
            .replace(/, ([^,]*)$/, " or $1")
        : `'${type}'`
    }`,
};
