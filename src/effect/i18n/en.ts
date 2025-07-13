import type { I18nMessages } from ".";

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
  minimum: ({ minimum }) => `must be greater than or equal to ${minimum}`,
  exclusiveMinimum: ({ minimum }) => `must be greater than ${minimum}`,
  maximum: ({ maximum }) => `must be less than or equal to ${maximum}`,
  exclusiveMaximum: ({ maximum }) => `must be less than ${maximum}`,
  multipleOf: ({ multipleOf }) => `must be a multiple of ${multipleOf}`,
};
